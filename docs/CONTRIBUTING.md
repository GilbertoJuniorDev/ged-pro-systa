# Contribuição — Git Flow

## Branches

| Branch | Finalidade |
|---|---|
| `main` | Código de produção estável. **Nunca** commitar diretamente. |
| `develop` | Branch de integração. PRs aprovados são mergeados aqui. |
| `feature/nome-da-feature` | Nova funcionalidade. Criada a partir de `develop`. |
| `fix/nome-do-bug` | Correção de bug. Criada a partir de `develop`. |
| `hotfix/nome-do-fix` | Correção crítica em produção. Criada a partir de `main`. |
| `release/x.y.z` | Preparação de release. Criada a partir de `develop`. |

## Fluxo de uma Feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/upload-de-documentos

# desenvolvimento + commits
git push origin feature/upload-de-documentos
# Abrir Pull Request → develop
# Code review + CI aprovados → Merge (Squash)
# Deletar branch da feature
```

## Conventional Commits

```
feat(scope): descrição curta no imperativo
fix(scope): descrição curta
chore(scope): tarefas de manutenção
docs(scope): documentação
test(scope): adição ou ajuste de testes
refactor(scope): refatoração sem mudança de comportamento
perf(scope): melhoria de performance
ci(scope): configuração de CI/CD
```

**Scopes válidos:** `auth`, `documents`, `categories`, `users`, `storage`, `database`, `web`, `api`, `infra`, `deps`

**Exemplos:**

```
feat(documents): adiciona endpoint de upload com validação de MIME type
fix(auth): corrige rotação de refresh token expirado
chore(deps): atualiza typeorm para 0.3.20
test(documents): adiciona testes unitários no DocumentService
refactor(storage): extrai adapter S3 do StorageService
```

## Regras de Pull Request

- Título segue Conventional Commits
- CI (lint + tests + build) deve **passar** antes do merge
- Ao menos **1 aprovação** necessária
- Sem `--force push` em branches compartilhadas (`main`, `develop`)
- PRs devem ser **pequenos e focados** — máx. ~400 linhas alteradas
- Descrição do PR deve conter: o que foi feito, como testar, e referência à issue (se houver)

## Hotfix em Produção

```bash
git checkout main
git pull origin main
git checkout -b hotfix/corrige-token-expirado

# correção + commits
git push origin hotfix/corrige-token-expirado
# PR → main   (merge + tag de versão)
# PR → develop (sync da correção)
```

## Versioning (Semântico)

`MAJOR.MINOR.PATCH` — ex: `1.2.3`

- `PATCH` — fix sem quebra de compatibilidade
- `MINOR` — nova feature sem quebra de compatibilidade
- `MAJOR` — breaking change
