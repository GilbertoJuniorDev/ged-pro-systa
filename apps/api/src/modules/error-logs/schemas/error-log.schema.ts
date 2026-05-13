import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const ERROR_LOG_SOURCE = {
  API: 'api',
  WEB_CLIENT: 'web-client',
  WEB_SERVER: 'web-server',
} as const;
export type ErrorLogSource =
  (typeof ERROR_LOG_SOURCE)[keyof typeof ERROR_LOG_SOURCE];

export const ERROR_LOG_LEVEL = {
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;
export type ErrorLogLevel =
  (typeof ERROR_LOG_LEVEL)[keyof typeof ERROR_LOG_LEVEL];

export type ErrorLogDocument = HydratedDocument<ErrorLog>;

// 30 dias em segundos — TTL automático do MongoDB
const TTL_SECONDS = 60 * 60 * 24 * 30;

@Schema({
  collection: 'error_logs',
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  versionKey: false,
})
export class ErrorLog {
  @Prop({
    type: String,
    enum: Object.values(ERROR_LOG_SOURCE),
    required: true,
    index: true,
  })
  source!: ErrorLogSource;

  @Prop({
    type: String,
    enum: Object.values(ERROR_LOG_LEVEL),
    required: true,
    index: true,
  })
  level!: ErrorLogLevel;

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({ type: String, required: false })
  stack?: string;

  @Prop({ type: String, required: false })
  code?: string;

  @Prop({ type: Number, required: false, index: true })
  statusCode?: number;

  @Prop({ type: String, required: false })
  method?: string;

  @Prop({ type: String, required: false })
  url?: string;

  @Prop({ type: String, required: false })
  userAgent?: string;

  @Prop({ type: String, required: false })
  ip?: string;

  @Prop({ type: String, required: false, index: true })
  userId?: string;

  @Prop({ type: String, required: false })
  userEmail?: string;

  @Prop({ type: String, required: false, index: true })
  requestId?: string;

  @Prop({ type: Object, required: false })
  context?: Record<string, unknown>;

  // Preenchido por timestamps; declarado para tipagem
  createdAt!: Date;
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);

// TTL index — documentos expiram 30 dias após createdAt
ErrorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: TTL_SECONDS });
