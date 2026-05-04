# Scripts e Pipeline — GED Pro

## Scripts pnpm (raiz do monorepo)

```bash
# ─── Desenvolvimento ──────────────────────────────────────────
pnpm dev              # Inicia todos os apps em paralelo (web + api)

# ─── Build ────────────────────────────────────────────────────
pnpm build            # Build de produção com cache Turborepo

# ─── Qualidade ────────────────────────────────────────────────
pnpm lint             # ESLint em todos os packages
pnpm type-check       # TypeScript check em todos os packages
pnpm test             # Todos os testes do monorepo
pnpm --filter=api test:cov   # Cobertura de testes da API (≥80%)

# ─── Banco de Dados ───────────────────────────────────────────
pnpm db:migrate              # Rodar migrations TypeORM pendentes
pnpm db:migrate:revert       # Reverter a última migration

# ─── Docker ───────────────────────────────────────────────────
pnpm docker:dev       # Subir todos os containers + adminer (profile dev)
pnpm docker:up        # Subir containers (sem adminer)
pnpm docker:down      # Derrubar todos os containers

# ─── Limpeza ──────────────────────────────────────────────────
pnpm clean            # Limpa cache Turborepo + remove todos os node_modules
```

## Scripts por App/Package

```bash
# Somente API
pnpm --filter=api dev
pnpm --filter=api build
pnpm --filter=api test
pnpm --filter=api test:e2e

# Somente Web
pnpm --filter=web dev
pnpm --filter=web build
pnpm --filter=web test:e2e

# Database package
pnpm --filter=@ged/database db:migrate
pnpm --filter=@ged/database db:migrate:generate -- NomeDaMigration
```

## Pipeline Turborepo — Ordem de Build

```
@ged/config  ──►  @ged/types  ──►  @ged/utils  ──►  @ged/ui
                                        │
                                   @ged/database
                                        │
                               ┌────────┴────────┐
                              api               web
```

Turborepo cacheia os outputs. Um package só é re-buildado se seus inputs mudarem.

## `turbo.json` — Tasks

| Task | DependsOn | Cache | Outputs |
|---|---|---|---|
| `build` | `^build` | ✅ | `.next/**`, `dist/**` |
| `dev` | — | ❌ (persistent) | — |
| `lint` | `^lint` | ✅ | — |
| `test` | `^build` | ✅ | — |
| `type-check` | `^build` | ✅ | — |
| `db:migrate` | — | ❌ | — |

## CI Pipeline (GitHub Actions — `.github/workflows/ci.yml`)

Executado em todo push e PR:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm type-check`
4. `pnpm build`
5. `pnpm test`

Para o merge ser permitido: todos os steps devem passar + ao menos 1 aprovação de code review.

## Setup Inicial do Projeto

```bash
# Pré-requisitos: Node 22+, pnpm 9+, Docker

git clone <repo>
cd ged-systa

cp .env.example .env
# Editar .env com os valores locais

pnpm install

pnpm docker:dev         # Sobe PostgreSQL + Redis + Adminer
pnpm db:migrate         # Cria o schema do banco

pnpm dev                # Inicia web (3000) + api (3333)
```
