# ─── Dev: instala deps e roda em watch mode ──────────────────────────────────
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copia apenas os manifests para cache de layer (rebuild só quando deps mudam)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/@ged/types/package.json ./packages/@ged/types/
COPY packages/@ged/utils/package.json ./packages/@ged/utils/
COPY packages/@ged/config/package.json ./packages/@ged/config/
COPY packages/@ged/database/package.json ./packages/@ged/database/

RUN pnpm install --frozen-lockfile --filter=api...

# Copia o código-fonte inicial (em dev, volumes sobrepõem esses arquivos)
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/tsconfig.build.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

COPY packages/@ged/types/src ./packages/@ged/types/src
COPY packages/@ged/types/tsconfig.json ./packages/@ged/types/
COPY packages/@ged/utils/src ./packages/@ged/utils/src
COPY packages/@ged/utils/tsconfig.json ./packages/@ged/utils/
COPY packages/@ged/config ./packages/@ged/config
COPY packages/@ged/database/src ./packages/@ged/database/src
COPY packages/@ged/database/tsconfig.json ./packages/@ged/database/

# Compila os pacotes compartilhados (main aponta para dist/)
RUN pnpm --filter=@ged/database build \
 && pnpm --filter=@ged/types build \
 && pnpm --filter=@ged/utils build

CMD ["pnpm", "--filter=api", "dev"]
