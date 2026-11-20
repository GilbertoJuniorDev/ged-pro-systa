# apps/web — Frontend Next.js

Regras gerais e de TypeScript: [`/AGENTS.md`](../../AGENTS.md). Este guia cobre só o que é específico do web.

## App Router (Next.js 15 — verificado)

- `page.tsx` = **Server Component**: define `metadata` e o shell/heading; delega interatividade.
- Interatividade em `*-page-client.tsx` (ou form/list) com `'use client'`, sob pasta co-localizada `_components/`. Ex.: `admin/users/page.tsx` → `components/admin/user-list.tsx`.
- Route groups: `(auth)` (login, reset-password — sem chrome) e `(dashboard)` (protegido). Guards em duas camadas: `src/middleware.ts` (redirect de não-autenticado, gating por role/módulo, redirect para `/sessao-expirada` quando o refresh token morre) e `auth()` em `app/(dashboard)/layout.tsx`.
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

react-hook-form + Zod + `zodResolver`. Mensagem de erro: `text-xs text-danger`; campo inválido: `border-danger focus:ring-danger`. Referência: `components/admin/create-user-form.tsx`. `Combobox`/`DatePicker`/`Checkbox` são **controlados** — usar `Controller`, nunca form não-controlado.

## Estilo

- Tailwind **v4 CSS-first** (sem `tailwind.config`). Merge de classes: `cn()` de `lib/utils`.
- **Cor só por token semântico** (ADR 0002 — *Tokens semânticos derivados de Paleta × Tema*; vocabulário no `GLOSSARY.md`). Os tokens são derivados da **Paleta** (cores do admin) × **Tema** (claro/escuro do usuário) em `lib/theme-style.ts` e emitidos como `--ged-*`; com eles a tela já fica certa nos dois Temas e com qualquer Paleta.
- Utilities disponíveis (qualquer prefixo de cor: `bg-`/`text-`/`border-`/`ring-`/`divide-`/`fill-`…, com modificador de opacidade, ex. `bg-danger/10`):
  `background`, `surface`, `surface-elevated`, `foreground`, `muted-foreground`, `border`, `ring`, `primary`, `primary-hover`, `primary-soft`, `primary-foreground`, `secondary`, `success`, `warning`, `danger`, `info`.
  - página `bg-background`; card/sidebar/painel `bg-surface`; dropdown/modal/popover `bg-surface-elevated`;
  - texto `text-foreground`, secundário/ícones `text-muted-foreground`, bordas `border-border`, foco `focus-visible:ring-ring`;
  - botão primário `bg-primary hover:bg-primary-hover text-primary-foreground`; item selecionado `bg-primary-soft text-primary`;
  - hover neutro sobre superfícies `hover:bg-foreground/5`; erro `text-danger`, caixa de erro `bg-danger/10 border-danger/30 text-danger`.
- **Chips de status: padrão ring**, `ring-1 ring-inset ring-success/40 text-success` (idem `warning`/`info`/`danger`). **Não** usar `bg-success/10 text-success` nem `bg-warning/10 text-warning`: reprovam 4.5:1 no Tema claro.
- **Proibido** (a regra de lint `ged/no-raw-color-classes` — `eslint-rules/raw-color-classes.js` — barra): rampas cruas (`slate-*`, `indigo-*`, `rose-*`…), `white`/`black`, arbitrários `[#…]`/`[rgb…]`/`[var(--color-…)]` e qualquer variante `dark:` — os tokens já trocam por Tema. Também não criar overrides `.light .x` em `globals.css`. Exceção temporária: `app/(public)/portal/**` (ainda no modelo antigo de rampas, até migrar).
- **Tema por trecho da tela**: um wrapper com `className="light"` (ou `"dark"`) força aquele Tema na subárvore — o ancestral marcado mais próximo vence. Ex.: painel de marca sempre escuro no login; Combobox clara no portal.
- Em TS (SVG/Recharts, estilo inline), referenciar token com `tokenVar('primary')` de `lib/theme-style` — nunca hex nem `'var(--ged-…)'` escrito à mão. Hex só para cores de *dados* de gráfico (`components/dashboard/chart-colors.ts`).
- Verificação visual nos dois Temas (screenshot + axe `color-contrast`): `test/e2e/VISUAL.md`.
- Reusar primitives de `components/ui/*`. **Proibido** `<select>` / `<input type="date">` / `<input type="checkbox">` nativos → usar `Combobox` / `DatePicker` / `Checkbox`.
- `next/image` (nunca `<img>`), `next/link` (nunca `<a>`). Copy em **PT-BR**.

## Convenções

- Tipos/DTOs sempre de `@ged/types` — nunca redefinir no front.
- Navegação: adicionar item em `components/layout/sidebar-nav-items.ts` (`NAV_ITEMS`/`ADMIN_NAV_ITEMS`) com `moduloSlug` para gating por módulo — não hardcodar no sidebar.
- Vocabulário PT/EN: combinar com o módulo vizinho (existe `use-permissoes` e `use-permissions`; `empresa` e `company`).

## Testes

Jest + Testing Library, `*.spec.ts(x)` co-localizado; E2E Playwright em `test/e2e/*.e2e.spec.ts`. Antes de finalizar, aplicar [`docs/agents/code-review.md`](../../docs/agents/code-review.md).
