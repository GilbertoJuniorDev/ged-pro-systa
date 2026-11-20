---
status: accepted
---

# Tokens semânticos derivados de Paleta × Tema

A interface passa a colorir tudo por **tokens semânticos** (`background`, `surface`, `surface-elevated`, `foreground`, `muted-foreground`, `border`, `ring`, `primary`/`primary-hover`/`primary-soft`/`primary-foreground`, `secondary`, e `success`/`warning`/`danger`/`info`), cujo valor é calculado a partir da Paleta do admin combinada com o Tema do usuário. Substitui o modelo anterior, "dark-first", em que os componentes usavam rampas cruas (`slate-*`, `indigo-*`) e o tema claro era um conjunto de overrides `.light .bg-slate-900 {…}` em `globals.css`, convivendo com ~114 arquivos que usavam a variante `dark:` — dois paradigmas opostos, com qualquer classe fora da lista de overrides vazando escura no claro.

Alternativas descartadas: ampliar os overrides `.light .X` (rápido, mas frágil para sempre — toda classe nova precisa de override) e adotar o vocabulário do shadcn (`--card`, `--muted`…) — mesma ideia, mas o projeto já tinha `--color-surface`/`--color-primary` e preferimos estender esse vocabulário.

## Consequences

- **A cor de fundo da Paleta define só o matiz dos neutros**; a luminosidade é fixa por Tema. Um admin não consegue produzir um tema claro com fundo escuro (ou vice-versa) — antes, `backgroundColor` alimentava a rampa `slate` usada pelos dois Temas.
- **A primária é ajustada por Tema** quando não atinge contraste 4.5:1 contra o fundo; o formulário de Aparência avisa, mas não bloqueia o salvamento.
- **Cores de status (`success`/`warning`/`danger`/`info`) não vêm da Paleta** — significado não pode depender de gosto do admin.
- **Rampas cruas ficam proibidas em componentes** (regra de lint) depois da migração; os overrides `.light .X` e as variantes `dark:` soltas são apagados na última fatia.
- O portal público (Aparência do Portal) migra numa fatia posterior, com o mesmo modelo.
