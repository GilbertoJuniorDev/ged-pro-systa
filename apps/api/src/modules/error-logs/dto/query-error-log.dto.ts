import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  ERROR_LOG_LEVEL,
  ERROR_LOG_SOURCE,
  type ErrorLogLevel,
  type ErrorLogSource,
} from '../schemas/error-log.schema';

export class QueryErrorLogDto {
  @IsOptional()
  @IsEnum(Object.values(ERROR_LOG_SOURCE))
  readonly source?: ErrorLogSource;

  @IsOptional()
  @IsEnum(Object.values(ERROR_LOG_LEVEL))
  readonly level?: ErrorLogLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly statusCode?: number;

  @IsOptional()
  @IsString()
  readonly userId?: string;

  @IsOptional()
  @IsString()
  readonly search?: string;

  @IsOptional()
  @IsISO8601()
  readonly dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  readonly dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit?: number;
}
