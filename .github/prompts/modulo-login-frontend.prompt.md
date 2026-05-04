---
agent: agent
description: Implementa o frontend completo de autenticação (login page, Auth.js, API client, providers, middleware, testes unitários e E2E) no GED Pro
---

Implemente a feature de autenticação no frontend do GED Pro, do zero.
Siga estritamente as regras de:
- #file:.github/instructions/frontend.instructions.md
- #file:.github/instructions/project.instructions.md
- #file:.github/instructions/testing.instructions.md

Use as definições canônicas de tipos compartilhados de
#file:packages/@ged/types/src/index.ts
e a arquitetura documentada em #file:docs/ARCHITECTURE.md (seções 3 e 6).

Use como referência visual obrigatória os templates:
- #file:template/login.html       → modo light
- #file:template/darklogin.html   → modo dark

---

## Escopo

**Incluído:**
- Tipos locais do frontend (`types/index.ts`)
- API client tipado (`lib/api-client.ts`)
- Configuração Auth.js v5 (`lib/auth.ts`)
- Providers: TanStack Query + Theme (`providers/`)
- Hook de autenticação (`hooks/use-auth.ts`)
- Middleware de proteção de rotas (`middleware.ts`)
- Root layout com providers (`app/layout.tsx`)
- Página de login completa (`app/(auth)/login/page.tsx`) com formulário de recuperação de senha

**Excluído:** Páginas do dashboard, CRUD de usuários, upload de documentos.

---

## Fase 1 — Tipos Locais (`apps/web/src/types/index.ts`)

Exporte tipos locais do frontend:
- `interface LoginFormData { email: string; password: string }`
- `interface ApiError { message: string; statusCode: number; code: string }`
- `interface ApiResponse<T> { success: boolean; data: T; message: string; timestamp: string }`

Importe `AuthTokensResponse` e `JwtPayload` de `@ged/types` — nunca redefinir.

---

## Fase 2 — API Client (`apps/web/src/lib/api-client.ts`)

Crie um fetch wrapper tipado. Requisitos:
- Base URL via `process.env.NEXT_PUBLIC_API_URL`
- Método `request<T>(path, options)` genérico retornando `Promise<T>`
- Lança `ApiError` (do `types/index.ts`) em caso de resposta não-ok
- Métodos convenientes: `get<T>`, `post<T>`, `put<T>`, `delete<T>`
- Suporta passar `Authorization: Bearer <token>` via parâmetro opcional `token`
- Sem dependência de `axios` — usar `fetch` nativo

---

## Fase 3 — Auth.js Config (`apps/web/src/lib/auth.ts`)

Configure `next-auth` v5 com `CredentialsProvider`:
- `authorize(credentials)` chama `POST /auth/login` via `apiClient` com `LoginFormData`
- Em sucesso retorna objeto `user` com `{ id, email, name, role, accessToken, refreshToken, expiresIn }`
- Callbacks `jwt`:
  - Na criação inicial (trigger `signIn`): persiste `accessToken`, `refreshToken`, `role`, `expiresAt` (Date.now() + expiresIn * 1000)
  - Em chamadas subsequentes: se `Date.now() < expiresAt`, retorna token atual; senão chama `POST /auth/refresh` e atualiza o par de tokens
- Callback `session`: expõe `accessToken`, `role` e `sub` em `session.user`
- `pages: { signIn: '/login' }`
- Variáveis de ambiente necessárias: `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`
- Exporte também os handlers: `export const { handlers, signIn, signOut, auth } = NextAuth(config)`

---

## Fase 4 — Providers (`apps/web/src/providers/`)

**`query-provider.tsx`** — `'use client'`, cria `QueryClient` com staleTime de 60s, envolve filhos com `QueryClientProvider`. Exporte `QueryProvider`.

**`theme-provider.tsx`** — `'use client'`, wrapper sobre `next-themes` `ThemeProvider` com `attribute="class"`, `defaultTheme="system"`, `enableSystem`. Exporte `ThemeProvider`.

---

## Fase 5 — Hook de Auth (`apps/web/src/hooks/use-auth.ts`)

`'use client'` — hook composto:
- Reexporta `useSession` do `next-auth/react` com tipagem de `session.user` enriquecida (inclui `accessToken` e `role`)
- Expõe `isAuthenticated: boolean`, `isLoading: boolean`, `user` tipado
- Exporte `useAuth`

---

## Fase 6 — Middleware (`apps/web/src/middleware.ts`)

