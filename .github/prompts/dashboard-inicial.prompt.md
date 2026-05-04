---
agent: agent
description: Implementa o esqueleto inicial do dashboard (layout com sidebar, user menu com logout e página principal) no GED Pro
---

Implemente o esqueleto inicial do dashboard no frontend do GED Pro.
Siga estritamente as regras de:
- #file:.github/instructions/frontend.instructions.md
- #file:.github/instructions/project.instructions.md
- #file:.github/instructions/testing.instructions.md

Use as definições canônicas de tipos compartilhados de
#file:packages/@ged/types/src/index.ts
e a arquitetura documentada em #file:docs/ARCHITECTURE.md (seção 3).

Use como referência visual obrigatória os templates:
- #file:template/esquelto.html       → modo light
- #file:template/darkesquelto.html   → modo dark

---

## Escopo

**Incluído:**
- Layout do dashboard (`app/(dashboard)/layout.tsx`) — Server Component com sessão
- Sidebar (`components/layout/sidebar.tsx`) — nav links + user menu no rodapé
- User menu (`components/layout/user-menu.tsx`) — avatar com iniciais, nome, email e botão "Sair"
- Página inicial (`app/(dashboard)/page.tsx`) — skeleton de stat cards e placeholder de tabela
- Testes unitários: `sidebar.spec.tsx` e `user-menu.spec.tsx`

**Excluído:** CRUD de documentos, categorias, usuários, header separado, notificações, busca global.

---

## Fase 1 — Layout (`apps/web/src/app/(dashboard)/layout.tsx`)

Substitua o TODO existente. Requisitos:
- Server Component (sem `'use client'`)
- Chama `auth()` de `../../lib/auth` para obter a sessão server-side
- Se não houver sessão, `redirect('/login')` via `next/navigation`
- Renderiza estrutura:
  ```
  <div class="flex h-screen overflow-hidden bg-slate-950">
    <Sidebar user={session.user} />
    <div class="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
      {children}
    </div>
  </div>
  ```
- Passa `session.user` (com `name`, `email`, `role`) como prop tipada para `<Sidebar>`
- Props do layout: `interface DashboardLayoutProps { children: React.ReactNode }`
- Tipo auxiliar local: `interface SessionUser { name?: string | null; email?: string | null; role?: string }`

---

## Fase 2 — Sidebar (`apps/web/src/components/layout/sidebar.tsx`)

`'use client'` — co-localizado em `components/layout/`. Requisitos:

**Props:**
```typescript
interface SidebarProps {
  readonly user: {
    readonly name?: string | null;
    readonly email?: string | null;
    readonly role?: string;
  };
}
```

**Estrutura visual** (fiel ao `darkesqueleto.html` / `esquelto.html`):
- `<aside>` com classes: `bg-slate-900 dark:bg-slate-900 w-64 border-r border-slate-700 flex flex-col transition-transform duration-300 absolute z-30 h-full md:relative md:translate-x-0`
- Estado de visibilidade mobile via `useState<boolean>(false)` — `-translate-x-full` quando fechado

**Header da sidebar:**
- Logo `GED Pro` com texto `text-xl font-bold text-indigo-400 tracking-tight`
- Botão de fechar (mobile) com SVG `M6 18L18 6M6 6l12 12`, visível apenas em `md:hidden`

**Nav** (`flex-1 overflow-y-auto py-4 px-3 space-y-1`):
- Usar `usePathname()` de `next/navigation` para detectar rota ativa
- Link ativo: `bg-indigo-900/40 text-indigo-400`
- Link inativo: `text-slate-400 hover:bg-slate-800 hover:text-slate-100`
- Classe base de cada item: `flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors`
- Navegação via `<Link>` de `next/link`

**Links de navegação:**
```
Dashboard  →  href="/"        →  ícone SVG de casa (home)
Documentos →  href="/documents" →  ícone SVG de documento
Categorias →  href="/categories" →  ícone SVG de pastas
```

SVG ícone casa: `M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6`

SVG ícone documento: `M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z`

SVG ícone pastas: `M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10`

**Rodapé da sidebar** (`border-t border-slate-700/50 p-3`):
- Renderiza `<UserMenu user={user} />`

**Overlay mobile** (`#sidebarOverlay`):
- `<div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-20 md:hidden">` — visível quando sidebar aberta
- Ao clicar fecha a sidebar

**Botão de abertura mobile** (no header principal, fora da sidebar):
- Exportar também `SidebarToggle` (botão hamburguer) para ser usado no header — ou emitir o estado pelo Context; a solução mais simples é passar uma prop `onOpen` do layout para o header futuro. **Por ora**, o botão de abertura mobile fica dentro do header embutido no próprio `layout.tsx` como elemento inline simples.

**Máx. 150 linhas** — se ultrapassar, extraia constante `NAV_ITEMS` e mova para arquivo `sidebar-nav-items.ts` co-localizado.

---

## Fase 3 — User Menu (`apps/web/src/components/layout/user-menu.tsx`)

`'use client'`. Requisitos:

**Props:**
```typescript
interface UserMenuProps {
  readonly user: {
    readonly name?: string | null;
    readonly email?: string | null;
    readonly role?: string;
  };
}
```

