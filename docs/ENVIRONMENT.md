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

# ─── MongoDB (logs de erro) ───────────────────────────────────────────────────
MONGO_URL=mongodb://localhost:27017/ged_logs

# ─── Autenticação JWT ─────────────────────────────────────────────────────────
JWT_SECRET=troque-por-um-segredo-forte-de-pelo-menos-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outro-segredo-forte-diferente-do-jwt-secret
JWT_REFRESH_EXPIRES_IN=7d

# ─── Next.js / Auth.js ────────────────────────────────────────────────────────
NEXTAUTH_SECRET=troque-por-um-segredo-forte
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3333

# ─── Storage — Google Drive (OAuth2 + refresh token) ─────────────────────────
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
STORAGE_MAX_FILE_SIZE=26214400

# ─── E-mail (SMTP) ───────────────────────────────────────────────────────────
MAIL_HOST=localhost        # MailHog em dev; ex: smtp.sendgrid.net em prod
MAIL_PORT=1025             # 1025 MailHog | 587 STARTTLS | 465 SSL
MAIL_SECURE=false          # true apenas para porta 465 (SSL direto)
MAIL_USER=                 # vazio para MailHog
MAIL_PASS=                 # vazio para MailHog
MAIL_FROM=noreply@ged.local

# ─── Aplicação ────────────────────────────────────────────────────────────────
APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3333
```

## Validação no Startup da API

`apps/api/src/config/env.validation.ts` usa Zod para validar **todas** as variáveis críticas ao iniciar.
A aplicação **não sobe** se qualquer variável obrigatória estiver ausente ou inválida — esse arquivo é a
fonte de verdade do schema; não duplicar aqui, para não divergir dele com o tempo.

O armazenamento de documentos usa **exclusivamente o Google Drive** (`GoogleDriveStorageService`,
`apps/api/src/modules/storage/storage.service.ts`) — por isso os 4 `GOOGLE_DRIVE_*` são obrigatórios
incondicionalmente. Não existe driver `local`/`s3` implementado.

Em Docker, essas variáveis precisam estar listadas no bloco `environment:` do serviço `api` em
`infra/docker-compose*.yml` — estar só no `.env` da raiz não basta, o compose só repassa ao container
o que está explicitamente mapeado lá.

## Variáveis por Serviço

| Variável | Serviço | Obrigatória | Padrão |
|---|---|---|---|
| `DATABASE_URL` | API | ✅ | — |
| `REDIS_URL` | API | — | `redis://localhost:6379` |
| `MONGO_URL` | API | — | `mongodb://localhost:27017/ged_logs` |
| `JWT_SECRET` | API | ✅ (≥32 chars) | — |
| `JWT_REFRESH_SECRET` | API | ✅ (≥32 chars) | — |
| `JWT_EXPIRES_IN` | API | — | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | API | — | `7d` |
| `MAIL_HOST` | API | ✅ | — |
| `GOOGLE_DRIVE_CLIENT_ID` | API | ✅ | — |
| `GOOGLE_DRIVE_CLIENT_SECRET` | API | ✅ | — |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | API | ✅ | — |
| `GOOGLE_DRIVE_FOLDER_ID` | API | ✅ | — |
| `STORAGE_MAX_FILE_SIZE` | API | — | `26214400` (25 MiB) |
| `NEXTAUTH_SECRET` | Web | ✅ | — |
| `NEXTAUTH_URL` | Web | ✅ | — |
| `NEXT_PUBLIC_API_URL` | Web | ✅ | — |

## Como obter as credenciais do Google Drive

1. Crie/selecione um projeto no [Google Cloud Console](https://console.cloud.google.com/) e habilite a
   **Google Drive API**.
2. Em "APIs & Services → Credentials", crie um **OAuth 2.0 Client ID** — isso gera o
   `GOOGLE_DRIVE_CLIENT_ID` e o `GOOGLE_DRIVE_CLIENT_SECRET`.
3. Rode o consent flow OAuth2 com o escopo `https://www.googleapis.com/auth/drive.file` (ex.: via
   [OAuth Playground](https://developers.google.com/oauthplayground), configurando lá seu próprio
   Client ID/Secret em "Use your own OAuth credentials") para gerar o `GOOGLE_DRIVE_REFRESH_TOKEN`.
   Esse token não expira enquanto o app OAuth estiver em produção (ou o usuário de teste continuar
   autorizado).
4. Pegue o `GOOGLE_DRIVE_FOLDER_ID` na URL da pasta de destino no Drive:
   `https://drive.google.com/drive/folders/<FOLDER_ID>`.

## Ambientes

| Arquivo | Uso |
|---|---|
| `.env` | Desenvolvimento local (não commitado) |
| `.env.example` | Template commitado — manter atualizado com toda nova variável |
| `.env.test` | Testes de integração — banco e Redis de teste isolados |
| Variáveis de CI/CD | Injetadas pelo pipeline (GitHub Actions Secrets) |
