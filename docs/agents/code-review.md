# Lente de Code Review — GED Pro

Critério de revisão para agentes (base: skill `code-review-expert`). Aplicar em **auto-revisão antes de declarar pronto** e **antes de abrir PR**. Escopo padrão: `git diff` (mudanças não-staged). As ferramentas `/code-review` e a skill `code-review-expert` executam isso automaticamente — este arquivo é o critério que elas devem aplicar a este repo.

## Como reportar

- Pontuar cada achado de **0 a 100** por confiança. **Reportar só ≥ 80.** Filtrar agressivamente: qualidade > quantidade.
- Agrupar por severidade: **Critical (90–100)** e **Important (80–89)**.
- Cada achado: descrição clara + `arquivo:linha` + regra/bug específico + **fix concreto**.
- Sem achados ≥80: confirmar que o código está de acordo, com resumo curto.

## Checklist por área (ancorado nas regras deste repo)

### SOLID / arquitetura
- Service com mais de uma responsabilidade, ou Controller "gordo" com lógica de negócio (deveria estar no Service).
- Dependência de **classe concreta** em vez do **token de interface** (`@Inject(X_REPOSITORY)` + `IXRepository`).
- Escrita multi-entidade sem `dataSource.transaction` em `*.use-case.ts`.
- Estrutura inventada de CQRS/Adapter/Events (não existe no projeto — ver `apps/api/CLAUDE.md`).

### Segurança
- Segredo/PII em log ou em Response DTO; coluna `select: false` (ex.: `passwordHash`) vazando.
- Rota sem guard adequado ou `@Public()` indevido; permissão/role faltando.
- Input sem DTO `class-validator`, ou aceitando campos fora do whitelist.
- `JWT_SECRET`/`JWT_REFRESH_SECRET` < 32 chars; env nova não validada em `config/env.validation.ts`.

### Bugs de correção
- `null`/`undefined` não tratados; `||` onde deveria ser `??` (perde `0`/`''`).
- Entidade nova não registrada nos 3 lugares, ou migration não adicionada em `migrations/run.ts`.
- Frontend: `queryKey` não invalidada após mutação; `enabled` sem checar token; `fetch` direto em vez de `apiClient`.
- Quebra do envelope `{ success, data, message, timestamp }` ou do formato de erro.

### TypeScript
- `any`, `as T` sem prova, `!` non-null, `enum` nativo, `import` de tipo sem `import type`.

### Testes e duplicação
- Feature sem `*.spec.ts` co-localizado; deps externas não mockadas; cobertura < 80% em service/repository/hooks/lib.
- Lógica/tipo/UI duplicada que deveria estar em `@ged/types` / `@ged/utils` / `@ged/ui`.

### Consistência
- Vocabulário PT/EN divergente do módulo vizinho; copy de UI fora de PT-BR; nomenclatura de arquivo fora do kebab-case + sufixo de papel.
