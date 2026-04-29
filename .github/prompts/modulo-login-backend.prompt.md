---
agent: agent
description: Implementa o backend completo de autenticação (login, refresh, logout, me) no GED Systa
---

Implemente a feature de autenticação no backend do GED Systa, do zero.
Siga estritamente as regras de:
- #file:.github/instructions/backend.instructions.md
- #file:.github/instructions/database.instructions.md

Use as definições canônicas de entidades e estrutura de diretórios documentadas em
#file:docs/ARCHITECTURE.md (seções 4 e 6).

---

## Escopo

**Incluído:**
- Entidades `User` e `RefreshToken` (packages/@ged/database)
- Tipos compartilhados: `Role`, `JwtPayload`, `AuthTokensResponse` (packages/@ged/types)
- Config: `auth.config.ts`, `database.config.ts`, validação de env com Zod
- `DatabaseModule` com TypeOrmModule
- Common layer: `TransformInterceptor`, `HttpExceptionFilter`, `JwtAuthGuard`, `@Public()`, `@CurrentUser()`
- `UsersModule`: `IUserRepository`, `UsersRepository`, `UsersService` (findByEmail, findById, create)
- `AuthModule` completo com strategies, service, controller e DTOs
- Migrations: `CreateUsersTable` e `CreateRefreshTokensTable`
- Seed: um usuário admin inicial em `apps/api/src/database/seeds/admin.seed.ts`
- Wiring final: `app.module.ts` e `main.ts`

**Excluído:** `UsersController` (CRUD de usuários é feature separada).

---

## Fase 1 — Entidades (packages/@ged/database)

Crie as entidades em `packages/@ged/database/src/entities/`:

**`user.entity.ts`**
- Tabela `users`, PK uuid
- Colunas: `id`, `name`, `email` (unique), `password_hash` (com `select: false`), `role` (enum PostgreSQL: ADMIN | MANAGER | VIEWER, default VIEWER), `is_active` (boolean, default true), `created_at`, `updated_at`
- Relacionamentos: `@OneToMany` para `Document` e `RefreshToken`
- Exporte também `const ROLE = { ADMIN: 'ADMIN', MANAGER: 'MANAGER', VIEWER: 'VIEWER' } as const` e `type Role = typeof ROLE[keyof typeof ROLE]` no mesmo arquivo (nunca `enum` TypeScript)

**`refresh-token.entity.ts`**
- Tabela `refresh_tokens`, PK uuid
- Colunas: `id`, `token` (unique), `user_id`, `expires_at`, `created_at`
- Relacionamento: `@ManyToOne` para `User` com `onDelete: 'CASCADE'`

Exporte ambas no `packages/@ged/database/src/index.ts`.

---

## Fase 2 — Tipos compartilhados (packages/@ged/types)

Em `packages/@ged/types/src/index.ts`, exporte:
- `Role` e `ROLE` re-exportados de `@ged/database`
- `interface JwtPayload { sub: string; email: string; role: Role }`
- `interface AuthTokensResponse { accessToken: string; refreshToken: string; expiresIn: number }`

---

## Fase 3 — Config e DatabaseModule (apps/api/src)

**`config/env.validation.ts`** — schema Zod que valida no startup:
`DATABASE_URL`, `JWT_SECRET` (min 32 chars), `JWT_EXPIRY`, `JWT_REFRESH_SECRET` (min 32 chars), `JWT_REFRESH_EXPIRY`, `PORT` (default 3333), `NODE_ENV`

**`config/database.config.ts`** — `registerAs('database', ...)` com TypeORM config usando `DATABASE_URL`

**`config/auth.config.ts`** — `registerAs('auth', ...)` com JWT_SECRET, JWT_EXPIRY, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRY

**`database/database.module.ts`** — `TypeOrmModule.forRootAsync` importando `ConfigService`, com as entidades `User` e `RefreshToken`, `synchronize: false`, `migrationsRun: true`

---

## Fase 4 — Common Layer (apps/api/src/common)

- **`interceptors/transform.interceptor.ts`** — implementa `NestInterceptor`, envolve toda resposta no formato `{ success, data, message, timestamp }`
- **`filters/http-exception.filter.ts`** — implementa `ExceptionFilter`, transforma `HttpException` no formato `{ success: false, error: { code, message, statusCode }, timestamp }`
- **`guards/jwt-auth.guard.ts`** — estende `AuthGuard('jwt')`, verifica o decorator `@Public()` para bypass
- **`decorators/public.decorator.ts`** — `@Public()` com `SetMetadata('isPublic', true)`
- **`decorators/current-user.decorator.ts`** — `@CurrentUser()` extrai `request.user` tipado como `JwtPayload`

