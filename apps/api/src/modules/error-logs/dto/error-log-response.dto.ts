import type {
  ErrorLogLevel,
  ErrorLogSource,
} from '../schemas/error-log.schema';

export class ErrorLogResponseDto {
  readonly id!: string;
  readonly source!: ErrorLogSource;
  readonly level!: ErrorLogLevel;
  readonly message!: string;
  readonly stack!: string | null;
  readonly code!: string | null;
  readonly statusCode!: number | null;
  readonly method!: string | null;
  readonly url!: string | null;
  readonly userAgent!: string | null;
  readonly ip!: string | null;
  readonly userId!: string | null;
  readonly userEmail!: string | null;
  readonly requestId!: string | null;
  readonly context!: Record<string, unknown> | null;
  readonly createdAt!: Date;

  constructor(partial: ErrorLogResponseDto) {
    Object.assign(this, partial);
  }
}

export class PaginatedErrorLogResponseDto {
  readonly data!: ErrorLogResponseDto[];
  readonly total!: number;
  readonly page!: number;
  readonly limit!: number;

  constructor(partial: PaginatedErrorLogResponseDto) {
    Object.assign(this, partial);
  }
}
