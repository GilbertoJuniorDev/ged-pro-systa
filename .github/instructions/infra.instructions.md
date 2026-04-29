---
description: "Use when modifying Docker files, docker-compose.yml, Dockerfiles, or infra configuration. Covers service topology, multi-stage build patterns, healthcheck configuration, and environment variable wiring for the GED Systa stack."
applyTo: "infra/**"
---

# Infraestrutura — Docker (infra/)

## Serviços Docker Compose

| Container | Imagem | Porta | Função |
|---|---|---|---|
| `web` | `ged-systa/web` | `3000:3000` | Frontend Next.js (standalone) |
| `api` | `ged-systa/api` | `3333:3333` | Backend NestJS |
| `db` | `postgres:17-alpine` | `5432:5432` | Banco principal |
| `redis` | `redis:7-alpine` | `6379:6379` | Cache + sessões + token blacklist |
| `adminer` | `adminer:latest` | `8080:8080` | DB UI — **apenas profile `dev`** |

## `infra/docker-compose.yml`

```yaml
version: "3.9"

services:
  db:
    image: postgres:17-alpine
    container_name: ged-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    networks: [ged-network]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ged-redis
    restart: unless-stopped
    ports: ["6379:6379"]
    volumes: [redis_data:/data]
    networks: [ged-network]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ..
      dockerfile: infra/docker/api.Dockerfile
    container_name: ged-api
    restart: unless-stopped
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    ports: ["3333:3333"]
    networks: [ged-network]

  web:
    build:
      context: ..
      dockerfile: infra/docker/web.Dockerfile
    container_name: ged-web
    restart: unless-stopped
    depends_on: [api]
    environment:
      NEXT_PUBLIC_API_URL: http://api:3333
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
    ports: ["3000:3000"]
    networks: [ged-network]

  adminer:
    image: adminer:latest
    container_name: ged-adminer
    restart: unless-stopped
    profiles: [dev]
    ports: ["8080:8080"]
    networks: [ged-network]

volumes:
  postgres_data:
  redis_data:

networks:
  ged-network:
    driver: bridge
```

## `infra/docker/api.Dockerfile` — Multi-stage

```dockerfile
# Stage 1 — Dependências
FROM node:22-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY pnpm-workspace.yaml turbo.json package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter=api...

# Stage 2 — Build
FROM node:22-alpine AS builder
RUN npm install -g pnpm turbo
WORKDIR /app
COPY --from=deps /app .
COPY apps/api/ apps/api/
RUN pnpm turbo build --filter=api

# Stage 3 — Produção
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3333
CMD ["node", "dist/main.js"]
```

## `infra/docker/web.Dockerfile` — Multi-stage

```dockerfile
# Stage 1 — Dependências
FROM node:22-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY pnpm-workspace.yaml turbo.json package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter=web...

# Stage 2 — Build
FROM node:22-alpine AS builder
RUN npm install -g pnpm turbo
WORKDIR /app
COPY --from=deps /app .
COPY apps/web/ apps/web/
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo build --filter=web

# Stage 3 — Produção (Next.js standalone)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

## Regras

- **Healthcheck obrigatório** em `db` e `redis` — `api` e `web` usam `depends_on: condition: service_healthy`
- **Nunca** commitar credenciais — sempre via variáveis de ambiente injetadas
- `adminer` somente no profile `dev` — nunca expor em produção
- Builds sempre via `--filter=<app>...` para incluir dependências do workspace corretamente
