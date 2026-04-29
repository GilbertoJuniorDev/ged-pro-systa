# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/@ged/ui/package.json ./packages/@ged/ui/
COPY packages/@ged/types/package.json ./packages/@ged/types/
COPY packages/@ged/utils/package.json ./packages/@ged/utils/
COPY packages/@ged/config/package.json ./packages/@ged/config/

RUN pnpm install --frozen-lockfile --filter=web...

# ─── Stage 2: builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copia toda a estrutura do stage deps (preserva symlinks do pnpm)
COPY --from=deps /app ./
# Sobrepõe com código-fonte (node_modules excluído via .dockerignore)
COPY . .

RUN pnpm --filter=web build

# ─── Stage 3: runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/web/server.js"]
