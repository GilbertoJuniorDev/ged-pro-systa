# CLAUDE.md

**[`AGENTS.md`](AGENTS.md) é a fonte canônica deste repositório — leia-o primeiro.** Stack real, regras de TypeScript, nomenclatura, vocabulário PT/EN e mapa de referência estão lá.

## Guias contextuais (carregados automaticamente por caminho)

Ao editar arquivos nestas pastas, o Claude Code carrega o `CLAUDE.md` correspondente:

- `apps/api/**` → [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md) — NestJS
- `apps/web/**` → [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md) — Next.js
- `packages/@ged/database/**` → [`packages/@ged/database/CLAUDE.md`](packages/@ged/database/CLAUDE.md) — entidades/migrations

## Workflow

- Rodar o quality gate (`pnpm lint && pnpm type-check && pnpm test`) **antes** de declarar uma tarefa pronta.
- Em mudanças não-triviais: usar `/verify` para exercitar o fluxo e `/code-review` (critério em [`docs/agents/code-review.md`](docs/agents/code-review.md)) antes de abrir PR.
- **`/implement-spec`: no máximo 2 implementer subagents rodando ao mesmo tempo.** Cada um roda Jest + `tsc` na própria worktree; mais que isso esgota a RAM da máquina. Disparar o próximo só quando um terminar.
- **Nunca** commitar ou dar push sem o usuário pedir. Branch `develop` é a de integração; nunca commitar em `main`/`develop` direto.
- Respeitar o **vocabulário PT/EN** de cada módulo — não traduzir código existente. Copy de UI em PT-BR.
- **Não confiar** nas seções aspiracionais de `docs/ARCHITECTURE.md` / `.github/instructions/*` (CQRS, storage adapters, Next 16.2 — não existem). A verdade é o código + `AGENTS.md`.

## Agent skills

### Issue tracker

Issues vivem no GitHub Issues (`GilbertoJuniorDev/ged-pro-systa`), via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Cinco labels canônicos padrão (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` na raiz. See `docs/agents/domain.md`.
