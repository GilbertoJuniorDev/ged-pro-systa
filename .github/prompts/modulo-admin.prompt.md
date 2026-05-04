---
agent: agent
description: Implementa o módulo de configurações administrativas (acesso exclusivo ao usuário ADMIN) com criação de usuários no GED Pro
---

Implemente o módulo de configurações administrativas no GED Pro.
Siga estritamente as regras de:
- #file:.github/instructions/backend.instructions.md
- #file:.github/instructions/frontend.instructions.md
- #file:.github/instructions/project.instructions.md
- #file:.github/instructions/testing.instructions.md

Use as definições canônicas de tipos compartilhados de
#file:packages/@ged/types/src/index.ts
e a arquitetura documentada em #file:docs/ARCHITECTURE.md.

Use como referência visual obrigatória o template:
- #file:template/darkpaineladmin.html

---

## Escopo

**Incluído:**
- `@Roles()` decorator e `RolesGuard` na common layer do backend
- `CreateUserDto` e `UserResponseDto` no `UsersModule`
- `UsersController` com `POST /users` restrito a `ROLE.ADMIN`
- Update no `UsersModule` para registrar controller e guard
- Seção "Sistema" na sidebar — visível somente para `ROLE.ADMIN`
- `admin/layout.tsx` — guard server-side por role
- `admin/settings/page.tsx` — painel de configurações fiel ao template
- `admin/users/page.tsx` — página de criação de usuário
- `components/admin/create-user-form.tsx` — formulário client com Zod + react-hook-form
- `hooks/use-create-user.ts` — mutation TanStack Query
- Testes: `users.controller.spec.ts` e `use-create-user.spec.ts`

**Excluído:** listagem, edição e exclusão de usuários; funcionalidade real de Google Drive, Backup e Logs; RolesGuard global.

---

## Fase 1 — Backend: RBAC Infrastructure

### `apps/api/src/common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import type { Role } from '@ged/types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### `apps/api/src/common/guards/roles.guard.ts`

- Implementa `CanActivate`, injeta `Reflector`
- Lê `ROLES_KEY` do handler/class via `reflector.getAllAndOverride`
- Se não há roles definidas, retorna `true` (permissivo)
- Lê `request.user` (tipado como `JwtPayload` — disponível após `JwtAuthGuard`)
- Se `user` ausente ou `user.role` não está nas roles requeridas → `ForbiddenException('Acesso negado: permissão insuficiente')`

---

## Fase 2 — Backend: DTOs e UsersController

### `apps/api/src/modules/users/dto/create-user.dto.ts`

Campos `readonly` com `class-validator`:
- `name: string` — `@IsString()`, `@MinLength(2)`
- `email: string` — `@IsEmail()`
- `password: string` — `@IsString()`, `@MinLength(8)`
- `role?: Role` — `@IsOptional()`, `@IsIn([ROLE.MANAGER, ROLE.VIEWER])` — ADMIN nunca pode ser criado via formulário

### `apps/api/src/modules/users/dto/user-response.dto.ts`

Campos `readonly`: `id`, `name`, `email`, `role`, `isActive`, `createdAt` — omite `passwordHash`. Construtor com `Object.assign(this, partial)`.

### `apps/api/src/modules/users/users.controller.ts`

- `@Controller('users')`, `@UseGuards(JwtAuthGuard, RolesGuard)` a nível de classe
- `POST /users` — `@Roles(ROLE.ADMIN)`, `@HttpCode(HttpStatus.CREATED)`
  1. `usersService.findByEmail(dto.email)` → se encontrado, `ConflictException('E-mail já cadastrado')`
  2. `bcrypt.hash(dto.password, 12)` → `passwordHash`
  3. `usersService.create({ name, email, passwordHash, role: dto.role ?? ROLE.VIEWER })`
  4. Retorna `new UserResponseDto({ id, name, email, role, isActive, createdAt })`

### Update `apps/api/src/modules/users/users.module.ts`

Adicionar ao módulo:
- `controllers: [UsersController]`
- `providers: [..., RolesGuard]`

---

## Fase 3 — Frontend: Sidebar Admin Section

### Update `apps/web/src/components/layout/sidebar-nav-items.ts`

Adicionar após `NAV_ITEMS`:

```typescript
export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Configurações Admin',
    href: '/admin/settings',
    iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
] as const;
```