Use `auth()` do `lib/auth.ts`:
- Rotas públicas: `/login` — acessíveis sem sessão
- Rotas protegidas: `/(dashboard)/.*` — redirecionar para `/login` se sem sessão
- Usuário autenticado tentando acessar `/login` → redirecionar para `/`
- Config `matcher`: `['/((?!api|_next/static|_next/image|favicon.ico).*)']`

---

## Fase 7 — Root Layout (`apps/web/src/app/layout.tsx`)

Atualize o root layout para:
- Importar fonte `Inter` via `next/font/google`
- Envolver a árvore com `ThemeProvider` e `QueryProvider`
- `SessionProvider` do `next-auth/react` recebendo a sessão como prop (buscar com `auth()` server-side)
- Metadata: `title: 'GED Pro'`, `description: 'Sistema de Gerenciamento Eletrônico de Documentos'`

---

## Fase 8 — Página de Login (`apps/web/src/app/(auth)/login/page.tsx`)

**Visual:** siga fielmente o layout dos templates `login.html` (light) e `darklogin.html` (dark):
- Layout split 50/50: painel esquerdo com formulário + painel direito com marketing (oculto em mobile)
- Painel direito: gradiente `from-indigo-900 via-slate-900` com blobs decorativos e texto "Gestão Inteligente de Documentos"
- Logo GED Pro no canto superior esquerdo (ícone SVG de documento + nome)
- Rodapé com copyright

**Componente `LoginForm`** — `'use client'`, extraído em sub-componente:
- `react-hook-form` + `zodResolver` com schema Zod: `{ email: z.string().email(), password: z.string().min(8) }`
- Toggle show/hide senha (botão com SVG olho)
- Checkbox "Lembrar de mim"
- Estado de loading no botão de submit (`isPending` via `useTransition`)
- Chama `signIn('credentials', { email, password, redirect: false })`, trata erros e exibe mensagem de erro inline
- Em sucesso redireciona para `/` via `router.push`

**Vista de recuperação de senha** (dentro do mesmo componente, toggle via estado local):
- Botão "Esqueceu a senha?" alterna para a vista de recuperação
- Formulário com campo de e-mail + botão "Enviar link de recuperação"
- Botão "Voltar para o login"
- Por ora apenas exibe toast de confirmação (implementação real é feature separada)

**Dark mode:** todas as classes Tailwind com `dark:` prefix conforme os templates.

**Regras de componente:**
- Máx. 150 linhas por arquivo — extrair `LoginForm` e `RecoveryForm` como sub-componentes se necessário
- `'use client'` somente no `LoginForm` — a `page.tsx` pode ser Server Component (apenas importa e renderiza)
- Usar `next/link` para links internos
- `next/image` não se aplica aqui (sem imagens)

---

## Testes

- Testes unitários: `hooks/use-auth.spec.ts`, `lib/api-client.spec.ts`
- Testes E2E Playwright: ativar esqueleto existente em `apps/web/test/e2e/auth.e2e.spec.ts`

---

## Fase 9 — Testes Unitários

Crie dois arquivos `*.spec.ts` co-localizados, seguindo as regras de `#file:.github/instructions/testing.instructions.md`.

**`apps/web/src/hooks/use-auth.spec.ts`** — mocka `next-auth/react` (`jest.mock`), testa:
- `'should return isAuthenticated true when session is active'`
- `'should return isAuthenticated false when session is null'`
- `'should return isLoading true when status is loading'`
- `'should return typed user data from session'`

**`apps/web/src/lib/api-client.spec.ts`** — mocka `global.fetch` via `jest.spyOn(global, 'fetch')`, testa:
- `'should resolve with data on successful GET request'`
- `'should throw ApiError with statusCode and message on non-ok response'`
- `'should send JSON body on POST request'`
- `'should include Authorization header when token is provided'`

---

## Fase 10 — Testes E2E (Playwright)

O esqueleto já existe em `apps/web/test/e2e/auth.e2e.spec.ts` com `test.fixme` e os `data-testid` documentados.

**Na página de login** (`Fase 8`), adicione obrigatoriamente os atributos:
- `data-testid="email"` no `<input type="email">`
- `data-testid="password"` no `<input type="password">`
- `data-testid="submit"` no `<button type="submit">`
- `data-testid="error-message"` no elemento de erro inline

**No arquivo de testes** `auth.e2e.spec.ts`:
- Remova os `test.fixme` das jornadas já implementadas
- Os testes cobrem: login válido → redirect `/`, credenciais inválidas → exibe erro, acesso direto a `/` sem sessão → redirect `/login`