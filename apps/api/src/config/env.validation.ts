import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(3333),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_USER: z.string().default(''),
  MAIL_PASS: z.string().default(''),
  MAIL_FROM: z.string().min(1).default('noreply@ged.local'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  MONGO_URL: z
    .string()
    .min(1)
    .default('mongodb://localhost:27017/ged_logs'),
});

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
