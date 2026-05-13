---
description: "Use when writing Next.js pages, components, hooks, providers, or any frontend code in apps/web/. Covers App Router patterns, Server vs Client Components decision table, TanStack Query hooks, and Auth.js integration."
applyTo: "apps/web/**"
---

# Frontend — Next.js 16.2 (apps/web/)

## Estrutura de Diretórios

```
apps/web/src/
├── app/                         # App Router (Next.js 16)
│   ├── layout.tsx               # Root layout (providers, fontes)
│   ├── not-found.tsx
│   ├── (auth)/login/page.tsx    # Página de login
│   └── (dashboard)/
│       ├── layout.tsx           # Layout com sidebar + header
│       ├── page.tsx             # Dashboard principal
│       ├── documents/           # Listagem, detalhe [id]/, upload/
│       ├── categories/
│       └── admin/users/ + settings/
├── components/
│   ├── layout/                  # sidebar.tsx, header.tsx, theme-toggle.tsx
│   ├── documents/               # document-card, document-table, upload-dropzone
│   └── ui/                      # Re-exports do @ged/ui
├── hooks/                       # TanStack Query hooks (use-documents, use-categories, use-auth)
├── lib/
│   ├── api-client.ts            # Fetch wrapper tipado para a API
│   ├── auth.ts                  # Configuração Auth.js (next-auth v5)
│   └── utils.ts
├── providers/
│   ├── query-provider.tsx       # TanStack Query Provider
│   └── theme-provider.tsx       # Dark/Light mode provider
└── types/index.ts               # Tipos locais do frontend
```

## Server Component vs Client Component

```
Regra: sem interatividade/estado → Server Component (padrão)
       com estado/eventos/browser API → Client Component ('use client')
```

| Server Component | Client Component (`'use client'`) |
|---|---|
| Listagem de documentos | Upload com drag-and-drop |
| Páginas estáticas | Filtros interativos |
| Fetch de dados iniciais | Formulários com validação |
| SEO / metadata (`generateMetadata`) | Theme toggle |
| Layout e navegação | Modais e dropdowns |

- Fetch direto no Server Component para dados iniciais; não usar `useEffect` para buscar dados que podem ser server-side
- Passar dados do Server Component para o Client Component via props

## TanStack Query — Padrão de Hook

```typescript
// hooks/use-documents.ts
export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => apiClient.get<PaginatedResult<Document>>('/documents', { params: filters }),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentData) => apiClient.post<Document>('/documents', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}
```

## Auth.js (next-auth v5)

- Configuração em `lib/auth.ts`
- Proteger rotas via middleware (`middleware.ts` no root do `src/`) usando `auth()`
- `useSession()` apenas em Client Components; em Server Components usar `auth()` diretamente
- JWT strategy: Access Token (15 min) + Refresh Token (7 dias) gerenciados pelo backend NestJS

## Validação de Formulários

- Schemas Zod definidos em `@ged/types` ou localmente em `types/`
- Integração com `react-hook-form` + `zodResolver`
- Nunca validar no submit sem feedback visual imediato ao usuário

## Componentes de UI Obrigatórios

Sempre que precisar de um destes elementos, **use o componente compartilhado** em `apps/web/src/components/ui/` em vez do elemento nativo. Não duplicar a estilização inline — se o componente não atender a um caso, estendê-lo, nunca recriá-lo ad-hoc.

| Componente | Import | Substitui | Props principais |
|---|---|---|---|
| `Combobox` | `@/components/ui/combobox` | `<select>` | `value`, `onValueChange`, `options: ComboboxOption[]`, `placeholder`, `error`, `disabled` |
| `DatePicker` | `@/components/ui/date-picker` | `<input type="date">` | `value` (string `YYYY-MM-DD`), `onChange`, `placeholder`, `error`, `disabled` |
| `Checkbox` | `@/components/ui/checkbox` | `<input type="checkbox">` | `checked`, `onCheckedChange`, `disabled` |
| `PasswordStrengthBar` / `PasswordStrengthCriteria` | `@/components/ui/password-strength` | Indicador de força de senha | `password` |
| `Spinner` | `@/components/ui/spinner` | Loader inline | `size`, `className` |
| `Skeleton` | `@/components/ui/skeleton` | Placeholders de loading | `className` |
| `NavLinkButton` | `@/components/ui/nav-link-button` | Botão de navegação que usa `next/link` | `href`, `children` |

Consequência prática: `Combobox` e `DatePicker` são **controlados** — formulários que os usam devem manter estado via `useState`/`react-hook-form` (`Controller`), nunca via `FormData` ou `defaultValue` de form não-controlado.

## Regras Obrigatórias

- Máx. ~150 linhas por arquivo de componente — extrair sub-componentes se ultrapassar
- Componentes de UI reutilizáveis sempre em `@ged/ui` (nunca duplicar em `apps/web/`)
- **Proibido** usar `<select>`, `<input type="date">` ou `<input type="checkbox">` nativos — usar `Combobox`, `DatePicker`, `Checkbox` (ver tabela acima)
- Antes de criar um componente de UI novo, verificar `apps/web/src/components/ui/` — se já existe, reutilizar; se quase existe, estender
- Tipos e DTOs sempre de `@ged/types` — nunca redefinir no frontend
- `next/image` para todas as imagens (nunca `<img>` direto)
- `next/link` para toda navegação interna (nunca `<a href>` direto)
- Suporte a dark/light mode obrigatório: usar classes Tailwind com `dark:` prefix