---

## Fase 5 — UsersModule (apps/api/src/modules/users)

- **`users.repository.ts`** — implementa interface `IUserRepository` com métodos: `findByEmail(email: string)`, `findById(id: string)`, `create(data: CreateUserData)`. Use `InjectRepository(User)` do TypeORM internamente
- **`users.service.ts`** — injeta `IUserRepository` via token `USER_REPOSITORY`. Expõe: `findByEmail`, `findById`, `create`
- **`users.module.ts`** — registra o provider com token `USER_REPOSITORY`, exporta `UsersService`

---

## Fase 6 — AuthModule (apps/api/src/modules/auth)

**DTOs:**
- `dto/login.dto.ts` — `email: string` (@IsEmail), `password: string` (@IsString, @MinLength(8)); campos `readonly`
- `dto/refresh-token.dto.ts` — `refreshToken: string` (@IsString, @IsJWT); campo `readonly`

**Strategies (Passport):**
- `strategies/jwt.strategy.ts` — `ExtractJwt.fromAuthHeaderAsBearerToken()`, valida `JWT_SECRET`, retorna `JwtPayload`
- `strategies/jwt-refresh.strategy.ts` — extrai de body `refreshToken`, valida `JWT_REFRESH_SECRET`, retorna `{ userId, refreshToken }`

**`auth.service.ts`** — métodos:
- `validateUser(email, password)` — busca usuário via `UsersService`, compara com `bcrypt.compare`, retorna usuário sem `passwordHash` ou `null`
- `login(user)` — gera access token (JWT_SECRET) e refresh token (JWT_REFRESH_SECRET), salva hash do refresh token no banco via `RefreshToken` entity, retorna `AuthTokensResponse`
- `refreshTokens(userId, refreshToken)` — busca o refresh token no banco, verifica `expiresAt`, deleta o registro atual, emite novo par de tokens
- `logout(userId, refreshToken)` — deleta o registro de refresh token do banco (estratégia: delete simples)

**`auth.controller.ts`** — rota base `/auth`, `@UseGuards(JwtAuthGuard)` global por padrão:
- `POST /auth/login` — `@Public()`, recebe `LoginDto`, chama `validateUser` + `login`, retorna tokens
- `POST /auth/refresh` — `@Public()`, recebe `RefreshTokenDto`, chama `refreshTokens`
- `POST /auth/logout` — protegido, usa `@CurrentUser()` para extrair userId, chama `logout`
- `GET /auth/me` — protegido, retorna `@CurrentUser()` (dados do JWT sem ir ao banco)

**`auth.module.ts`** — importa `UsersModule`, `PassportModule`, `JwtModule.registerAsync` para access token. Registra ambas as strategies como providers.

---

## Fase 7 — Migrations (packages/@ged/database/src/migrations)

Crie duas migrations com `down()` implementado:
- `{timestamp}-CreateUsersTable` — tabela `users` com todas as colunas da entidade
- `{timestamp}-CreateRefreshTokensTable` — tabela `refresh_tokens` com FK `user_id` referenciando `users(id)` com `ON DELETE CASCADE`

---

## Fase 8 — Seed

Crie `apps/api/src/database/seeds/admin.seed.ts`:
- Função `seedAdmin(dataSource: DataSource)` que cria um usuário admin se não existir (lookup por email)
- Email: `admin@ged.local`, senha hasheada com `bcrypt` (salt rounds: 12), role: ADMIN
- Chamar no bootstrap apenas se `NODE_ENV !== 'production'`

---

## Fase 9 — Wiring

**`app.module.ts`** — importe: `ConfigModule.forRoot({ isGlobal: true, validate })`, `DatabaseModule`, `UsersModule`, `AuthModule`. Registre `JwtAuthGuard` como guard global via `APP_GUARD`.

**`main.ts`** — configure globalmente: `ValidationPipe` (whitelist: true, forbidNonWhitelisted: true, transform: true), `HttpExceptionFilter`, `TransformInterceptor`. Chame `seedAdmin` após `app.listen`.