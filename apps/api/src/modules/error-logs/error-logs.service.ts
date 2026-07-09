import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import {
  ErrorLogsRepository,
  type ErrorLogFilter,
  type PaginatedErrorLogs,
} from './error-logs.repository';
import type { CreateErrorLogData } from './dto/create-error-log.dto';
import { ERROR_LOG_LEVEL } from './schemas/error-log.schema';
import { MailService } from '../mail/mail.service';
import {
  SystemSettingsService,
  SYSTEM_SETTING_KEYS,
} from '../system-settings/system-settings.service';

export const ERROR_LOGS_REDIS_CLIENT = 'ERROR_LOGS_REDIS_CLIENT';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
]);

/** Throttle TTL in seconds — 1 alert per unique error key per window. */
const ALERT_THROTTLE_SECONDS = 300;

/**
 * Escapa caracteres sensíveis a HTML em strings vindas de fonte não confiável
 * (endpoint público `POST /error-logs/client`) antes de persistir, reduzindo
 * risco de stored-XSS / log-injection quando os logs são exibidos no painel admin.
 */
function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => sanitize(v, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = sanitize(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

@Injectable()
export class ErrorLogsService {
  private readonly logger = new Logger(ErrorLogsService.name);

  constructor(
    private readonly repository: ErrorLogsRepository,
    private readonly mailService: MailService,
    private readonly systemSettingsService: SystemSettingsService,
    @Optional()
    @Inject(ERROR_LOGS_REDIS_CLIENT)
    private readonly redisClient: RedisClientType | null,
  ) {}

  /**
   * Persiste um log de erro. Fail-safe: nunca lança — falhas são apenas
   * registradas no logger nativo do Nest para não quebrar o caller.
   * Para erros críticos (error | fatal), envia alerta por e-mail com
   * throttle de 5 minutos por tipo de erro (via Redis).
   */
  async log(data: CreateErrorLogData): Promise<void> {
    try {
      const sanitized: CreateErrorLogData = {
        ...data,
        message: escapeText(data.message),
        stack: data.stack !== undefined ? escapeText(data.stack) : undefined,
        url: data.url !== undefined ? escapeText(data.url) : undefined,
        context: data.context
          ? (sanitize(data.context) as Record<string, unknown>)
          : undefined,
      };
      await this.repository.create(sanitized);
    } catch (err) {
      this.logger.error(
        `Falha ao persistir error log: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const isCritical =
      data.level === ERROR_LOG_LEVEL.ERROR ||
      data.level === ERROR_LOG_LEVEL.FATAL;

    if (!isCritical) return;

    try {
      const alertEmail = await this.systemSettingsService.get(
        SYSTEM_SETTING_KEYS.ERROR_ALERT_EMAIL,
      );
      if (!alertEmail) return;

      void this.sendAlertEmail(alertEmail, data);
    } catch (err) {
      this.logger.error(
        `Falha ao obter e-mail de alerta de erro: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  findAll(filter: ErrorLogFilter): Promise<PaginatedErrorLogs> {
    return this.repository.findAll(filter);
  }

  private async sendAlertEmail(
    to: string,
    data: CreateErrorLogData,
  ): Promise<void> {
    try {
      const throttleKey = `error:alert:${data.level}:${data.code ?? data.statusCode ?? 'unknown'}`;
      const throttled = await this.isThrottled(throttleKey);
      if (throttled) return;

      await this.mailService.sendCriticalErrorAlert(to, {
        level: data.level,
        statusCode: data.statusCode,
        code: data.code,
        source: data.source,
        message: data.message,
        method: data.method,
        url: data.url,
        userId: data.userId,
        requestId: data.requestId,
        stack: data.stack,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.error(
        `Falha ao enviar alerta de erro crítico: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Verifica e aplica throttle via Redis SET NX EX.
   * Fail-open: se Redis não estiver disponível, retorna false (envia o e-mail).
   */
  private async isThrottled(key: string): Promise<boolean> {
    if (!this.redisClient) return false;
    try {
      const result = await this.redisClient.set(key, '1', {
        NX: true,
        EX: ALERT_THROTTLE_SECONDS,
      });
      // result === 'OK' means key was set (first occurrence) → not throttled
      return result === null;
    } catch {
      // Redis unavailable → fail-open (allow email)
      return false;
    }
  }
}
