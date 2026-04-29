# ─── Dev: instala deps e roda em watch mode ──────────────────────────────────
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copia apenas os manifests para cache de layer (rebuild só quando deps mudam)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/@ged/ui/package.json ./packages/@ged/ui/
COPY packages/@ged/types/package.json ./packages/@ged/types/
COPY packages/@ged/utils/package.json ./packages/@ged/utils/
COPY packages/@ged/config/package.json ./packages/@ged/config/

RUN pnpm install --frozen-lockfile --filter=web...

# Copia o código-fonte inicial (em dev, volumes sobrepõem esses arquivos)
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY apps/web/next.config.ts ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/postcss.config.mjs ./apps/web/

COPY packages/@ged/ui/src ./packages/@ged/ui/src
COPY packages/@ged/types/src ./packages/@ged/types/src
COPY packages/@ged/utils/src ./packages/@ged/utils/src
COPY packages/@ged/config ./packages/@ged/config

CMD ["pnpm", "--filter=web", "dev"]
