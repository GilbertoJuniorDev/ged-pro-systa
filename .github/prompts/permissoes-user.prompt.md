---
mode: agent
description: Plano completo de implementação de Permissões Granulares, PessoaFisica e AuditLog no GED Pro
---

# Plano de Implementação — Permissões, PessoaFisica e AuditLog

## Contexto e Decisões

- **PessoaFisica**: nome, sobrenome, cpf (único), dataNascimento, sexo (M/F/O) + relações 1:N para `enderecos` e `telefones`
- **Permissões**: livres — admin cadastra nome + descrição; não há ações pré-definidas
- **Grupos**: fora do escopo desta fase
- **Roles vs Permissões**: `ADMIN` tem bypass total via role; `MANAGER` e `VIEWER` passam pelo `PermissionsGuard`
- **AuditLog**: registra usuarioId (nullable), acao, entidade, entidadeId, ipCliente, userAgent
- **Escopo**: backend apenas (Next.js fora desta fase)
- **CPF**: armazenado como 11 dígitos sem máscara — formatação no frontend

---

## Fase 1 — Entidades TypeORM (`packages/@ged/database/src/entities/`)

### Novas entidades (6 arquivos)

| Arquivo | Tabela | Observação |
|---|---|---|
| `pessoa-fisica.entity.ts` | `pessoa_fisicas` | 1:1 com `users`, CPF único |
| `endereco.entity.ts` | `enderecos` | N:1 com `pessoa_fisicas`, enum tipo |
| `telefone.entity.ts` | `telefones` | N:1 com `pessoa_fisicas`, enum tipo |
| `permissao.entity.ts` | `permissoes` | nome único |
| `usuario-permissao.entity.ts` | `usuario_permissoes` | junction user↔permissao, unique(usuario_id, permissao_id) |
| `audit-log.entity.ts` | `audit_logs` | usuario_id nullable (SET NULL), imutável (sem updatedAt) |

### Modificação em `user.entity.ts`

Adicionar 3 relações via string reference (evitar circular import):
- `@OneToOne('PessoaFisica', 'usuario')` — `pessoaFisica`
- `@OneToMany('UsuarioPermissao', 'usuario')` — `usuarioPermissoes`
- `@OneToMany('AuditLog', 'usuario')` — `auditLogs`

### Atualizar `packages/@ged/database/src/index.ts`

Exportar todas as 6 novas entidades + seus const objects de enum.

---

## Fase 2 — Tipos Compartilhados (`packages/@ged/types/src/index.ts`)

Adicionar interfaces:
- `PermissaoDto` — `{ id, nome, descricao, createdAt }`
- `PessoaFisicaDto` — `{ id, userId, nome, sobrenome, cpf, dataNascimento, sexo }`
- `EnderecoDto` — `{ id, pessoaFisicaId, tipo, logradouro, numero, complemento, bairro, cidade, estado, cep }`
- `TelefoneDto` — `{ id, pessoaFisicaId, tipo, numero }`
- `AuditLogDto` — `{ id, usuarioId, acao, entidade, entidadeId, ipCliente, userAgent, createdAt }`

---

## Fase 3 — Migrations (`packages/@ged/database/src/migrations/`)

6 arquivos com timestamps sequenciais a partir de `1746403200000`:

| Timestamp | Migration |
|---|---|
| `1746403200000` | `CreatePessoaFisicasTable` |
| `1746403200001` | `CreateEnderecosTable` |
| `1746403200002` | `CreateTelefonesTable` |
| `1746403200003` | `CreatePermissoesTable` |
| `1746403200004` | `CreateUsuarioPermissoesTable` |
| `1746403200005` | `CreateAuditLogsTable` |

Todas com `up()` e `down()` completos usando SQL raw (mesmo padrão das migrations existentes).

---

## Fase 4 — Common: Decorator e Guard (`apps/api/src/common/`)

### `decorators/permissions.decorator.ts`
```ts
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...names: string[]) => SetMetadata(PERMISSIONS_KEY, names);
```

### `guards/permissions.guard.ts`
Lógica:
1. Lê metadados `PERMISSIONS_KEY` do handler/classe
2. Se nenhuma permissão exigida → `true`
3. Se `user.role === ROLE.ADMIN` → `true` (bypass total)
4. Caso contrário → injeta `UsuarioPermissoesService` e verifica se o usuário tem **todas** as permissões listadas

---

## Fase 5 — Módulo `permissoes/` (`apps/api/src/modules/permissoes/`)

### Arquivos
- `interfaces/permissao-repository.interface.ts`
- `dto/create-permissao.dto.ts`
- `dto/update-permissao.dto.ts`
- `dto/permissao-response.dto.ts`
- `permissoes.repository.ts`
- `permissoes.service.ts`
- `permissoes.service.spec.ts`
- `permissoes.controller.ts`
- `permissoes.module.ts`