### Update `apps/web/src/components/layout/sidebar.tsx`

- Importar `ADMIN_NAV_ITEMS` de `./sidebar-nav-items`
- Derivar `const isAdmin = user.role === 'ADMIN'`
- Após o loop de `NAV_ITEMS`, renderizar condicionalmente quando `isAdmin`:
  ```tsx
  {isAdmin && (
    <>
      <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
        Sistema
      </div>
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={/* mesma lógica de ativo/inativo */}>
            <svg ...><path d={item.iconPath} /></svg>
            {item.label}
          </Link>
        );
      })}
    </>
  )}
  ```
- Usar `pathname.startsWith(item.href)` para admin (não igualdade exata) para marcar ativo em sub-rotas

---

## Fase 4 — Frontend: Admin Layout e Páginas

### `apps/web/src/app/(dashboard)/admin/layout.tsx`

- Server Component (sem `'use client'`)
- `const session = await auth()` de `../../../lib/auth`
- Se `!session?.user || session.user.role !== 'ADMIN'` → `redirect('/')` de `next/navigation`
- Renderiza `<>{children}</>`

### `apps/web/src/app/(dashboard)/admin/settings/page.tsx`

- Server Component, `metadata: { title: 'Configurações Admin — GED Pro' }`
- Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` fiel ao `darkpaineladmin.html`
- **Cards visuais (sem funcionalidade):** Google Drive, Serviço de Backup, Logs de Atividade, Permissões de Módulos
- **Card funcional:** Permissões de Usuários — botão "Gerenciar Usuários" usa `<Link href="/admin/users">`
- **Card full width:** Monitor de Desempenho — valores estáticos (CPU 12%, RAM 35%, Disco 82%), badge animado "SISTEMA ONLINE"

### `apps/web/src/app/(dashboard)/admin/users/page.tsx`

- Server Component, `metadata: { title: 'Criar Usuário — GED Pro' }`
- Header com breadcrumb `← Configurações Admin` (Link)
- Título e subtítulo descritivos
- Container `max-w-lg` com card `bg-slate-900 rounded-2xl border border-slate-700 p-6`
- Importa e renderiza `<CreateUserForm />`

---

## Fase 5 — Frontend: Hook e Formulário

### `apps/web/src/hooks/use-create-user.ts`

`'use client'` — hook de mutation:
- `useSession()` para obter `session.user.accessToken`
- `useMutation` chamando `apiClient.post<ApiResponse<UserCreated>>('/users', payload, { token })`
- `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['users'] })`

Tipos locais no arquivo:
```typescript
interface CreateUserPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role?: string;
}

interface UserCreated {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}
```

### `apps/web/src/components/admin/create-user-form.tsx`

`'use client'`. Schema Zod local:
```typescript
const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  confirmPassword: z.string(),
  role: z.enum([ROLE.MANAGER, ROLE.VIEWER]),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});
```

Comportamento:
- `react-hook-form` + `zodResolver`, `defaultValues: { role: ROLE.VIEWER }`
- Campos: name, email, password, confirmPassword, role (select com VIEWER/MANAGER)
- `onSubmit`: `mutateAsync(payload)` → `reset()` → `router.refresh()`
- Erros inline abaixo de cada campo
- Erro da API em bloco `role="alert"` `data-testid="error-message"`
- Botão com estado `disabled={isPending}` e texto "Criando..." durante loading

---

## Testes

### `apps/api/src/modules/users/users.controller.spec.ts`

- `'should create a user when email is not taken'` — verifica que `usersService.create` é chamado com `passwordHash` (não `password`), retorna `UserResponseDto` sem `passwordHash`
- `'should use provided role when creating user'` — verifica role MANAGER passada corretamente
- `'should throw ConflictException when email is already taken'` — verifica que `usersService.create` **não** é chamado

### `apps/web/src/hooks/use-create-user.spec.ts`

Mockar: `next-auth/react` (`useSession` retorna `{ data: { user: { accessToken: 'test-token' } } }`), `../lib/api-client` (`apiClient.post`).
Wrapper: `QueryClientProvider` com `QueryClient` (retry: false).

- `'should call apiClient.post with correct payload on mutation'`
- `'should expose error when API returns 409 conflict'`
- `'should expose error when API returns 403 forbidden'`
