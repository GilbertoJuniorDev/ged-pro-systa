import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  ERROR_LOG_LEVEL,
  ERROR_LOG_SOURCE,
  type ErrorLogLevel,
  type ErrorLogSource,
} from '../schemas/error-log.schema';

export interface CreateErrorLogData {
  readonly source: ErrorLogSource;
  readonly level: ErrorLogLevel;
  readonly message: string;
  readonly stack?: string;
  readonly code?: string;
  readonly statusCode?: number;
  readonly method?: string;
  readonly url?: string;
  readonly userAgent?: string;
  readonly ip?: string;
  readonly userId?: string;
  readonly userEmail?: string;
  readonly requestId?: string;
  readonly context?: Record<string, unknown>;
}

/** Body aceito pelo endpoint público `POST /error-logs/client`. */
export class CreateClientErrorLogDto {
  @IsEnum([ERROR_LOG_SOURCE.WEB_CLIENT, ERROR_LOG_SOURCE.WEB_SERVER])
  readonly source!: 'web-client' | 'web-server';

  @IsOptional()
  @IsEnum(Object.values(ERROR_LOG_LEVEL))
  readonly level?: ErrorLogLevel;

  @IsString()
  @MaxLength(2_000)
  readonly message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  readonly stack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  readonly url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly userAgent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly requestId?: string;

  @IsOptional()
  @IsInt()
  readonly statusCode?: number;

  @IsOptional()
  readonly context?: Record<string, unknown>;
}
