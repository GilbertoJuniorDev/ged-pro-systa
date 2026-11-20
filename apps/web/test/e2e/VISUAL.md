# Harness de verificação visual (Temas claro e escuro + axe)

Prova de que uma tela ficou coerente nos dois Temas (ADR 0002): para cada rota, tira
screenshot de página inteira no Tema claro e no escuro e roda o axe com a regra
`color-contrast`. Violações viram relatório — **não falham** o teste, a menos que
`VISUAL_STRICT=1`.

## Pré-requisitos

1. Stack de dev de pé: Postgres (`pnpm docker:dev`), API (`pnpm --filter=api dev`, porta 3333)
   e web (`pnpm --filter=web dev`, porta 3000 — se não estiver rodando, o `webServer` do
   Playwright sobe um `pnpm dev`).
2. Chromium do Playwright instalado: `pnpm --filter=web exec playwright install chromium`.
3. Para rotas autenticadas: `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` do admin do seed
   (sem eles, as telas autenticadas são puladas; as públicas rodam).

## Rodar

```bash
cd apps/web
SEED_ADMIN_EMAIL=admin@ged.local SEED_ADMIN_PASSWORD='...' \
VISUAL_PUBLIC_ROUTES="/login" \
VISUAL_ROUTES="/,/admin/aparencia-sistema" \
pnpm test:visual
```

- `VISUAL_PUBLIC_ROUTES` — rotas abertas, separadas por vírgula (default `/login`).
- `VISUAL_ROUTES` — rotas que exigem login; entram como admin via `loginAsAdmin`
  (default `/`).
- `VISUAL_OUT_DIR` — pasta de saída (default `apps/web/visual-results/`, ignorada no git).
- `VISUAL_STRICT=1` — falha (soft) se houver qualquer violação de contraste.
- `BASE_URL` — como nos outros e2e.

**Git Bash no Windows:** exporte `MSYS_NO_PATHCONV=1`, senão `/` vira `C:/Program Files/Git/`.
No PowerShell: `$env:VISUAL_ROUTES = "/,/documentos"; pnpm test:visual`.

`test:visual` = `playwright test visual.e2e --project=chromium --workers=1` (um worker só: a
pasta de saída é limpa no início e o relatório agregado é escrito no fim).

## Saída

Em `apps/web/visual-results/` (recriada a cada execução):

- `<tela>--light.png`, `<tela>--dark.png` — nome da tela = rota em slug (`/` → `home`,
  `/admin/aparencia-sistema` → `admin-aparencia-sistema`);
- `<tela>--<tema>.axe.json` — violações resumidas (regra, impacto, nº de nós, seletores);
- `report.md` — tabela tela × Tema com a contagem de nós e a lista de seletores.

Os prints também ficam anexados no relatório HTML do Playwright (`playwright-report/`).

## Usar em outra spec

```ts
import { defineVisualSuite } from './support/visual-check';
import { parseScreens } from './support/visual-screens';

defineVisualSuite(parseScreens('/login', '/documentos,/arquivos'));
```

Peças avulsas: `checkScreenInTheme(page, screen, theme)` (support/visual-check.ts),
`loginAsAdmin(page)` (support/login.ts).

## Baseline (antes da migração, 2026-11-19)

Rodado com `VISUAL_ROUTES="/,/admin/aparencia-sistema"`. Nós com violação de `color-contrast`:

| Tela | Rota | claro | escuro |
| --- | --- | --- | --- |
| login | `/login` | 0 | 2 |
| home | `/` | 0 | 5 |
| admin-aparencia-sistema | `/admin/aparencia-sistema` | 1 | 4 |

Seletores: login/escuro `.text-xl` (logo), `.bottom-8` (rodapé); home/escuro `.text-xl`,
`.text-[10px]`, `.gap-1.5 > .truncate`, `.text-xs.truncate.text-slate-500`,
`.mt-1.text-xs.dark:text-slate-500`; aparência/claro `.mt-2`; aparência/escuro `.text-xl`,
`.text-[10px]`, `.gap-1.5 > .truncate`, `.text-left > .truncate:nth-child(2)`.
