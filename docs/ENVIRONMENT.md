# Variáveis de Ambiente — GED Pro

Copie `.env.example` para `.env` e preencha os valores. **Nunca** commite o `.env` com valores reais.

## Template `.env.example`

```dotenv
# ─── Banco de Dados ───────────────────────────────────────────────────────────
DB_USER=ged_user
DB_PASSWORD=ged_password
DB_NAME=ged_systa
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Autenticação JWT ─────────────────────────────────────────────────────────
JWT_SECRET=troque-por-um-segredo-forte-de-pelo-menos-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outro-segredo-forte-diferente-do-jwt-secret
JWT_REFRESH_EXPIRES_IN=7d

# ─── Next.js / Auth.js ────────────────────────────────────────────────────────
NEXTAUTH_SECRET=troque-por-um-segredo-forte
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3333

# ─── Storage ──────────────────────────────────────────────────────────────────
STORAGE_DRIVER=local         # local | s3
STORAGE_LOCAL_PATH=./uploads

# S3 — preencher apenas se STORAGE_DRIVER=s3
# AWS_BUCKET=ged-systa-docs
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=

# ─── Aplicação ────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3333
```

## Validação no Startup da API

O `apps/api/src/config/env.validation.ts` usa Zod para validar **todas** as variáveis críticas ao iniciar.
A aplicação **não sobe** se qualquer variável obrigatória estiver ausente ou inválida.

```typescript
// apps/api/src/config/env.validation.ts
import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3333),
});

export type EnvConfig = z.infer<typeof envSchema>;
```

## Variáveis por Serviço

| Variável | Serviço | Obrigatória | Padrão |
|---|---|---|---|
| `DATABASE_URL` | API | ✅ | — |
| `REDIS_URL` | API | ✅ | — |
| `JWT_SECRET` | API | ✅ (≥32 chars) | — |
| `JWT_REFRESH_SECRET` | API | ✅ (≥32 chars) | — |
| `JWT_EXPIRES_IN` | API | — | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | API | — | `7d` |
| `STORAGE_DRIVER` | API | — | `local` |
| `NEXTAUTH_SECRET` | Web | ✅ | — |
| `NEXTAUTH_URL` | Web | ✅ | — |
| `NEXT_PUBLIC_API_URL` | Web | ✅ | — |

## Ambientes

| Arquivo | Uso |
|---|---|
| `.env` | Desenvolvimento local (não commitado) |
| `.env.example` | Template commitado — manter atualizado com toda nova variável |
| `.env.test` | Testes de integração — banco e Redis de teste isolados |
| Variáveis de CI/CD | Injetadas pelo pipeline (GitHub Actions Secrets) |