**Função auxiliar de iniciais** (dentro do arquivo, não exportada):
```typescript
function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
```

**Layout do componente:**
- Botão trigger (ocupa 100% da largura da sidebar):
  ```
  <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                 hover:bg-slate-800 transition-colors group">
    <Avatar />      ← iniciais, bg-indigo-900, border-indigo-700
    <div>           ← nome (truncado) + email (truncado, text-xs text-slate-500)
    <ChevronIcon /> ← rotate quando aberto
  </button>
  ```
- Avatar: `w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-indigo-300 text-sm font-bold border border-indigo-700`

**Popover** (absoluto, `bottom-full left-0 right-0 mb-2`):
- `bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-1`
- Controlado por `useState<boolean>(false)`
- Fechar ao clicar fora: `useRef` no container + `useEffect` com listener `mousedown` no `document`

**Conteúdo do popover:**
- Seção de info (não clicável): nome completo + email em `px-3 py-2 text-sm border-b border-slate-700`
- Único item de menu:
  ```
  <button onClick={() => signOut({ callbackUrl: '/login' })}
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400
                 hover:bg-slate-700 rounded-lg transition-colors">
    <LogoutIcon /> Sair
  </button>
  ```
- `signOut` importado de `next-auth/react`
- SVG ícone logout: `M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1`

---

## Fase 4 — Dashboard Page (`apps/web/src/app/(dashboard)/page.tsx`)

Substitua o TODO existente. Requisitos:
- Server Component (sem `'use client'`)
- Chama `auth()` para obter o nome do usuário (saudação)
- `export const metadata: Metadata = { title: 'Dashboard — GED Pro' }`

**Estrutura da página** (fiel ao template `darkesqueleto.html`):

```
<main class="flex-1 p-4 sm:p-6 lg:p-8">
  <!-- Saudação -->
  <div class="mb-8">
    <h2>Olá, {session.user?.name ?? 'usuário'}</h2>
    <p>Bem-vindo ao GED Pro.</p>
  </div>

  <!-- Stat Cards skeleton (3 cards) -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
    {[...Array(3)].map((_, i) => <StatCardSkeleton key={i} />)}
  </div>

  <!-- Placeholder table -->
  <div class="bg-slate-900 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
    <!-- header -->
    <div class="p-6 border-b border-slate-800 bg-slate-800/50">
      <div class="h-4 bg-slate-700 rounded-md w-48 animate-pulse"></div>
    </div>
    <!-- rows (3 placeholders) -->
    <div class="p-6 divide-y divide-slate-800">
      {[...Array(3)].map((_, i) => <TableRowSkeleton key={i} />)}
    </div>
  </div>
</main>
```

**Sub-componentes internos** (no mesmo arquivo, não exportados, apenas para manter o JSX limpo):
- `StatCardSkeleton`: `bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-sm` com 2 divs animate-pulse
- `TableRowSkeleton`: `py-3 flex items-center justify-between` com 2 divs animate-pulse

**Cores e classes** seguem o template `darkesqueleto.html`:
- Background da página: `bg-slate-950`
- Título: `text-2xl font-bold text-slate-100`
- Subtítulo: `text-slate-400`
- Cards: `bg-slate-900 rounded-xl border border-slate-700`
- Linhas de table placeholder com widths variadas (`w-1/3`, `w-1/2`, `w-1/4`) e `w-16` para o lado direito

---

## Fase 5 — Testes Unitários

Siga todas as regras de `#file:.github/instructions/testing.instructions.md`.

### `apps/web/src/components/layout/sidebar.spec.tsx`

Mock obrigatório no topo:
```typescript
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
jest.mock('./user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu-mock" />,
}));
```

Testes:
- `'should render all navigation links'` — verifica texto Dashboard, Documentos, Categorias
- `'should apply active styles to the current route link'` — mocka `usePathname` retornando `'/'`, verifica classe `bg-indigo-900/40` no link Dashboard
- `'should toggle sidebar visibility when mobile open button is clicked'`
- `'should render UserMenu component in the footer'`

### `apps/web/src/components/layout/user-menu.spec.tsx`

Mock obrigatório:
```typescript
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));
```

Testes:
- `'should display user initials in avatar'` — passa `name: 'João Silva'`, verifica texto `'JS'`
- `'should display "?" when user name is not provided'` — passa `name: null`
- `'should open the menu popover when the user button is clicked'`
- `'should call signOut with callbackUrl /login when logout button is clicked'`
- `'should close popover when clicking outside the component'`

Renderizar com `@testing-library/react`. Usar `userEvent` para clicks. Cada `it` com setup próprio — sem estado compartilhado entre testes.

---

## Regras Gerais

- Toda lógica client em `'use client'`; layouts e páginas como Server Components quando não houver estado
- Máx. ~150 linhas por arquivo — extrair se ultrapassar
- Dark mode: todas as variantes com `dark:` prefix do Tailwind onde necessário
- `next/link` para navegação — nunca `<a href>` direto
- Sem `any`, sem `!` non-null assertion fora de testes
- Props de entrada com `readonly`
- `import type` para importações de apenas tipos
