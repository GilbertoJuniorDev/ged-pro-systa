import { z } from 'zod';

// docker-compose repassa variáveis não definidas como string vazia (`${VAR}`);
// trata '' como ausente para que opcionais não falhem na validação
function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => (v === '' ? undefined : v), schema.optional());
}

const baseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN_SHORT: z.string().default('1d'),
  PORT: z.coerce.number().int().positive().default(3333),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_USER: z.string().default(''),
  MAIL_PASS: z.string().default(''),
  MAIL_FROM: z.string().min(1).default('noreply@ged.local'),
  MAIL_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  MONGO_URL: z
    .string()
    .min(1)
    .default('mongodb://localhost:27017/ged_logs'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  S3_BUCKET: z.string().min(1),
  S3_REGION: z.string().min(1),
  S3_ENDPOINT: optionalString(z.string().url()),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  S3_ACCESS_KEY_ID: optionalString(z.string().min(1)),
  S3_SECRET_ACCESS_KEY: optionalString(z.string().min(1)),
  // Adapter do Google Drive não é mais usado (Storage agora é S3); variáveis
  // mantidas opcionais até a remoção do código do Drive
  GOOGLE_DRIVE_CLIENT_ID: optionalString(z.string().min(1)),
  GOOGLE_DRIVE_CLIENT_SECRET: optionalString(z.string().min(1)),
  GOOGLE_DRIVE_REFRESH_TOKEN: optionalString(z.string().min(1)),
  GOOGLE_DRIVE_FOLDER_ID: optionalString(z.string().min(1)),
  STORAGE_MAX_FILE_SIZE: z.coerce.number().int().positive().default(26_214_400),
  UPLOADS_DIR: z.string().default('uploads'),
  BRANDING_LOGO_MAX_SIZE: z.coerce.number().int().positive().default(2_097_152),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(12).optional(),
  THROTTLE_TTL: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

const envSchema = baseEnvSchema.refine(
  (env) => !!env.S3_ACCESS_KEY_ID === !!env.S3_SECRET_ACCESS_KEY,
  {
    message: 'S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY devem ser definidas juntas',
    path: ['S3_SECRET_ACCESS_KEY'],
  },
);

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(
      `Variáveis de ambiente inválidas:\n${JSON.stringify(formatted, null, 2)}`,
    );
  }

  return result.data;
}
