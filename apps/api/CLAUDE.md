# apps/api — Backend NestJS

Regras gerais e de TypeScript: [`/AGENTS.md`](../../AGENTS.md). Este guia cobre só o que é específico da API.

## Arquitetura real (verificada)

Camadas por feature-module: **`Controller → Service → Repository (via token de interface) → Entity`**.

- Controllers **finos**: recebem request, chamam Service, retornam Response DTO.
- Toda regra de negócio no Service.
- Escrita multi-entidade → extrair para `*.use-case.ts` com `dataSource.transaction(async (manager) => …)` via `@InjectDataSource()`. Ex.: `modules/users/use-cases/create-user-with-profile.use-case.ts`.

> **CQRS, Adapter de Storage e EventEmitter/Domain Events são planejados, NÃO implementados.** Não invente essas estruturas — siga o padrão de `users`/`company`/`permissions`.

## DI por token de interface

Services dependem de uma **interface**, nunca da classe concreta:

```ts
// users.service.ts
export const USER_REPOSITORY = 'USER_REPOSITORY';
// ctor: @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository

// users.module.ts
providers: [{ provide: USER_REPOSITORY, useClass: UsersRepository }, UsersService]
```

O repo concreto (`*.repository.ts`) é `@Injectable()` e usa `@InjectRepository(Entity)`. Interface + tipos `CreateXData`/`UpdateXData` em `interfaces/*-repository.interface.ts`. Referência: `modules/users/`.

## Autenticação (dois níveis)

- `JwtAuthGuard` registrado como `APP_GUARD` (`app.module.ts`) → **toda rota protegida por padrão**. Abrir com `@Public()`.
- **Role-based**: `@Roles(ROLE.ADMIN)` + `@UseGuards(JwtAuthGuard, RolesGuard)`.
- **Permission-based**: `@Permissions('nome')` + `PermissionsGuard` (**ADMIN faz bypass**).
- `@CurrentUser()` extrai o `JwtPayload` (`{ sub, email, role }`). bcrypt 12 rounds.

## Contrato HTTP

- Input: DTO com `class-validator` (`ValidationPipe` global é `whitelist + forbidNonWhitelisted + transform` — campos desconhecidos são rejeitados). Campos `readonly`.
- Output: Response DTO plano com `constructor(partial) { Object.assign(this, partial) }` — nunca vazar a entidade crua.
- Sucesso é envelopado por `TransformInterceptor` → `{ success, data, message, timestamp }`.
- Erro: lançar exceção Nest padrão (`NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException`) com **mensagem em PT-BR**; `AllExceptionsFilter` formata `{ success:false, error:{ code, message, statusCode } }` e persiste em Mongo `error_logs`.
- Swagger em `/api/docs`: decorar controllers com `@ApiTags`, `@ApiOperation`, `@ApiResponse`.

## Auditoria

Em ações de escrita, disparar (fire-and-forget):

```ts
void this.auditLogsService.log({ usuarioId, acao, entidade, entidadeId, dadosAnteriores, dadosNovos, ipCliente, userAgent });
```

## Checklist — adicionar um módulo

1. `modules/<feature>/` com `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `interfaces/<feature>-repository.interface.ts`, `dto/`.
2. Entidade + migration → seguir [`packages/@ged/database/CLAUDE.md`](../../packages/@ged/database/CLAUDE.md).
3. Bind do repo por token (`{ provide: X_REPOSITORY, useClass }`); injetar a interface no Service.
4. Guardar o controller (`@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles`/`@Permissions`); `@Public()` só em rota aberta.
5. Validar input com DTO; retornar via `*ResponseDto`.
6. `*.spec.ts` ao lado (mockar repos pelo token de DI); integração/e2e em `test/` se tocar HTTP/DB.
7. `auditLogsService.log(...)` nas mutações. Registrar o módulo em `app.module.ts`.
8. Nova env var → registrar em `config/env.validation.ts` (Zod), **não só** no `.env.example`.

## Revisão

Antes de finalizar, aplicar a lente de [`docs/agents/code-review.md`](../../docs/agents/code-review.md).
