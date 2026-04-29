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

COPY --from=builder /app/apps/api/dist ./dist
# Pacotes compilados — necessários para os symlinks do pnpm funcionarem
COPY --from=builder /app/packages/@ged/database/package.json ./packages/@ged/database/
COPY --from=builder /app/packages/@ged/database/dist ./packages/@ged/database/dist
COPY --from=builder /app/packages/@ged/types/package.json ./packages/@ged/types/
COPY --from=builder /app/packages/@ged/types/dist ./packages/@ged/types/dist
COPY --from=builder /app/packages/@ged/utils/package.json ./packages/@ged/utils/
COPY --from=builder /app/packages/@ged/utils/dist ./packages/@ged/utils/dist
# deps de runtime ficam no root node_modules do pnpm workspace
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./

USER nestjs

EXPOSE 3333

CMD ["node", "dist/main"]
