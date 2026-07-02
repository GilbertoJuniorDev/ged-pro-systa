# GED Pro — Guia de Agentes

**GED Pro** (`ged-systa`) é um Sistema de Gerenciamento Eletrônico de Documentos corporativo. Monorepo pnpm + Turborepo.

> **Este arquivo é a fonte canônica para qualquer agente.** `docs/ARCHITECTURE.md` e `.github/instructions/*` contêm seções de arquitetura-alvo (aspiracional) que ainda **não** refletem o código. Em conflito, valem **este arquivo e o código-fonte**.

## Stack real (conferida em `package.json` / `infra/`)

| Camada | Tecnologias |
|---|---|
| Frontend (`apps/web`) | Next.js **15.3** (App Router), React 19, TypeScript 5.5, Tailwind CSS **v4** (CSS-first, **sem** `tailwind.config`), TanStack Query 5, react-hook-form + Zod 3, next-auth v5 (Auth.js), sonner, lucide-react |
| Backend (`apps/api`) | NestJS 11, Node 22 LTS, TypeORM 0.3 (Postgres 17), Mongoose (Mongo 7 — só error-logs), Redis 7, Passport + passport-jwt, bcrypt, class-validator, Zod (validação de env), Swagger |
| Infra | Docker Compose v2, pnpm 9, Turborepo 2 |

> Ignore "Next 16.2 / CQRS / storage adapters / enum nativo" dos docs antigos — não existem no código.

## Monorepo

```
apps/api/                 NestJS — API REST                → apps/api/CLAUDE.md
apps/web/                 Next.js — App Router             → apps/web/CLAUDE.md
packages/@ged/config      tsconfig + eslint base compartilhados
packages/@ged/types       tipos/DTOs compartilhados (fonte única de tipos)
packages/@ged/utils       funções puras
packages/@ged/database    entidades TypeORM + migrations   → packages/@ged/database/CLAUDE.md
packages/@ged/ui          componentes React compartilhados
infra/                    Dockerfiles + docker-compose
```

Ordem de build (Turbo): `@ged/config → @ged/types → @ged/utils/@ged/database → @ged/ui → api/web`.

## Comandos

```bash
# Setup inicial
cp .env.example .env  &&  pnpm install  &&  pnpm docker:dev  &&  pnpm db:migrate  &&  pnpm dev

# Quality gate (idêntico ao CI — rodar antes de declarar pronto)
pnpm lint  &&  pnpm type-check  &&  pnpm test

# Escopo por pacote
pnpm --filter=api <script>        # dev | build | test | test:cov | test:e2e
pnpm --filter=web <script>
pnpm --filter=@ged/database db:migrate | db:migrate:revert
```

Detalhes de scripts/pipeline: [`docs/SCRIPTS.md`](docs/SCRIPTS.md). Variáveis de ambiente: [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md).

## Regras de TypeScript (inegociáveis — todo `.ts`/`.tsx`)

- `strict: true` em todo tsconfig — nunca desabilitar flags individuais.
- **Proibido** `any` (usar `unknown` + narrowing), `as T` sem prova, `!` non-null (usar `??`/`?.`), `enum` nativo, `Function`/`Object`/`{}`.
- **`enum` nativo → `const object + as const + type`**: `const ROLE = { ADMIN: 'ADMIN' } as const; type Role = typeof ROLE[keyof typeof ROLE]` (ver `@ged/types`).
- `import type { X }` para imports só-de-tipo.
- `??` no lugar de `||` para null/undefined (`||` pega `0`/`''`).
- `interface` para shapes/contratos (DTOs, props); `type` para unions/aliases.
- `readonly` em props de DTOs de entrada e constantes; `satisfies` em objetos literais de config/mock.

## Nomenclatura

| Item | Convenção | Exemplo |
|---|---|---|
| Arquivos | kebab-case + sufixo de papel | `users.service.ts`, `create-user.dto.ts` |
| Classes / Interfaces | PascalCase | `UsersService`, `IUserRepository` |
| Funções / hooks | camelCase / `useX` | `findById()`, `usePermissoes()` |
| Tokens de DI | SCREAMING_SNAKE (string const) | `USER_REPOSITORY` |
| Colunas do banco | snake_case via `@Column({ name })` | `password_hash` |
| Tabelas | snake_case plural | `users`, `refresh_tokens` |

## Vocabulário PT/EN (importante)

A base **mistura idiomas de propósito**: infra/rotas/HTTP em inglês (`auth/login`, `UsersController`); campos de domínio frequentemente em português (`pessoaFisica`, `permissaoIds`, `nome`, `sobrenome`, `acao`, `entidade`, `usuarioId`). **Combine sempre com o vocabulário do módulo vizinho** — não "traduza" código existente. Toda copy de UI é PT-BR.

## Testes (obrigatórios junto da feature)

- `*.spec.ts` co-localizado ao lado do arquivo testado (Jest).
- Mockar todas as deps externas via token de DI (`jest.Mocked<IXRepository>`).
- Nome: `'should <comportamento> when <condição>'`; cada `it` isolado.
- Cobertura ≥ 80% em `service`/`repository`/`hooks`/`lib`.
- Integração/E2E: `apps/api/test/` (Supertest) · `apps/web/test/e2e/` (Playwright).

## Engenharia

- **SOLID** — 1 responsabilidade por Service; Controllers finos (só roteiam); depender de abstrações (tokens de interface), não de classes concretas.
- **DRY** — tipos em `@ged/types`, UI em `@ged/ui`, utils em `@ged/utils`; nunca duplicar lógica entre módulos.
- **KISS / YAGNI** — sem abstração prematura; máx. ~150 linhas por componente React; nada sem requisito concreto.
- **Fail Fast** — DTOs validados com `class-validator` na entrada; env validada com Zod no startup.

## Mapa de referência

| Preciso de… | Vá para |
|---|---|
| Convenções backend (NestJS) | [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md) |
| Convenções frontend (Next.js) | [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md) |
| Entidades / migrations | [`packages/@ged/database/CLAUDE.md`](packages/@ged/database/CLAUDE.md) |
| Lente de code review | [`docs/agents/code-review.md`](docs/agents/code-review.md) |
| Git Flow / commits / PR | [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) |
| Variáveis de ambiente | [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) |
| Scripts / pipeline | [`docs/SCRIPTS.md`](docs/SCRIPTS.md) |
| Arquitetura completa (⚠️ parte aspiracional) | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |

## Commits e PR

Conventional Commits; scopes: `auth documents categories users storage database web api infra deps`. PRs pequenos (≤ ~400 linhas), CI verde, ≥1 aprovação. **Nunca** commitar/`--force push` direto em `main`/`develop`. Detalhes: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).