### Endpoints (todos ADMIN only)
| Método | Rota | Ação |
|---|---|---|
| `GET` | `/permissoes` | Listar todas |
| `POST` | `/permissoes` | Criar nova |
| `PATCH` | `/permissoes/:id` | Atualizar |
| `DELETE` | `/permissoes/:id` | Remover |

---

## Fase 6 — Módulo `usuario-permissoes/` (`apps/api/src/modules/usuario-permissoes/`)

### Arquivos
- `interfaces/usuario-permissao-repository.interface.ts`
- `dto/assign-permissao.dto.ts`
- `dto/usuario-permissao-response.dto.ts`
- `usuario-permissoes.repository.ts`
- `usuario-permissoes.service.ts`
- `usuario-permissoes.service.spec.ts`
- `usuario-permissoes.controller.ts`
- `usuario-permissoes.module.ts`

### Endpoints (todos ADMIN only)
| Método | Rota | Ação |
|---|---|---|
| `GET` | `/users/:userId/permissoes` | Listar permissões do usuário |
| `POST` | `/users/:userId/permissoes` | Atribuir permissão |
| `DELETE` | `/users/:userId/permissoes/:permissaoId` | Revogar permissão |

---

## Fase 7 — Módulo `pessoa-fisica/` (`apps/api/src/modules/pessoa-fisica/`)

### Arquivos
- `interfaces/pessoa-fisica-repository.interface.ts`
- `interfaces/endereco-repository.interface.ts`
- `interfaces/telefone-repository.interface.ts`
- DTOs: `create/update-pessoa-fisica`, `create/update-endereco`, `create/update-telefone` + responses
- `pessoa-fisica.repository.ts`, `endereco.repository.ts`, `telefone.repository.ts`
- `pessoa-fisica.service.ts`, `pessoa-fisica.service.spec.ts`
- `pessoa-fisica.controller.ts`, `pessoa-fisica.module.ts`

### Endpoints
| Método | Rota | Ação | Autorização |
|---|---|---|---|
| `GET` | `/users/:userId/pessoa-fisica` | Obter perfil | Próprio ou ADMIN |
| `POST` | `/users/:userId/pessoa-fisica` | Criar perfil | Próprio ou ADMIN |
| `PATCH` | `/users/:userId/pessoa-fisica` | Atualizar perfil | Próprio ou ADMIN |
| `GET` | `/users/:userId/pessoa-fisica/enderecos` | Listar endereços | Próprio ou ADMIN |
| `POST` | `/users/:userId/pessoa-fisica/enderecos` | Adicionar endereço | Próprio ou ADMIN |
| `PATCH` | `/users/:userId/pessoa-fisica/enderecos/:id` | Atualizar endereço | Próprio ou ADMIN |
| `DELETE` | `/users/:userId/pessoa-fisica/enderecos/:id` | Remover endereço | Próprio ou ADMIN |
| `GET` | `/users/:userId/pessoa-fisica/telefones` | Listar telefones | Próprio ou ADMIN |
| `POST` | `/users/:userId/pessoa-fisica/telefones` | Adicionar telefone | Próprio ou ADMIN |
| `PATCH` | `/users/:userId/pessoa-fisica/telefones/:id` | Atualizar telefone | Próprio ou ADMIN |
| `DELETE` | `/users/:userId/pessoa-fisica/telefones/:id` | Remover telefone | Próprio ou ADMIN |

---

## Fase 8 — Módulo `audit-logs/` (`apps/api/src/modules/audit-logs/`)

### Arquivos
- `dto/create-audit-log.dto.ts` (uso interno)
- `dto/query-audit-log.dto.ts` (filtros para listagem)
- `dto/audit-log-response.dto.ts`
- `audit-logs.repository.ts`
- `audit-logs.service.ts`
- `audit-logs.controller.ts`
- `audit-logs.module.ts`

### Endpoints
| Método | Rota | Ação | Autorização |
|---|---|---|---|
| `GET` | `/audit-logs` | Listar (com filtros: userId, acao, entidade, page) | ADMIN only |

O `AuditLogService.log()` é chamado explicitamente pelos outros services — sem interceptor automático nesta fase.

---

## Fase 9 — Atualizar `app.module.ts`

Importar: `PermissoesModule`, `UsuarioPermissoesModule`, `PessoaFisicaModule`, `AuditLogsModule`

---

## Fase 10 — Testes unitários

| Arquivo | Cobertura mínima |
|---|---|
| `permissoes.service.spec.ts` | create conflict, update not found, remove not found |
| `usuario-permissoes.service.spec.ts` | assign duplicate, revoke not found, hasPermissao |
| `pessoa-fisica.service.spec.ts` | create conflict CPF, create conflict userId, update not owner |
| `permissions.guard.spec.ts` | ADMIN bypass, VIEWER sem permissão, VIEWER com permissão |

---

## Verificação Final

```bash
pnpm run typecheck           # zero erros TypeScript
pnpm --filter api test       # todos os spec passando ≥80% cobertura
pnpm db:migrate:run          # 6 migrations sobem sem erro
pnpm db:migrate:revert       # 6 down() executam sem erro
```
