import { Injectable, Logger } from '@nestjs/common';
import {
  ErrorLogsRepository,
  type ErrorLogFilter,
  type PaginatedErrorLogs,
} from './error-logs.repository';
import type { CreateErrorLogData } from './dto/create-error-log.dto';

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

  constructor(private readonly repository: ErrorLogsRepository) {}

  /**
   * Persiste um log de erro. Fail-safe: nunca lança — falhas são apenas
   * registradas no logger nativo do Nest para não quebrar o caller.
   */
  async log(data: CreateErrorLogData): Promise<void> {
    try {
      const sanitized: CreateErrorLogData = {
        ...data,
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
  }

  findAll(filter: ErrorLogFilter): Promise<PaginatedErrorLogs> {
    return this.repository.findAll(filter);
  }
}
