# apps/web — Frontend Next.js

Regras gerais e de TypeScript: [`/AGENTS.md`](../../AGENTS.md). Este guia cobre só o que é específico do web.

## App Router (Next.js 15 — verificado)

- `page.tsx` = **Server Component**: define `metadata` e o shell/heading; delega interatividade.
- Interatividade em `*-page-client.tsx` (ou form/list) com `'use client'`, sob pasta co-localizada `_components/`. Ex.: `admin/users/page.tsx` → `components/admin/user-list.tsx`.
- Route groups: `(auth)` (login, reset-password — sem chrome) e `(dashboard)` (protegido). O guard é `auth()` em `app/(dashboard)/layout.tsx` (redirect p/ `/login`). **Não existe `middleware.ts`.**
- Nomes: arquivos kebab-case, componentes PascalCase, hooks `useX`.

## Dados — sempre via apiClient + React Query

Nunca chamar `fetch` direto. Fluxo em hook `src/hooks/use-*.ts`:

```ts
'use client';
export function useAlgo() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ['algo'],
    queryFn: () => apiClient.get<Algo[]>('/algo', { token: session?.user?.accessToken }),
    enabled: !!session?.user?.accessToken,
  });
}
```

- `apiClient` (`lib/api-client.ts`): `get/post/put/patch/delete`, injeta `Authorization: Bearer` via `{ token }`, **desembrulha `.data`** do envelope, lança `ApiError` (`statusCode`, `code`).
- Mutações: `useMutation` → `queryClient.invalidateQueries({ queryKey: [...] })` no `onSuccess` + toast `sonner` (`toast.success`/`toast.error`).

## Formulários

react-hook-form + Zod + `zodResolver`. Mensagem de erro: `text-xs text-rose-400`. Referência: `components/admin/create-user-form.tsx`. `Combobox`/`DatePicker`/`Checkbox` são **controlados** — usar `Controller`, nunca form não-controlado.

## Estilo

- Tailwind **v4 CSS-first** (sem `tailwind.config`); **dark-first**, paleta slate (superfícies) + indigo (primária) + rose (erro).
- Merge de classes: `cn()` de `lib/utils`. Ao criar superfície slate nova, adicionar override `.light .*` em `app/globals.css`.
- Reusar primitives de `components/ui/*`. **Proibido** `<select>` / `<input type="date">` / `<input type="checkbox">` nativos → usar `Combobox` / `DatePicker` / `Checkbox`.
- `next/image` (nunca `<img>`), `next/link` (nunca `<a>`). Copy em **PT-BR**.

## Convenções

- Tipos/DTOs sempre de `@ged/types` — nunca redefinir no front.
- Navegação: adicionar item em `components/layout/sidebar-nav-items.ts` (`NAV_ITEMS`/`ADMIN_NAV_ITEMS`) com `moduloSlug` para gating por módulo — não hardcodar no sidebar.
- Vocabulário PT/EN: combinar com o módulo vizinho (existe `use-permissoes` e `use-permissions`; `empresa` e `company`).

## Testes

Jest + Testing Library, `*.spec.ts(x)` co-localizado; E2E Playwright em `test/e2e/*.e2e.spec.ts`. Antes de finalizar, aplicar [`docs/agents/code-review.md`](../../docs/agents/code-review.md).
