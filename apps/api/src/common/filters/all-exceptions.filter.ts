import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { JwtPayload } from '@ged/types';
import { ErrorLogsService } from '../../modules/error-logs/error-logs.service';
import {
  ERROR_LOG_LEVEL,
  ERROR_LOG_SOURCE,
  type ErrorLogLevel,
} from '../../modules/error-logs/schemas/error-log.schema';

interface AuthedRequest extends Request {
  user?: JwtPayload;
  id?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly errorLogsService: ErrorLogsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthedRequest>();

    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttp ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as Record<string, unknown> | null)?.[
            'message'
          ] as string | undefined) ??
          (exception instanceof Error
            ? exception.message
            : 'Internal server error');

    const code = isHttp
      ? exception.name.replace('Exception', '').toUpperCase()
      : 'INTERNAL_SERVER_ERROR';

    const level: ErrorLogLevel = !isHttp
      ? ERROR_LOG_LEVEL.FATAL
      : statusCode >= 500
        ? ERROR_LOG_LEVEL.ERROR
        : ERROR_LOG_LEVEL.WARN;

    // Resposta — mantém contrato existente
    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        statusCode,
      },
      timestamp: new Date().toISOString(),
    });

    // Persistência — fail-safe; service nunca lança
    void this.errorLogsService
      .log({
        source: ERROR_LOG_SOURCE.API,
        level,
        message: typeof message === 'string' ? message : String(message),
        stack: exception instanceof Error ? exception.stack : undefined,
        code,
        statusCode,
        method: request.method,
        url: request.originalUrl ?? request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        userId: request.user?.sub,
        userEmail: request.user?.email,
        requestId:
          (request.headers['x-request-id'] as string | undefined) ??
          request.id,
      })
      .catch((err) => {
        this.logger.error(
          `Falha ao logar exceção: ${err instanceof Error ? err.message : String(err)}`,
        );
      });

    // Log estruturado no stdout para tail/observabilidade local
    if (level !== ERROR_LOG_LEVEL.WARN) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode} ${code}: ${String(message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }
  }
}
