# GED Systa — Project Guidelines

**GED Systa** é um Sistema de Gerenciamento Eletrônico de Documentos corporativo.
Monorepo: pnpm + Turborepo · Next.js 16.2 (frontend) · NestJS 11 (backend) · PostgreSQL 17 · Redis 7 · Docker.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 16.2, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui, TanStack Query 5, Zod 3, Auth.js (next-auth v5) |
| Backend | NestJS 11, Node 22 LTS, TypeORM 0.3, Passport.js + passport-jwt, bcrypt, Multer, @nestjs/swagger |
| Banco / Cache | PostgreSQL 17, Redis 7 |
| Infra | Docker Compose v2, pnpm 9, Turborepo 2 |

## Estrutura do Monorepo

```
ged-systa/
├── apps/web/          # Next.js 16.2 — App Router
├── apps/api/          # NestJS 11 — REST API
├── packages/
│   ├── @ged/ui        # Componentes Shadcn/ui compartilhados
│   ├── @ged/types     # Tipos TypeScript e DTOs compartilhados
│   ├── @ged/utils     # Funções utilitárias puras (sem side effects)
│   ├── @ged/config    # Configs base: tsconfig, eslint, tailwind
│   └── @ged/database  # Entidades TypeORM e migrations
└── infra/
    └── docker/        # Dockerfiles + docker-compose.yml
```

## Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Arquivos | `kebab-case` | `document-upload.service.ts` |
| Classes / Interfaces | `PascalCase` | `DocumentService`, `IStorageService` |
| Funções / Métodos | `camelCase` | `uploadDocument()`, `findById()` |
| Constantes globais | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE_MB` |
| Colunas do banco | `snake_case` via `@Column({ name })` | `created_at`, `file_name` |
| Tabelas do banco | `snake_case` plural | `documents`, `refresh_tokens` |

## Commits — Conventional Commits

```
feat(documents): adiciona endpoint de upload
fix(auth): corrige rotação de refresh token expirado
chore(deps): atualiza typeorm para 0.3.x
test(documents): adiciona testes unitários no DocumentService
refactor(storage): extrai adapter S3 do StorageService
```

## Princípios de Engenharia

- **SOLID** — Uma responsabilidade por Service; Controllers apenas roteiam; depender de abstrações (interfaces)
- **DRY** — Tipos compartilhados em `@ged/types`; UI em `@ged/ui`; utils em `@ged/utils`; nunca duplicar lógica entre módulos
- **KISS** — Máx. ~150 linhas por componente React; REST simples antes de GraphQL; código legível > código "inteligente"
- **YAGNI** — Nenhuma feature sem requisito concreto; sem abstrações para casos de uso únicos
- **Fail Fast** — Validar DTOs com `class-validator` na entrada; validar variáveis de ambiente com Zod no startup

## Design Patterns (visão geral)

- **Repository Pattern** — `*.repository.ts` abstrai TypeORM dos Services
- **Service Layer** — Toda lógica de negócio em `*.service.ts`; controllers finos
- **CQRS** — `commands/` (escrita) e `queries/` (leitura) no módulo `documents/`
- **Adapter Pattern** — `LocalStorageAdapter` / `S3StorageAdapter` implementam `IStorageService`
- **Observer / Domain Events** — `EventEmitter2` para eventos como `document.uploaded`
- **Module Pattern** — Cada feature NestJS é um módulo auto-suficiente

## Regras de TypeScript

Estas regras são **inegociáveis** e se aplicam a todo arquivo `.ts` e `.tsx` do projeto.

| Regra | Obrigação |
|---|---|
| `strict: true` em todo `tsconfig.json` | NUNCA desabilitar flags individualmente; `strict` habilita todas de uma vez |
| Proibido `any` | Usar `unknown` + type narrowing (`typeof`, `instanceof`, type guards). Se inevitável, adicionar `// eslint-disable-next-line @typescript-eslint/no-explicit-any` com justificativa |
| Proibido `as T` sem prova | Type assertion só quando o compilador não consegue inferir e o tipo é provadamente correto. Preferir type guards |
| Proibido `enum` nativo | Usar `const object + as const + typeof`: `const ROLE = { ADMIN: 'ADMIN' } as const; type Role = typeof ROLE[keyof typeof ROLE]` |
| `interface` vs `type` | `interface` para shapes de objetos e contratos (DTOs, entidades, props de componentes). `type` para unions, intersections e aliases primitivos |
| `readonly` em imutáveis | Props de DTOs de entrada, configs e constantes de domínio devem ser `readonly` |
| Sem `Function`, `Object`, `{}` | Usar assinaturas explícitas: `(id: string) => Promise<void>`. Usar `Record<K, V>` para mapas genéricos |
| `import type` para tipos | `import type { User } from '...'` — NUNCA importar apenas tipos com `import` comum |
| Sem `!` non-null assertion | Usar `??`, `?.` ou validar explicitamente. `!` permitido apenas em setup de testes (`beforeEach`) com comentário explicativo |
| `??` no lugar de `\|\|` para null/undefined | `||` avalia falsy (inclui `0`, `''`). Usar `??` quando só quer cobrir `null`/`undefined` |
| Generics descritivos | `T` só quando o contexto é óbvio. Caso contrário: `TEntity`, `TResult`, `TFilter` |
| Usar `satisfies` para objetos literais | `satisfies` valida o objeto contra um tipo sem widening — obrigatório em configs, mocks e constantes de domínio |

## Estratégia de Testes

> **Testes são obrigatórios.** Toda feature deve ser entregue com seus testes — nunca depois. Código sem teste não está pronto.

### Pirâmide

| Camada | Ferramenta | Localização |
|---|---|---|
| Unitários | Jest | `*.spec.ts` co-localizados ao lado do arquivo testado |
| Integração | Jest + Supertest | `apps/api/test/integration/` |
| E2E | Playwright | `apps/web/test/e2e/` |

### Cobertura Mínima

- 80% de branches nas camadas `service`, `repository`, `hooks/` e `lib/`
- Toda lógica de negócio e todo hook de dados deve ter cobertura unitária

### Regras Inegociáveis

| Regra | Detalhe |
|---|---|
| Nomenclatura | `'should [comportamento] when [condição]'` |
| Isolamento | Cada `it` independente — sem estado compartilhado entre testes |
| Mocks | Mockar **todas** as dependências externas: banco, Redis, `fetch`, `next-auth/react` |
| Asserções | Usar apenas `expect` — proibido `console.log` em testes |
| Factories | Fixtures e factories em `test/factories/` |

### Referência Completa

Detalhes de setup, padrões de mock e exemplos: [`#file:.github/instructions/testing.instructions.md`](instructions/testing.instructions.md)

---

## Documentação de Referência

- Arquitetura completa: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- Variáveis de ambiente: [`docs/ENVIRONMENT.md`](../docs/ENVIRONMENT.md)
- Git Flow e contribuição: [`docs/CONTRIBUTING.md`](../docs/CONTRIBUTING.md)
- Scripts e pipeline: [`docs/SCRIPTS.md`](../docs/SCRIPTS.md)
