# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/@ged/types/package.json ./packages/@ged/types/
COPY packages/@ged/utils/package.json ./packages/@ged/utils/
COPY packages/@ged/config/package.json ./packages/@ged/config/
COPY packages/@ged/database/package.json ./packages/@ged/database/

RUN pnpm install --frozen-lockfile --filter=api...

# ─── Stage 2: builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copia toda a estrutura do stage deps (preserva symlinks do pnpm)
COPY --from=deps /app ./
# Sobrepõe com código-fonte (node_modules excluído via .dockerignore)
COPY . .

RUN pnpm --filter=@ged/database build \
 && pnpm --filter=@ged/types build \
 && pnpm --filter=@ged/utils build \
 && pnpm --filter=api build

# ─── Stage 3: runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# pnpm virtual store — alvos dos symlinks
COPY --from=builder /app/node_modules ./node_modules

# API — estrutura do workspace preservada para resolução de módulos via pnpm symlinks
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Shared packages compilados + seus node_modules (symlinks pnpm para typeorm, pg, etc.)
COPY --from=builder /app/packages/@ged/database/package.json ./packages/@ged/database/
COPY --from=builder /app/packages/@ged/database/dist ./packages/@ged/database/dist
COPY --from=builder /app/packages/@ged/database/node_modules ./packages/@ged/database/node_modules
COPY --from=builder /app/packages/@ged/types/package.json ./packages/@ged/types/
COPY --from=builder /app/packages/@ged/types/dist ./packages/@ged/types/dist
COPY --from=builder /app/packages/@ged/types/node_modules ./packages/@ged/types/node_modules
COPY --from=builder /app/packages/@ged/utils/package.json ./packages/@ged/utils/
COPY --from=builder /app/packages/@ged/utils/dist ./packages/@ged/utils/dist
COPY --from=builder /app/packages/@ged/utils/node_modules ./packages/@ged/utils/node_modules

USER nestjs

EXPOSE 3333

CMD ["node", "apps/api/dist/main"]
