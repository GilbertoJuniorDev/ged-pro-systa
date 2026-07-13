# Confidencialidade & Acesso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make document confidentiality govern access in fact (today it's just a label — access is department-only). After this plan: `PUBLICO`/`RESTRITO`/`CONFIDENCIAL` (no more `INTERNO`), `RESTRITO` can be widened to extra departments, `CONFIDENCIAL` is scoped to an explicit user list, all gated behind a new modular permission, with a UI to view/edit it after upload.

**Architecture:** Two new join tables (`document_access_departments`, `document_access_users`) record per-document grants, mirroring the existing `user_departments` join-table pattern. A new `ApplyDocumentConfidentialityUseCase` centralizes authorization + grant-sync logic (transactional, mirrors `UserDepartmentsService.syncForUser`'s diff-and-sync approach), invoked from both upload and update. `DocumentsService.assertCanAccess`/`resolveAllowedDepartamentos` and `DocumentsRepository.findAll` are rewritten to enforce access by confidentiality level. Frontend adds a reusable confidentiality section (used by both upload and a new edit dialog) and a new `MultiCombobox` UI primitive (built with the `ui-ux-pro-max` skill, matching the existing `Combobox`'s visual language).

**Tech Stack:** NestJS + TypeORM (Postgres) backend; Next.js 15 + React Query + react-hook-form + Zod frontend. pnpm workspaces + turbo monorepo.

## Global Constraints

- Confidencialidade levels after this plan: `PUBLICO`, `RESTRITO`, `CONFIDENCIAL` only. `INTERNO` is removed; default becomes `RESTRITO` (was `INTERNO`).
- Existing documents with `confidencialidade = 'INTERNO'` migrate to `RESTRITO` (data migration runs before the Postgres enum type is swapped, in the same migration).
- Access rule for non-privileged users (role not in `PRIVILEGED_ROLES = [SUPER_ADMIN, ADMIN, MANAGER]`, `documents.service.ts`):
  - `PUBLICO` → always visible.
  - `RESTRITO` → visible if `document.departamentoId` is one of the user's department memberships (`user_departments`), **or** a row exists in `document_access_departments` linking the document to one of the user's departments.
  - `CONFIDENCIAL` → visible only if a row exists in `document_access_users` for `(document.id, user.id)`.
  - Otherwise: `NotFoundException('Documento não encontrado')` — never leak existence (unchanged behavior).
- `PRIVILEGED_ROLES` (`SUPER_ADMIN`, `ADMIN`, `MANAGER`) always bypass the above and see every document at every level — unchanged from today.
- Managing confidentiality (setting a level other than `RESTRITO`, or setting non-empty `accessDepartamentoIds`/`accessUserIds`) requires: role `ADMIN` or `SUPER_ADMIN`, **or** the permission `DOCUMENTS_MANAGE_CONFIDENTIALITY` (checked via `UserPermissionsService.hasPermission(userId, 'DOCUMENTS_MANAGE_CONFIDENTIALITY')`). A caller without this fails with `ForbiddenException('Você não tem permissão para gerenciar a confidencialidade deste documento')` — never silently downgraded.
- A caller without manage rights who uploads a document always gets `confidencialidade = 'RESTRITO'` with no grants, regardless of what they send in the request body.
- `CONFIDENCIAL` requires at least one entry in `accessUserIds` (validated in the use-case, not just DTO shape) — throws `BadRequestException('Documentos confidenciais exigem ao menos um usuário com acesso')` otherwise. The uploading/editing user is auto-included if not already present in the list.
- New DB naming: table names snake_case plural (`document_access_departments`, `document_access_users`), columns `document_id`/`departamento_id`/`usuario_id`; TS camelCase `documentId`/`departamentoId`/`usuarioId` — exactly the casing convention used by `user_departments`/`document_leads`.
- No native TypeScript `enum` — `const object + as const + type`, per `packages/@ged/database/CLAUDE.md`.
- No native `<select>` / `<input type="checkbox">` — use `Combobox` / `Checkbox` / the new `MultiCombobox` from `apps/web/src/components/ui/*`, per `apps/web/CLAUDE.md`.
- Every mutation logs via `void this.auditLogsService.log(...)` (fire-and-forget), PT-BR exception messages, following `apps/api/CLAUDE.md`.
- Migration numbering continues from the last existing migration `1782950400008-CreateDocumentLeadsTable` → this plan adds `1782950400009`, `1782950400010`.
- Do **not** run new migrations against the shared dev Postgres container (`ged-db`, port 5432 — used by the currently-running `ged-api-dev`/`ged-web-dev` containers on a different checkout). Migration SQL correctness is verified by careful review against the exact patterns in `1782950400006-CreateDocumentsTable.ts` / `1782950400001-CreateUserDepartmentsTable.ts` / `1782950400002-AddSuperAdminToUsersRoleEnum.ts`; live `db:migrate`/`db:migrate:revert` execution against an isolated/throwaway Postgres happens once, at the end of the whole plan (see the plan's final verification section), not per-task.
- Quality gate before any task is marked complete: `pnpm lint && pnpm type-check && pnpm test` from the repo root must be clean, **except** the pre-existing, unrelated failures below (all confirmed pre-existing on the `fix/backend-security-critical` base via `git stash` + rerun against the pristine tree during Task 1 — do not try to fix any of them, they are out of scope for this plan):
  - `apps/web/src/lib/api-client.spec.ts` — 4 failing tests (`Headers`/fetch polyfill mismatch).
  - `apps/web/src/components/admin/create-user-form.spec.tsx` — 8 failing tests (Testing-Library selector mismatch).
  - `apps/api/src/modules/subscription/subscription.service.spec.ts` — whole suite fails (`SUBSCRIPTION_PAYMENT_REPOSITORY` not provided in the test module — pre-existing DI setup bug).
  - `apps/api/test/integration/system.integration.spec.ts` — whole suite fails (`JwtStrategy` calls `ConfigService.getOrThrow('JWT_SECRET')`; this worktree has no `.env`, only `.env.example`).
  - `apps/api/test/integration/auth.integration.spec.ts` — occasionally flaky under full-suite parallel load; not consistently failing, don't chase it if it passes in isolation.
  - **Any *other* failure is this plan's responsibility to fix.**
  - **Root `pnpm test` is not sufficient to prove the API suite is clean**: turbo aborts remaining tasks once `web#test` fails, so it silently never runs `api:test`. Every task from here on must verify `apps/web` and `apps/api` test suites **separately** — e.g. `pnpm --filter=web test` and `pnpm --filter=api test` (or `npx jest` from each app dir) — not just the combined root `pnpm test`.
  - **Cache warning**: `apps/api`'s `tsc --incremental` build-info cache (`apps/api/dist/.tsbuildinfo`) can silently hide real type errors on a subsequent `pnpm type-check` if stale from an earlier session. If type-check passes suspiciously easily after a change that should affect `apps/api`, rerun with `turbo run type-check --force` (or delete `apps/api/dist/.tsbuildinfo` and `.turbo` caches) before trusting a green result.
- `Document`, `DocumentAccessDepartment`, `DocumentAccessUser` relations use direct imports + `@ManyToOne(() => Entity, ...)` (not string-based `@OneToMany('Entity', ...)`) — there is no back-reference from `Document` to these join entities, so there's no circular-import risk, matching how `document-lead.entity.ts` references `Document`.

---

### Task 1: Remove `INTERNO` from the Confidencialidade enum

**Files:**
- Modify: `packages/@ged/database/src/entities/document.entity.ts`
- Modify: `packages/@ged/types/src/index.ts` (lines 381–386)
- Modify: `apps/api/src/modules/documents/documents.service.spec.ts` (fixture uses `CONFIDENCIALIDADE.INTERNO`)
- Modify: `apps/api/src/modules/documents/documents.controller.spec.ts` (same fixture pattern — discovered during Task 1 implementation, not originally listed here)
- Modify: `apps/api/src/modules/documents/dto/create-document.dto.spec.ts` (same fixture pattern — discovered during Task 1 implementation, not originally listed here)
- Modify: `apps/api/src/modules/documents/use-cases/upload-document.use-case.spec.ts` (same fixture pattern — discovered during Task 1 implementation, not originally listed here)
- Modify: `apps/web/src/components/documents/upload-document-form.tsx` (drop `INTERNO` from the options/zod enum only — full redesign happens in Task 10)
- Modify: `apps/web/src/components/documents/document-list.tsx` (drop `INTERNO` from the badge/label/filter maps — full redesign happens in Task 11)
- Modify: `apps/web/src/app/(dashboard)/documents/[id]/_components/document-detail-page-client.tsx` (drop `INTERNO` from the badge/label maps — full redesign happens in Task 11)
- Create: `packages/@ged/database/src/migrations/1782950400009-RemoveInternoConfidencialidade.ts`
- Modify: `packages/@ged/database/src/migrations/run.ts` (register the migration)

**Interfaces:**
- Produces: `CONFIDENCIALIDADE = { PUBLICO, RESTRITO, CONFIDENCIAL }` (both in `@ged/database` and `@ged/types`), `Confidencialidade = 'PUBLICO' | 'RESTRITO' | 'CONFIDENCIAL'`. Every later task in this plan assumes these exact three values and this exact default (`RESTRITO`).

- [ ] **Step 1: Update the entity**

In `packages/@ged/database/src/entities/document.entity.ts`, change:

```ts
export const CONFIDENCIALIDADE = {
  PUBLICO: 'PUBLICO',
  INTERNO: 'INTERNO',
  RESTRITO: 'RESTRITO',
  CONFIDENCIAL: 'CONFIDENCIAL',
} as const;
```

to:

```ts
export const CONFIDENCIALIDADE = {
  PUBLICO: 'PUBLICO',
  RESTRITO: 'RESTRITO',
  CONFIDENCIAL: 'CONFIDENCIAL',
} as const;
```

and the column definition, from:

```ts
  @Column({
    name: 'confidencialidade',
    type: 'enum',
    enum: ['PUBLICO', 'INTERNO', 'RESTRITO', 'CONFIDENCIAL'],
    default: CONFIDENCIALIDADE.INTERNO,
  })
  confidencialidade!: Confidencialidade;
```

to:

```ts
  @Column({
    name: 'confidencialidade',
    type: 'enum',
    enum: ['PUBLICO', 'RESTRITO', 'CONFIDENCIAL'],
    default: CONFIDENCIALIDADE.RESTRITO,
  })
  confidencialidade!: Confidencialidade;
```

- [ ] **Step 2: Mirror the same change in `@ged/types`**

In `packages/@ged/types/src/index.ts` (around line 381), apply the identical `CONFIDENCIALIDADE` const change (no column to touch here — this file has no decorators, just the const + type).

- [ ] **Step 3: Run type-check to find every now-broken reference**

Run: `pnpm type-check` (repo root)

Expected: FAIL. `tsc` will point at every place that still references `CONFIDENCIALIDADE.INTERNO` or a `Record<Confidencialidade, ...>` literal with an `INTERNO` key. That's every file listed above under "Files" plus (transitively) nothing else — confirm the failing files match that list exactly before proceeding; if a different, unexpected file also fails, stop and report it (that means there's an `INTERNO` reference this plan didn't account for).

- [ ] **Step 4: Fix the failing test fixture**

In `apps/api/src/modules/documents/documents.service.spec.ts`:
- Line 53: `confidencialidade: CONFIDENCIALIDADE.INTERNO,` → `confidencialidade: CONFIDENCIALIDADE.RESTRITO,`
- Line 218: `confidencialidade: CONFIDENCIALIDADE.INTERNO,` → `confidencialidade: CONFIDENCIALIDADE.RESTRITO,`
- Line 235: `confidencialidade: CONFIDENCIALIDADE.INTERNO,` → `confidencialidade: CONFIDENCIALIDADE.RESTRITO,`

- [ ] **Step 5: Minimal frontend fixups (no redesign yet)**

In `apps/web/src/components/documents/upload-document-form.tsx`:
- Remove the `{ value: CONFIDENCIALIDADE.INTERNO, label: 'Interno' }` line from `CONFIDENCIALIDADE_OPTIONS`.
- Remove `CONFIDENCIALIDADE.INTERNO,` from the `z.enum([...])` array in `schema`.

In `apps/web/src/components/documents/document-list.tsx`:
- Remove the `INTERNO:` entry from `CONFIDENCIALIDADE_BADGE`.
- Remove the `INTERNO:` entry from `CONFIDENCIALIDADE_LABEL`.
- Remove the `{ value: 'INTERNO', label: 'Interno' }` entry from `CONFIDENCIALIDADE_OPTIONS`.

In `apps/web/src/app/(dashboard)/documents/[id]/_components/document-detail-page-client.tsx`:
- Remove the `INTERNO:` entry from `CONFIDENCIALIDADE_BADGE`.
- Remove the `INTERNO:` entry from `CONFIDENCIALIDADE_LABEL`.

- [ ] **Step 6: Re-run type-check and full test suite**

Run: `pnpm type-check && pnpm test`
Expected: PASS, except the two pre-existing failures named in Global Constraints.

- [ ] **Step 7: Write the data + enum-recreation migration**

Create `packages/@ged/database/src/migrations/1782950400009-RemoveInternoConfidencialidade.ts`:

```ts
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveInternoConfidencialidade1782950400009 implements MigrationInterface {
  name = 'RemoveInternoConfidencialidade1782950400009';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Postgres não permite remover um valor de um tipo ENUM diretamente — é preciso
    // migrar os dados, recriar o tipo sem o valor e trocar a coluna para o novo tipo.
    await queryRunner.query(`
      UPDATE "documents" SET "confidencialidade" = 'RESTRITO' WHERE "confidencialidade" = 'INTERNO'
    `);

    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "confidencialidade" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "documents_confidencialidade_enum" RENAME TO "documents_confidencialidade_enum_old"`);
    await queryRunner.query(`CREATE TYPE "documents_confidencialidade_enum" AS ENUM ('PUBLICO', 'RESTRITO', 'CONFIDENCIAL')`);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "confidencialidade" TYPE "documents_confidencialidade_enum"
      USING "confidencialidade"::text::"documents_confidencialidade_enum"
    `);
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "confidencialidade" SET DEFAULT 'RESTRITO'`);
    await queryRunner.query(`DROP TYPE "documents_confidencialidade_enum_old"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "confidencialidade" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "documents_confidencialidade_enum" RENAME TO "documents_confidencialidade_enum_old"`);
    await queryRunner.query(`CREATE TYPE "documents_confidencialidade_enum" AS ENUM ('PUBLICO', 'INTERNO', 'RESTRITO', 'CONFIDENCIAL')`);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "confidencialidade" TYPE "documents_confidencialidade_enum"
      USING "confidencialidade"::text::"documents_confidencialidade_enum"
    `);
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "confidencialidade" SET DEFAULT 'INTERNO'`);
    await queryRunner.query(`DROP TYPE "documents_confidencialidade_enum_old"`);
  }
}
```

- [ ] **Step 8: Register the migration**

In `packages/@ged/database/src/migrations/run.ts`, add the import after `CreateDocumentLeadsTable1782950400008`:

```ts
import { RemoveInternoConfidencialidade1782950400009 } from './1782950400009-RemoveInternoConfidencialidade';
```

and add `RemoveInternoConfidencialidade1782950400009,` to the end of the `migrations: [...]` array.

- [ ] **Step 9: Final check + commit**

Run: `pnpm type-check && pnpm test`
Expected: same result as Step 6 (still just the 2 pre-existing failures).

```bash
git add packages/@ged/database/src/entities/document.entity.ts packages/@ged/types/src/index.ts apps/api/src/modules/documents/documents.service.spec.ts apps/web/src/components/documents/upload-document-form.tsx apps/web/src/components/documents/document-list.tsx "apps/web/src/app/(dashboard)/documents/[id]/_components/document-detail-page-client.tsx" packages/@ged/database/src/migrations/1782950400009-RemoveInternoConfidencialidade.ts packages/@ged/database/src/migrations/run.ts
git commit -m "feat(documents): remove INTERNO confidencialidade level, default to RESTRITO"
```

---

### Task 2: Access grant entities — `DocumentAccessDepartment` + `DocumentAccessUser`

**Files:**
- Create: `packages/@ged/database/src/entities/document-access-department.entity.ts`
- Create: `packages/@ged/database/src/entities/document-access-user.entity.ts`
- Modify: `packages/@ged/database/src/index.ts`
- Modify: `apps/api/src/database/database.module.ts`
- Create: `packages/@ged/database/src/migrations/1782950400010-CreateDocumentAccessGrantsTable.ts`
- Modify: `packages/@ged/database/src/migrations/run.ts`

**Interfaces:**
- Consumes: `Document` from `./document.entity`, `Department` from `./department.entity`, `User` from `./user.entity` (all already exist, unchanged).
- Produces: `DocumentAccessDepartment { id, documentId, departamentoId, createdAt }` (table `document_access_departments`, unique on `(documentId, departamentoId)`), `DocumentAccessUser { id, documentId, usuarioId, createdAt }` (table `document_access_users`, unique on `(documentId, usuarioId)`). Both exported from `@ged/database`. Task 5's use-case and Task 7's repository query depend on these exact shapes and table names.

- [ ] **Step 1: Create `DocumentAccessDepartment`**

Create `packages/@ged/database/src/entities/document-access-department.entity.ts`:

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Document } from './document.entity';
import { Department } from './department.entity';

@Entity('document_access_departments')
@Unique(['documentId', 'departamentoId'])
export class DocumentAccessDepartment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document!: Document;

  @Column({ name: 'departamento_id', type: 'uuid' })
  departamentoId!: string;

  @ManyToOne(() => Department, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Department;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
```

- [ ] **Step 2: Create `DocumentAccessUser`**

Create `packages/@ged/database/src/entities/document-access-user.entity.ts`:

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Document } from './document.entity';
import { User } from './user.entity';

@Entity('document_access_users')
@Unique(['documentId', 'usuarioId'])
export class DocumentAccessUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document!: Document;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
```

- [ ] **Step 3: Export both from the package barrel**

In `packages/@ged/database/src/index.ts`, add after the `DocumentLead` export block:

```ts
export { DocumentAccessDepartment } from './entities/document-access-department.entity';
export { DocumentAccessUser } from './entities/document-access-user.entity';
```

- [ ] **Step 4: Register both in `DatabaseModule`**

In `apps/api/src/database/database.module.ts`, add `DocumentAccessDepartment, DocumentAccessUser` to both the `import { ... } from '@ged/database'` list and the `entities: [...]` array (after `DocumentLead` in each).

- [ ] **Step 5: Write the migration**

Create `packages/@ged/database/src/migrations/1782950400010-CreateDocumentAccessGrantsTable.ts`:

```ts
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentAccessGrantsTable1782950400010 implements MigrationInterface {
  name = 'CreateDocumentAccessGrantsTable1782950400010';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_access_departments" (
        "id"              UUID      NOT NULL DEFAULT gen_random_uuid(),
        "document_id"     UUID      NOT NULL,
        "departamento_id" UUID      NOT NULL,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_access_departments_id"          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_document_access_departments_doc_dept"    UNIQUE ("document_id", "departamento_id"),
        CONSTRAINT "FK_document_access_departments_document_id" FOREIGN KEY ("document_id")
          REFERENCES "documents" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_document_access_departments_dept_id"     FOREIGN KEY ("departamento_id")
          REFERENCES "departments" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_document_access_departments_document_id" ON "document_access_departments" ("document_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_access_users" (
        "id"          UUID      NOT NULL DEFAULT gen_random_uuid(),
        "document_id" UUID      NOT NULL,
        "usuario_id"  UUID      NOT NULL,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_access_users_id"          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_document_access_users_doc_user"    UNIQUE ("document_id", "usuario_id"),
        CONSTRAINT "FK_document_access_users_document_id" FOREIGN KEY ("document_id")
          REFERENCES "documents" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_document_access_users_usuario_id"  FOREIGN KEY ("usuario_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_document_access_users_document_id" ON "document_access_users" ("document_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "document_access_users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_access_departments"`);
  }
}
```

- [ ] **Step 6: Register the migration**

In `packages/@ged/database/src/migrations/run.ts`, add the import after Task 1's `RemoveInternoConfidencialidade1782950400009` and append `CreateDocumentAccessGrantsTable1782950400010,` to the `migrations: [...]` array.

- [ ] **Step 7: Verify**

Run: `pnpm type-check`
Expected: PASS. (No dedicated unit test for a plain join-entity class — same as `user-department.entity.ts` and `document-lead.entity.ts`, which have none either; correctness here is covered by TypeScript compilation of the decorators plus Task 5's use-case tests, which exercise these entities through a mocked repository.)

- [ ] **Step 8: Commit**

```bash
git add packages/@ged/database/src/entities/document-access-department.entity.ts packages/@ged/database/src/entities/document-access-user.entity.ts packages/@ged/database/src/index.ts apps/api/src/database/database.module.ts packages/@ged/database/src/migrations/1782950400010-CreateDocumentAccessGrantsTable.ts packages/@ged/database/src/migrations/run.ts
git commit -m "feat(database): add document_access_departments and document_access_users grant tables"
```

---

### Task 3: `DOCUMENTS_MANAGE_CONFIDENTIALITY` permission seed

**Files:**
- Modify: `apps/api/src/database/seeds/permissions.seed.ts`

**Interfaces:**
- Produces: a permission row with `nome = 'DOCUMENTS_MANAGE_CONFIDENTIALITY'` under a new `documentos` module, seeded idempotently (checked by `nome`, same as every other entry in this file). Task 4's authorization helper checks this exact string via `UserPermissionsService.hasPermission(userId, 'DOCUMENTS_MANAGE_CONFIDENTIALITY')`.

- [ ] **Step 1: Add the module + permission seed entry**

In `apps/api/src/database/seeds/permissions.seed.ts`, add a new entry to `MODULE_SEEDS` (after the `'settings'` entry):

```ts
  {
    nome: 'Documentos',
    slug: 'documentos',
    descricao: 'Gestão de documentos',
    icone: 'FileText',
    ordem: 300,
    permissions: [
      {
        nome: 'DOCUMENTS_MANAGE_CONFIDENTIALITY',
        descricao: 'Gerenciar confidencialidade e acesso de documentos',
      },
    ],
  },
```

- [ ] **Step 2: Verify**

Run: `pnpm type-check`
Expected: PASS. This file has no dedicated spec (none of the sibling entries do either — `seedPermissions` is invoked at API boot, not unit-tested); correctness is a straight data-literal addition matching the existing `ModuleSeed`/`PermissionSeed` shape exactly, and will take effect the next time the API boots against a real database (picked up in this plan's final verification pass).

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/database/seeds/permissions.seed.ts
git commit -m "feat(permissions): seed DOCUMENTS_MANAGE_CONFIDENTIALITY permission"
```

---

### Task 4: DTOs + `canManageConfidentiality` authorization

**Files:**
- Modify: `apps/api/src/modules/documents/dto/create-document.dto.ts`
- Modify: `apps/api/src/modules/documents/dto/update-document.dto.ts`
- Create: `apps/api/src/modules/documents/authorization/can-manage-confidentiality.ts`
- Create: `apps/api/src/modules/documents/authorization/can-manage-confidentiality.spec.ts`

**Interfaces:**
- Consumes: `JwtPayload` (`{ sub, email, role }`) from `@ged/types`, `ROLE` from `@ged/database`, `UserPermissionsService.hasPermission(userId, name): Promise<boolean>` (already exists, `apps/api/src/modules/user-permissions/user-permissions.service.ts`).
- Produces: `canManageConfidentiality(user: JwtPayload, permissionChecker: { hasPermission(userId: string, name: string): Promise<boolean> }): Promise<boolean>` — Task 5's use-case imports and calls this. Also produces `CreateDocumentDto.confidencialidade` now **optional** (was required), plus new optional `accessUserIds?: string[]` and `accessDepartamentoIds?: string[]` on both Create and Update DTOs — Task 6 reads these fields.

- [ ] **Step 1: Write the failing test for the authorization helper**

Create `apps/api/src/modules/documents/authorization/can-manage-confidentiality.spec.ts`:

```ts
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { canManageConfidentiality } from './can-manage-confidentiality';

const makeUser = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.VIEWER,
  ...overrides,
});

describe('canManageConfidentiality', () => {
  it('returns true for ADMIN without checking permissions', async () => {
    const hasPermission = jest.fn();
    const result = await canManageConfidentiality(makeUser({ role: ROLE.ADMIN }), {
      hasPermission,
    });
    expect(result).toBe(true);
    expect(hasPermission).not.toHaveBeenCalled();
  });

  it('returns true for SUPER_ADMIN without checking permissions', async () => {
    const hasPermission = jest.fn();
    const result = await canManageConfidentiality(makeUser({ role: ROLE.SUPER_ADMIN }), {
      hasPermission,
    });
    expect(result).toBe(true);
    expect(hasPermission).not.toHaveBeenCalled();
  });

  it('returns false for MANAGER without the permission', async () => {
    const hasPermission = jest.fn().mockResolvedValue(false);
    const result = await canManageConfidentiality(makeUser({ role: ROLE.MANAGER }), {
      hasPermission,
    });
    expect(result).toBe(false);
    expect(hasPermission).toHaveBeenCalledWith('user-1', 'DOCUMENTS_MANAGE_CONFIDENTIALITY');
  });

  it('returns true for VIEWER with the granted permission', async () => {
    const hasPermission = jest.fn().mockResolvedValue(true);
    const result = await canManageConfidentiality(
      makeUser({ sub: 'viewer-9', role: ROLE.VIEWER }),
      { hasPermission },
    );
    expect(result).toBe(true);
    expect(hasPermission).toHaveBeenCalledWith('viewer-9', 'DOCUMENTS_MANAGE_CONFIDENTIALITY');
  });

  it('returns false for VIEWER without the permission', async () => {
    const hasPermission = jest.fn().mockResolvedValue(false);
    const result = await canManageConfidentiality(makeUser({ role: ROLE.VIEWER }), {
      hasPermission,
    });
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter=api test can-manage-confidentiality`
Expected: FAIL — `Cannot find module './can-manage-confidentiality'`.

- [ ] **Step 3: Implement the helper**

Create `apps/api/src/modules/documents/authorization/can-manage-confidentiality.ts`:

```ts
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';

export const DOCUMENTS_MANAGE_CONFIDENTIALITY_PERMISSION = 'DOCUMENTS_MANAGE_CONFIDENTIALITY';

export interface PermissionChecker {
  hasPermission(userId: string, name: string): Promise<boolean>;
}

export async function canManageConfidentiality(
  user: JwtPayload,
  permissionChecker: PermissionChecker,
): Promise<boolean> {
  if (user.role === ROLE.ADMIN || user.role === ROLE.SUPER_ADMIN) {
    return true;
  }
  return permissionChecker.hasPermission(user.sub, DOCUMENTS_MANAGE_CONFIDENTIALITY_PERMISSION);
}
```

- [ ] **Step 4: Run the test again to verify it passes**

Run: `pnpm --filter=api test can-manage-confidentiality`
Expected: PASS, 5/5.

- [ ] **Step 5: Update `CreateDocumentDto`**

In `apps/api/src/modules/documents/dto/create-document.dto.ts`, change `confidencialidade` from required to optional, and add the two grant fields:

```ts
  @IsOptional()
  @IsIn(Object.values(CONFIDENCIALIDADE))
  readonly confidencialidade?: Confidencialidade;

  @IsUUID()
  readonly departamentoId!: string;

  @IsUUID()
  readonly serieId!: string;

  @IsOptional()
  @IsUUID()
  readonly dossieId?: string | null;

  @IsOptional()
  @IsUUID('all', { each: true })
  readonly accessDepartamentoIds?: string[];

  @IsOptional()
  @IsUUID('all', { each: true })
  readonly accessUserIds?: string[];
```

(keep `destaque`/`exigeCadastro` as they are; only `confidencialidade` loses `@IsIn` → gains `@IsOptional`, and the two new fields are added — the `serieId`/`departamentoId`/`dossieId` block above is shown for placement context, don't duplicate it.)

- [ ] **Step 6: Update `UpdateDocumentDto`**

In `apps/api/src/modules/documents/dto/update-document.dto.ts`, add the same two fields (it's already `@IsOptional() confidencialidade?`, no change needed there):

```ts
  @IsOptional()
  @IsUUID('all', { each: true })
  readonly accessDepartamentoIds?: string[];

  @IsOptional()
  @IsUUID('all', { each: true })
  readonly accessUserIds?: string[];
```

(add after the existing `exigeCadastro` field.)

- [ ] **Step 7: Verify the whole suite**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: PASS except the 2 known pre-existing web failures. (`CreateDocumentDto.confidencialidade` becoming optional does not yet change runtime behavior — nothing reads the new optional-ness or the two new fields until Task 6 wires them in Task 5's use-case is what actually applies a default. This task only adds surface area.)

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/documents/dto/create-document.dto.ts apps/api/src/modules/documents/dto/update-document.dto.ts apps/api/src/modules/documents/authorization/can-manage-confidentiality.ts apps/api/src/modules/documents/authorization/can-manage-confidentiality.spec.ts
git commit -m "feat(documents): add confidentiality DTOs fields and canManageConfidentiality authorization helper"
```

---

### Task 5: `ApplyDocumentConfidentialityUseCase`

**Files:**
- Create: `apps/api/src/modules/documents/use-cases/apply-document-confidentiality.use-case.ts`
- Create: `apps/api/src/modules/documents/use-cases/apply-document-confidentiality.use-case.spec.ts`

**Interfaces:**
- Consumes: `canManageConfidentiality` (Task 4), `UserPermissionsService` (existing, `apps/api/src/modules/user-permissions/user-permissions.service.ts`), `DocumentAccessDepartment`/`DocumentAccessUser` (Task 2), `DataSource` via `@InjectDataSource()` — mirrors the transactional pattern in `apps/api/src/modules/users/use-cases/create-user-with-profile.use-case.ts` and the diff-and-sync pattern in `apps/api/src/modules/user-departments/user-departments.service.ts`'s `syncWithManager`.
- Produces:
  ```ts
  export interface ApplyConfidentialityInput {
    readonly documentId: string;
    readonly requestedConfidencialidade: Confidencialidade | undefined; // undefined = "not being changed" on update; always RESTRITO-or-explicit on create, see Task 6
    readonly requestedAccessDepartamentoIds: string[] | undefined;
    readonly requestedAccessUserIds: string[] | undefined;
    readonly actingUser: JwtPayload;
  }
  export interface ApplyConfidentialityResult {
    readonly confidencialidade: Confidencialidade;
  }
  @Injectable()
  export class ApplyDocumentConfidentialityUseCase {
    execute(input: ApplyConfidentialityInput, manager: EntityManager): Promise<ApplyConfidentialityResult>;
  }
  ```
  Task 6 calls `execute(input, manager)` **inside an already-open transaction** (the use-case does not open its own — upload and update each wrap it in their own `dataSource.transaction(...)`, so document creation and grant-sync are atomic together).

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/modules/documents/use-cases/apply-document-confidentiality.use-case.spec.ts`:

```ts
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CONFIDENCIALIDADE, ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { ApplyDocumentConfidentialityUseCase } from './apply-document-confidentiality.use-case';
import { UserPermissionsService } from '../../user-permissions/user-permissions.service';

const makeUser = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.VIEWER,
  ...overrides,
});

describe('ApplyDocumentConfidentialityUseCase', () => {
  let useCase: ApplyDocumentConfidentialityUseCase;
  let userPermissionsService: jest.Mocked<Pick<UserPermissionsService, 'hasPermission'>>;
  let manager: {
    find: jest.Mock;
    delete: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    userPermissionsService = { hasPermission: jest.fn().mockResolvedValue(false) };
    useCase = new ApplyDocumentConfidentialityUseCase(
      userPermissionsService as unknown as UserPermissionsService,
    );
    manager = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      create: jest.fn((_entity, data) => data),
      save: jest.fn(),
    };
  });

  it('a VIEWER without the permission is silently held at RESTRITO with no grants, even if they request otherwise', async () => {
    const result = await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
        requestedAccessDepartamentoIds: ['dept-9'],
        requestedAccessUserIds: ['user-9'],
        actingUser: makeUser({ role: ROLE.VIEWER }),
      },
      manager as never,
    );

    expect(result.confidencialidade).toBe(CONFIDENCIALIDADE.RESTRITO);
    expect(manager.delete).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('an ADMIN can set PUBLICO with no grants required', async () => {
    const result = await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.PUBLICO,
        requestedAccessDepartamentoIds: undefined,
        requestedAccessUserIds: undefined,
        actingUser: makeUser({ role: ROLE.ADMIN }),
      },
      manager as never,
    );

    expect(result.confidencialidade).toBe(CONFIDENCIALIDADE.PUBLICO);
  });

  it('an ADMIN setting CONFIDENCIAL with no accessUserIds throws BadRequestException', async () => {
    await expect(
      useCase.execute(
        {
          documentId: 'doc-1',
          requestedConfidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
          requestedAccessDepartamentoIds: undefined,
          requestedAccessUserIds: [],
          actingUser: makeUser({ role: ROLE.ADMIN }),
        },
        manager as never,
      ),
    ).rejects.toThrow(
      new BadRequestException('Documentos confidenciais exigem ao menos um usuário com acesso'),
    );
  });

  it('CONFIDENCIAL auto-includes the acting user in accessUserIds', async () => {
    await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
        requestedAccessDepartamentoIds: undefined,
        requestedAccessUserIds: ['other-user'],
        actingUser: makeUser({ sub: 'acting-user', role: ROLE.ADMIN }),
      },
      manager as never,
    );

    const savedRows = manager.save.mock.calls[0][1] as Array<{ usuarioId: string }>;
    expect(savedRows.map((r) => r.usuarioId).sort()).toEqual(['acting-user', 'other-user']);
  });

  it('a MANAGER with the granted permission can manage confidentiality', async () => {
    userPermissionsService.hasPermission.mockResolvedValue(true);

    const result = await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.RESTRITO,
        requestedAccessDepartamentoIds: ['dept-2'],
        requestedAccessUserIds: undefined,
        actingUser: makeUser({ sub: 'manager-1', role: ROLE.MANAGER }),
      },
      manager as never,
    );

    expect(userPermissionsService.hasPermission).toHaveBeenCalledWith(
      'manager-1',
      'DOCUMENTS_MANAGE_CONFIDENTIALITY',
    );
    expect(result.confidencialidade).toBe(CONFIDENCIALIDADE.RESTRITO);
  });

  it('switching to PUBLICO clears any existing department/user grants', async () => {
    manager.find.mockImplementation((entity: { name: string }) => {
      if (entity.name === 'DocumentAccessDepartment') {
        return Promise.resolve([{ departamentoId: 'dept-1' }]);
      }
      return Promise.resolve([]);
    });

    await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.PUBLICO,
        requestedAccessDepartamentoIds: undefined,
        requestedAccessUserIds: undefined,
        actingUser: makeUser({ role: ROLE.ADMIN }),
      },
      manager as never,
    );

    expect(manager.delete).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'DocumentAccessDepartment' }),
      { documentId: 'doc-1' },
    );
  });

  it('requestedConfidencialidade undefined on update leaves the level unchanged (returns RESTRITO default only as the no-op signal for the caller to skip)', async () => {
    // When nothing is requested (update without touching confidentiality), the use-case
    // still needs a level to return the grant-sync no-op cleanly — the caller (documents.service.ts)
    // only invokes this use-case at all when at least one of confidencialidade/accessUserIds/
    // accessDepartamentoIds is present in the update payload (see Task 6).
    const result = await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: undefined,
        requestedAccessDepartamentoIds: ['dept-1'],
        requestedAccessUserIds: undefined,
        actingUser: makeUser({ role: ROLE.ADMIN }),
      },
      manager as never,
    );

    expect(result.confidencialidade).toBe(CONFIDENCIALIDADE.RESTRITO);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter=api test apply-document-confidentiality`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the use-case**

Create `apps/api/src/modules/documents/use-cases/apply-document-confidentiality.use-case.ts`:

```ts
import { BadRequestException, Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { In } from 'typeorm';
import { CONFIDENCIALIDADE, DocumentAccessDepartment, DocumentAccessUser } from '@ged/database';
import type { Confidencialidade } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { UserPermissionsService } from '../../user-permissions/user-permissions.service';
import { canManageConfidentiality } from '../authorization/can-manage-confidentiality';

export interface ApplyConfidentialityInput {
  readonly documentId: string;
  readonly requestedConfidencialidade: Confidencialidade | undefined;
  readonly requestedAccessDepartamentoIds: string[] | undefined;
  readonly requestedAccessUserIds: string[] | undefined;
  readonly actingUser: JwtPayload;
}

export interface ApplyConfidentialityResult {
  readonly confidencialidade: Confidencialidade;
}

@Injectable()
export class ApplyDocumentConfidentialityUseCase {
  constructor(private readonly userPermissionsService: UserPermissionsService) {}

  async execute(
    input: ApplyConfidentialityInput,
    manager: EntityManager,
  ): Promise<ApplyConfidentialityResult> {
    const requestsManagement =
      (input.requestedConfidencialidade !== undefined &&
        input.requestedConfidencialidade !== CONFIDENCIALIDADE.RESTRITO) ||
      (input.requestedAccessDepartamentoIds?.length ?? 0) > 0 ||
      (input.requestedAccessUserIds?.length ?? 0) > 0;

    const allowed = requestsManagement
      ? await canManageConfidentiality(input.actingUser, this.userPermissionsService)
      : true;

    const confidencialidade: Confidencialidade = allowed
      ? (input.requestedConfidencialidade ?? CONFIDENCIALIDADE.RESTRITO)
      : CONFIDENCIALIDADE.RESTRITO;

    if (confidencialidade === CONFIDENCIALIDADE.CONFIDENCIAL) {
      const requestedUserIds = allowed ? (input.requestedAccessUserIds ?? []) : [];
      if (requestedUserIds.length === 0) {
        throw new BadRequestException(
          'Documentos confidenciais exigem ao menos um usuário com acesso',
        );
      }
      const accessUserIds = requestedUserIds.includes(input.actingUser.sub)
        ? requestedUserIds
        : [...requestedUserIds, input.actingUser.sub];

      await this.syncDepartmentGrants(manager, input.documentId, []);
      await this.syncUserGrants(manager, input.documentId, accessUserIds);
      return { confidencialidade };
    }

    if (confidencialidade === CONFIDENCIALIDADE.RESTRITO) {
      const accessDepartamentoIds = allowed
        ? (input.requestedAccessDepartamentoIds ?? [])
        : [];
      await this.syncDepartmentGrants(manager, input.documentId, accessDepartamentoIds);
      await this.syncUserGrants(manager, input.documentId, []);
      return { confidencialidade };
    }

    // PUBLICO — nenhuma liberação por departamento/usuário faz sentido.
    await this.syncDepartmentGrants(manager, input.documentId, []);
    await this.syncUserGrants(manager, input.documentId, []);
    return { confidencialidade };
  }

  private async syncDepartmentGrants(
    manager: EntityManager,
    documentId: string,
    departamentoIds: string[],
  ): Promise<void> {
    const current = await manager.find(DocumentAccessDepartment, { where: { documentId } });
    const currentIds = current.map((row) => row.departamentoId);
    const toRemove = currentIds.filter((id) => !departamentoIds.includes(id));
    const toAdd = departamentoIds.filter((id) => !currentIds.includes(id));

    if (toRemove.length > 0) {
      await manager.delete(DocumentAccessDepartment, { documentId, departamentoId: In(toRemove) });
    }
    if (toAdd.length > 0) {
      const rows = toAdd.map((departamentoId) =>
        manager.create(DocumentAccessDepartment, { documentId, departamentoId }),
      );
      await manager.save(DocumentAccessDepartment, rows);
    }
  }

  private async syncUserGrants(
    manager: EntityManager,
    documentId: string,
    usuarioIds: string[],
  ): Promise<void> {
    const current = await manager.find(DocumentAccessUser, { where: { documentId } });
    const currentIds = current.map((row) => row.usuarioId);
    const toRemove = currentIds.filter((id) => !usuarioIds.includes(id));
    const toAdd = usuarioIds.filter((id) => !currentIds.includes(id));

    if (toRemove.length > 0) {
      await manager.delete(DocumentAccessUser, { documentId, usuarioId: In(toRemove) });
    }
    if (toAdd.length > 0) {
      const rows = toAdd.map((usuarioId) => manager.create(DocumentAccessUser, { documentId, usuarioId }));
      await manager.save(DocumentAccessUser, rows);
    }
  }
}
```

Note on the `'switching to PUBLICO clears...'` test from Step 1: `manager.delete`'s first argument in real TypeORM is the entity class (`DocumentAccessDepartment`), whose `.name` is `'DocumentAccessDepartment'` — the mock assertion `expect.objectContaining({ name: 'DocumentAccessDepartment' })` matches the class itself (classes are functions, which have a `.name` property equal to their declared name), so no special test wiring is needed for that assertion to work against the real class reference.

- [ ] **Step 4: Run the tests again to verify they pass**

Run: `pnpm --filter=api test apply-document-confidentiality`
Expected: PASS, 7/7.

- [ ] **Step 5: Full verification**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: PASS except the 2 known pre-existing web failures. This use-case isn't wired into `DocumentsModule`/`DocumentsService` yet (Task 6) — that's fine, it's a standalone, independently-tested unit at this point.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/documents/use-cases/apply-document-confidentiality.use-case.ts apps/api/src/modules/documents/use-cases/apply-document-confidentiality.use-case.spec.ts
git commit -m "feat(documents): add ApplyDocumentConfidentialityUseCase"
```

---

### Task 6: Wire confidentiality management into upload + update

**Files:**
- Modify: `apps/api/src/modules/documents/documents.module.ts`
- Modify: `apps/api/src/modules/documents/use-cases/upload-document.use-case.ts`
- Modify: `apps/api/src/modules/documents/documents.service.ts`
- Modify: `apps/api/src/modules/documents/documents.service.spec.ts`
- Modify: `apps/api/src/modules/documents/use-cases/upload-document.use-case.spec.ts` (if it exists — check first; if not, this step is skipped, see Step 1)

**Interfaces:**
- Consumes: `ApplyDocumentConfidentialityUseCase` (Task 5), `CreateDocumentDto`/`UpdateDocumentDto`'s new `accessDepartamentoIds`/`accessUserIds` fields (Task 4).
- Produces: `UploadDocumentUseCase.execute` now takes `actingUser: JwtPayload` as a second-to-last constructor-free parameter addition to its data object (`UploadDocumentData` gains `actingUser`), and wraps document creation + confidentiality application in one transaction. `DocumentsService.update(id, data, actingUser)` gains a required third parameter. Task 8 (controller wiring) and Task 9 (response DTO) depend on `update`'s new signature.

- [ ] **Step 1: Read the existing `upload-document.use-case.spec.ts`**

`apps/api/src/modules/documents/use-cases/upload-document.use-case.spec.ts` already exists (confirmed) — read it fully before Step 4 below. It currently constructs `UploadDocumentUseCase` with mocks for `documentRepository`, `storageService`, `departmentRepo`, `documentSeriesRepo`, `dossieRepo`. You'll extend that setup with two more: a mock `DataSource` (`{ transaction: jest.fn((cb) => cb(mockManager)) }` where `mockManager = { create: jest.fn((_e, d) => d), save: jest.fn(), update: jest.fn(), findOneOrFail: jest.fn() }`) and a mock `ApplyDocumentConfidentialityUseCase` (`{ execute: jest.fn() }`). Every existing test's assertions against `documentRepository.create(...)` must move to asserting against the mock manager's `save`/`update`/`findOneOrFail` instead, since Step 2 below replaces `documentRepository.create` with the transactional `manager`-based flow.

- [ ] **Step 2: Update `UploadDocumentData` and wrap creation in a transaction**

In `apps/api/src/modules/documents/use-cases/upload-document.use-case.ts`:

Replace the imports at the top:

```ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Department,
  Document,
  DOCUMENT_FASE,
  DocumentSeries,
  Dossie,
} from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { STORAGE_SERVICE } from '../../storage/interfaces/storage.interface';
import type { IStorageService } from '../../storage/interfaces/storage.interface';
import { DOCUMENT_REPOSITORY } from '../interfaces/document-repository.interface';
import type { IDocumentRepository } from '../interfaces/document-repository.interface';
import { ApplyDocumentConfidentialityUseCase } from './apply-document-confidentiality.use-case';
```

Add `actingUser` to `UploadDocumentData`:

```ts
export interface UploadDocumentData {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly validade?: string | null;
  readonly confidencialidade?: Document['confidencialidade'];
  readonly departamentoId: string;
  readonly serieId: string;
  readonly dossieId?: string | null;
  readonly destaque?: boolean;
  readonly exigeCadastro?: boolean;
  readonly accessDepartamentoIds?: string[];
  readonly accessUserIds?: string[];
  readonly actingUser: JwtPayload;
}
```

(`confidencialidade` becomes optional here too, mirroring the DTO from Task 4.)

Update the constructor to inject the new use-case and `DataSource`:

```ts
@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(DocumentSeries)
    private readonly documentSeriesRepo: Repository<DocumentSeries>,
    @InjectRepository(Dossie)
    private readonly dossieRepo: Repository<Dossie>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly applyConfidentiality: ApplyDocumentConfidentialityUseCase,
  ) {}
```

Replace the body of `execute` from the `try { return await this.documentRepository.create(...) } catch` block onward — keep everything above unchanged (the departamento/série/dossiê validation and the `storageService.save` call stay exactly as they are), only replace the final persistence step:

```ts
    try {
      return await this.dataSource.transaction(async (manager) => {
        const created = manager.create(Document, {
          nome: data.nome,
          descricao: data.descricao ?? null,
          validade: data.validade ? new Date(data.validade) : null,
          confidencialidade: 'RESTRITO', // valor provisório, resolvido pelo use-case abaixo
          departamentoId: data.departamentoId,
          serieId: data.serieId,
          dossieId: data.dossieId ?? null,
          fase: DOCUMENT_FASE.CORRENTE,
          faseCorrenteDesde: new Date(),
          arquivoNome: file.originalname,
          arquivoChave: saved.chave,
          arquivoMimeType: file.mimetype,
          arquivoTamanho: saved.tamanho,
          destaque: data.destaque ?? false,
          exigeCadastro: data.exigeCadastro ?? false,
        });
        const savedDocument = await manager.save(Document, created);

        const { confidencialidade } = await this.applyConfidentiality.execute(
          {
            documentId: savedDocument.id,
            requestedConfidencialidade: data.confidencialidade,
            requestedAccessDepartamentoIds: data.accessDepartamentoIds,
            requestedAccessUserIds: data.accessUserIds,
            actingUser: data.actingUser,
          },
          manager,
        );
        await manager.update(Document, savedDocument.id, { confidencialidade });

        return manager.findOneOrFail(Document, {
          where: { id: savedDocument.id },
          relations: ['serie'],
        });
      });
    } catch (error) {
      await this.storageService.delete(saved.chave);
      throw error;
    }
```

(the document was inserted above with a provisional `confidencialidade: 'RESTRITO'` purely to satisfy the NOT NULL column before the use-case resolves the real value; this `manager.update` always writes the resolved value, so there's no conditional needed here.)

- [ ] **Step 3: Update `DocumentsService.upload` and `.update` to pass `actingUser`**

In `apps/api/src/modules/documents/documents.service.ts`:

Add `ApplyDocumentConfidentialityUseCase` to the constructor:

```ts
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    @InjectRepository(DocumentSeries)
    private readonly documentSeriesRepo: Repository<DocumentSeries>,
    @InjectRepository(Dossie)
    private readonly dossieRepo: Repository<Dossie>,
    private readonly userDepartmentsService: UserDepartmentsService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly applyConfidentiality: ApplyDocumentConfidentialityUseCase,
  ) {}
```

Add the needed imports at the top: `import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';` (extend the existing `InjectRepository` import), `import { DataSource, Repository } from 'typeorm';` (extend existing `Repository` import), `import { ApplyDocumentConfidentialityUseCase } from './use-cases/apply-document-confidentiality.use-case';`.

`upload` stays a thin delegate but now must forward `actingUser` — its call site is the controller (Task 8), so its own signature doesn't change; only the DTO passed through must now include `actingUser`, which the controller assembles. No change needed to `upload()`'s body itself, it already just forwards `dto` to `uploadDocumentUseCase.execute(dto, file)`.

Change `UpdateDocumentInputData` to include the grant fields, and change `update`'s signature to accept `actingUser` and route through the use-case:

```ts
export interface UpdateDocumentInputData {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly validade?: string | null;
  readonly confidencialidade?: Confidencialidade;
  readonly serieId?: string;
  readonly dossieId?: string | null;
  readonly isActive?: boolean;
  readonly destaque?: boolean;
  readonly exigeCadastro?: boolean;
  readonly accessDepartamentoIds?: string[];
  readonly accessUserIds?: string[];
}
```

Replace the `async update(id: string, data: UpdateDocumentInputData): Promise<Document>` method body's tail (everything stays the same through the série/dossiê validation) — replace only the final block:

```ts
  async update(
    id: string,
    data: UpdateDocumentInputData,
    actingUser: JwtPayload,
  ): Promise<Document> {
    const current = await this.findOne(id);

    if (data.serieId && data.serieId !== current.serieId) {
      const serie = await this.documentSeriesRepo.findOne({ where: { id: data.serieId } });
      if (!serie) {
        throw new BadRequestException('Série não encontrada');
      }
      if (serie.departamentoId !== current.departamentoId) {
        throw new BadRequestException(
          'A série deve pertencer ao mesmo departamento do documento',
        );
      }
    }

    if (data.dossieId && data.dossieId !== current.dossieId) {
      const dossie = await this.dossieRepo.findOne({ where: { id: data.dossieId } });
      if (!dossie) {
        throw new BadRequestException('Dossiê não encontrado');
      }
      if (dossie.departamentoId !== current.departamentoId) {
        throw new BadRequestException(
          'O dossiê deve pertencer ao mesmo departamento do documento',
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const managesConfidentiality =
        data.confidencialidade !== undefined ||
        data.accessDepartamentoIds !== undefined ||
        data.accessUserIds !== undefined;

      let confidencialidade = current.confidencialidade;
      if (managesConfidentiality) {
        const result = await this.applyConfidentiality.execute(
          {
            documentId: id,
            requestedConfidencialidade: data.confidencialidade,
            requestedAccessDepartamentoIds: data.accessDepartamentoIds,
            requestedAccessUserIds: data.accessUserIds,
            actingUser,
          },
          manager,
        );
        confidencialidade = result.confidencialidade;
      }

      const updateData: UpdateDocumentData = {
        nome: data.nome,
        descricao: data.descricao,
        validade:
          data.validade !== undefined ? (data.validade ? new Date(data.validade) : null) : undefined,
        confidencialidade: managesConfidentiality ? confidencialidade : undefined,
        serieId: data.serieId,
        dossieId: data.dossieId,
        isActive: data.isActive,
        destaque: data.destaque,
        exigeCadastro: data.exigeCadastro,
      };

      await manager.update(Document, id, this.stripUndefined(updateData));
      return manager.findOneOrFail(Document, { where: { id }, relations: ['serie'] });
    });
  }

  private stripUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }
```

Note: this switches `update`'s persistence from `this.documentRepository.update(id, updateData)` (repository-interface call) to `manager.update(Document, id, ...)` directly, because it must run inside the same transaction as the confidentiality grant sync. `IDocumentRepository.update` (used by `transferir`, which is untouched) keeps working exactly as before — it isn't removed, `update()` on the service simply no longer calls it. Add `import { Document } from '@ged/database';` to the existing `@ged/database` import if `Document` isn't already imported as a value (it currently is, check the existing import line — `Document` is already imported, only add `DataSource`-related imports).

- [ ] **Step 4: Update `DocumentsModule` providers**

In `apps/api/src/modules/documents/documents.module.ts`, import and register the new entities/use-case:

```ts
import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Department,
  Document,
  DocumentAccessDepartment,
  DocumentAccessUser,
  DocumentSeries,
  Dossie,
} from '@ged/database';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService, DOCUMENT_REPOSITORY } from './documents.service';
import { DocumentsController } from './documents.controller';
import { UploadDocumentUseCase } from './use-cases/upload-document.use-case';
import { ApplyDocumentConfidentialityUseCase } from './use-cases/apply-document-confidentiality.use-case';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { StorageModule } from '../storage/storage.module';
import { UserDepartmentsModule } from '../user-departments/user-departments.module';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';

@NestModule({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      Department,
      DocumentSeries,
      Dossie,
      DocumentAccessDepartment,
      DocumentAccessUser,
    ]),
    AuditLogsModule,
    StorageModule,
    UserDepartmentsModule,
    UserPermissionsModule,
  ],
  controllers: [DocumentsController],
  providers: [
    { provide: DOCUMENT_REPOSITORY, useClass: DocumentsRepository },
    DocumentsService,
    UploadDocumentUseCase,
    ApplyDocumentConfidentialityUseCase,
    RolesGuard,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
```

Before writing this, run `ls apps/api/src/modules/user-permissions/` to confirm the module's exact export name is `UserPermissionsModule` (it should be, following the sibling `UserDepartmentsModule` pattern already imported here) — if the module doesn't export `UserPermissionsService` as a provider, add it to that module's `exports` array too (read `user-permissions.module.ts` first; it almost certainly already exports the service since `user-permissions.controller.ts` depends on it).

- [ ] **Step 5: Update `documents.service.spec.ts` for the new constructor + method signature**

In `apps/api/src/modules/documents/documents.service.spec.ts`:
- Add a mock for `ApplyDocumentConfidentialityUseCase` (`{ execute: jest.fn() }`) and a mock `DataSource` whose `transaction` implementation just calls the callback with a stub `manager` (`{ update: jest.fn(), findOneOrFail: jest.fn() }`), both registered as providers in the `Test.createTestingModule` block, following the exact same `{ provide: X, useValue: mockY }` pattern already used for `uploadDocumentUseCase`.
- Every existing call to `service.update('doc-1', {...})` in the `describe('update', ...)` block gains a third argument: `makeJwtPayload({ role: ROLE.ADMIN })` (reuse the existing `makeJwtPayload` helper already defined at the top of the file).
- For the `'updates the document when validation passes'` test and similar ones that assert `documentRepository.update` was/wasn't called: those assertions must change, since `update()` no longer calls `documentRepository.update` — it now calls `manager.update`/`manager.findOneOrFail` on the mocked transaction manager. Update the mock `manager.findOneOrFail` to resolve the expected updated document, and assert on `manager.update` instead of `documentRepository.update`.

This step requires reading the full current file (already shown above in this plan's research) and mechanically threading the new mocks through every `update`-related test — there's no new business logic to invent here, just updated test scaffolding to match Task 6's Step 3 signature change.

- [ ] **Step 6: Add upload-use-case coverage for the transaction + confidentiality wiring** (only if Step 1 found no existing spec, or to extend one that exists)

Add (or extend) `apps/api/src/modules/documents/use-cases/upload-document.use-case.spec.ts` with a test asserting: given a valid upload, `applyConfidentiality.execute` is called with `documentId` equal to the newly-created document's id, and the returned document's `confidencialidade` matches what `applyConfidentiality.execute` resolved (not necessarily what was requested) — mirroring the existing test style in `documents.service.spec.ts` (mock every injected dependency via its DI token/class, `jest.fn()` per method).

- [ ] **Step 7: Run the full suite**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: PASS except the 2 known pre-existing web failures.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/documents/documents.module.ts apps/api/src/modules/documents/use-cases/upload-document.use-case.ts apps/api/src/modules/documents/documents.service.ts apps/api/src/modules/documents/documents.service.spec.ts apps/api/src/modules/documents/use-cases/upload-document.use-case.spec.ts
git commit -m "feat(documents): wire ApplyDocumentConfidentialityUseCase into upload and update flows"
```

---

### Task 7: Access enforcement rewrite (the core security logic)

**Files:**
- Modify: `apps/api/src/modules/documents/documents.service.ts`
- Modify: `apps/api/src/modules/documents/documents.repository.ts`
- Modify: `apps/api/src/modules/documents/interfaces/document-repository.interface.ts`
- Modify: `apps/api/src/modules/documents/documents.service.spec.ts`

**Interfaces:**
- Consumes: `document_access_departments`/`document_access_users` tables (Task 2).
- Produces: `DocumentQueryFilter` gains `userId?: string` and `userDepartamentoIds?: readonly string[]` (replacing the old `allowedDepartamentoIds`, which conflated "department scope" with "the whole access rule" — the new fields let the repository apply the full per-level rule from Global Constraints). `assertCanAccess` now checks confidencialidade-specific rules instead of department-only.

- [ ] **Step 1: Update the repository interface**

In `apps/api/src/modules/documents/interfaces/document-repository.interface.ts`, replace `DocumentQueryFilter`:

```ts
export interface DocumentQueryFilter {
  readonly departamentoId?: string;
  readonly dossieId?: string;
  readonly serieId?: string;
  readonly fase?: DocumentFase;
  readonly confidencialidade?: Confidencialidade;
  readonly page?: number;
  readonly limit?: number;
  // Quando definido, a listagem é restrita ao que o usuário não-privilegiado pode ver
  // (ver DocumentsService.assertCanAccess para a mesma regra aplicada a um único documento).
  // `null` (papel privilegiado) = sem restrição alguma.
  readonly accessScope?: {
    readonly userId: string;
    readonly userDepartamentoIds: readonly string[];
  } | null;
}
```

Remove the old `allowedDepartamentoIds` field entirely — it's superseded by `accessScope`.

- [ ] **Step 2: Rewrite `DocumentsRepository.findAll`'s access filter**

In `apps/api/src/modules/documents/documents.repository.ts`, replace the `if (filter.allowedDepartamentoIds ...)` block at the end of the existing filter chain with:

```ts
    if (filter.accessScope) {
      const { userId, userDepartamentoIds } = filter.accessScope;
      qb.andWhere(
        `(
          document.confidencialidade = 'PUBLICO'
          OR (
            document.confidencialidade = 'RESTRITO'
            AND (
              document.departamento_id = ANY(:userDepartamentoIds)
              OR EXISTS (
                SELECT 1 FROM document_access_departments dad
                WHERE dad.document_id = document.id
                  AND dad.departamento_id = ANY(:userDepartamentoIds)
              )
            )
          )
          OR (
            document.confidencialidade = 'CONFIDENCIAL'
            AND EXISTS (
              SELECT 1 FROM document_access_users dau
              WHERE dau.document_id = document.id AND dau.usuario_id = :userId
            )
          )
        )`,
        { userDepartamentoIds, userId },
      );
    }
```

Keep everything above this block (the `departamentoId`/`dossieId`/`serieId`/`fase`/`confidencialidade` optional filters) exactly as-is — this new block only replaces the final `allowedDepartamentoIds` conditional. Note `userDepartamentoIds` can be an empty array (a user with zero department memberships) — `= ANY('{}'::uuid[])` in Postgres correctly evaluates to false for every row, so this needs no special-casing, unlike the old code's `.length > 0` guard.

- [ ] **Step 3: Rewrite `DocumentsService`'s access logic**

In `apps/api/src/modules/documents/documents.service.ts`, replace `resolveAllowedDepartamentos` and `assertCanAccess`:

```ts
  private async resolveAccessScope(
    user: JwtPayload,
  ): Promise<{ userId: string; userDepartamentoIds: readonly string[] } | null> {
    if (PRIVILEGED_ROLES.includes(user.role)) {
      return null;
    }
    const departments = await this.userDepartmentsService.findByUserId(user.sub);
    return { userId: user.sub, userDepartamentoIds: departments.map((d) => d.departamentoId) };
  }

  // Não vaza existência: usuário sem acesso recebe 404 (igual a documento inexistente).
  private async assertCanAccess(document: Document, user: JwtPayload): Promise<void> {
    const scope = await this.resolveAccessScope(user);
    if (scope === null) {
      return;
    }
    if (await this.canAccessWithScope(document, scope)) {
      return;
    }
    throw new NotFoundException('Documento não encontrado');
  }

  private async canAccessWithScope(
    document: Document,
    scope: { userId: string; userDepartamentoIds: readonly string[] },
  ): Promise<boolean> {
    if (document.confidencialidade === CONFIDENCIALIDADE.PUBLICO) {
      return true;
    }
    if (document.confidencialidade === CONFIDENCIALIDADE.RESTRITO) {
      if (scope.userDepartamentoIds.includes(document.departamentoId)) {
        return true;
      }
      return this.documentAccessDepartmentRepo.exists({
        where: { documentId: document.id, departamentoId: In([...scope.userDepartamentoIds]) },
      });
    }
    // CONFIDENCIAL
    return this.documentAccessUserRepo.exists({
      where: { documentId: document.id, usuarioId: scope.userId },
    });
  }
```

Add the two new repository injections to the constructor:

```ts
    @InjectRepository(DocumentAccessDepartment)
    private readonly documentAccessDepartmentRepo: Repository<DocumentAccessDepartment>,
    @InjectRepository(DocumentAccessUser)
    private readonly documentAccessUserRepo: Repository<DocumentAccessUser>,
```

Add imports: `CONFIDENCIALIDADE, DocumentAccessDepartment, DocumentAccessUser` to the existing `@ged/database` import, and `In` to the existing `typeorm` import.

Update `findAll` to build `accessScope` instead of `allowed`/`allowedDepartamentoIds`:

```ts
  async findAll(filter: DocumentQueryFilter, user: JwtPayload): Promise<PaginatedDocuments> {
    const accessScope = await this.resolveAccessScope(user);
    if (accessScope !== null && accessScope.userDepartamentoIds.length === 0) {
      // A user without ANY department membership can still see PUBLICO/CONFIDENCIAL grants
      // they hold — do NOT short-circuit to empty here anymore; only the old department-only
      // model could do that. Fall through to the repository query, which correctly evaluates
      // PUBLICO and CONFIDENCIAL independently of userDepartamentoIds being empty.
    }
    return this.documentRepository.findAll({
      ...filter,
      accessScope,
    });
  }
```

(the old early-return-empty-page optimization is removed because it was only correct under the department-only model — a department-less user may still legitimately see `PUBLICO` documents or documents they're individually granted via `CONFIDENCIAL`, so the query must always run now.)

`resolveAllowedDepartamentos` and every caller of `PRIVILEGED_ROLES` elsewhere stays unchanged (still `[SUPER_ADMIN, ADMIN, MANAGER]`).

- [ ] **Step 4: Update `DocumentsModule` to provide the two new repositories**

`TypeOrmModule.forFeature([...])` in `documents.module.ts` already includes `DocumentAccessDepartment, DocumentAccessUser` from Task 6 Step 4 — no further change needed here, `@InjectRepository` in the service will resolve against that same `forFeature` registration.

- [ ] **Step 5: Update `documents.service.spec.ts` for the new access-scope tests**

Replace every test in the `describe('findOne', ...)` and `describe('findAll', ...)` blocks that referenced `allowedDepartamentoIds` with the new `accessScope` shape, and mock `documentAccessDepartmentRepo`/`documentAccessUserRepo` (`{ exists: jest.fn() }`) as new providers in the `Test.createTestingModule` block (`{ provide: getRepositoryToken(DocumentAccessDepartment), useValue: documentAccessDepartmentRepo }`, same pattern as `documentSeriesRepo`). Add these new test cases (write the actual assertions, following the existing file's style exactly):

- `findOne`/`getDownload`: a VIEWER outside their own department but granted via `document_access_departments` for a `RESTRITO` document CAN access it (`documentAccessDepartmentRepo.exists` resolves `true`).
- `findOne`/`getDownload`: a VIEWER not in the grant list still gets `NotFoundException` for `RESTRITO` (`documentAccessDepartmentRepo.exists` resolves `false`).
- `findOne`/`getDownload`: any authenticated VIEWER (even with zero departments) can access a `PUBLICO` document.
- `findOne`/`getDownload`: a VIEWER with a matching row in `document_access_users` can access a `CONFIDENCIAL` document; one without cannot (`NotFoundException`).
- `findAll`: a VIEWER with zero departments now still calls `documentRepository.findAll` (no more short-circuit to an empty page) with `accessScope: { userId, userDepartamentoIds: [] }`.

- [ ] **Step 6: Run the full suite**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: PASS except the 2 known pre-existing web failures.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/documents/documents.service.ts apps/api/src/modules/documents/documents.repository.ts apps/api/src/modules/documents/interfaces/document-repository.interface.ts apps/api/src/modules/documents/documents.service.spec.ts
git commit -m "feat(documents): enforce access by confidencialidade level instead of department-only"
```

---

### Task 8: Expose grants in the response DTO + controller wiring + audit log

**Files:**
- Modify: `apps/api/src/modules/documents/dto/document-response.dto.ts`
- Modify: `apps/api/src/modules/documents/documents.service.ts` (`toResponseDto`, `findById` grant loading)
- Modify: `apps/api/src/modules/documents/documents.repository.ts` (`findById` loads grants for the detail view)
- Modify: `apps/api/src/modules/documents/interfaces/document-repository.interface.ts` (`findById` return shape)
- Modify: `apps/api/src/modules/documents/documents.controller.ts` (pass `currentUser` into `upload`/`update`, extend audit payloads)
- Modify: `packages/@ged/types/src/index.ts` (`DocumentDto`, `UploadDocumentInput`, `UpdateDocumentInput`)

**Interfaces:**
- Produces: `DocumentResponseDto` gains `readonly acessoDepartamentoIds: string[]` and `readonly acessoUsuarioIds: string[]` (always present, empty arrays when not applicable — simpler for frontend consumption than optional fields). `DocumentDto` in `@ged/types` mirrors this. Task 10/11 (frontend) consume these two new fields to pre-fill the edit dialog's selectors.

- [ ] **Step 1: Extend `DocumentResponseDto`**

In `apps/api/src/modules/documents/dto/document-response.dto.ts`, add to `DocumentResponseInput` and the class:

```ts
  acessoDepartamentoIds: string[];
  acessoUsuarioIds: string[];
```

(add to both the `interface DocumentResponseInput` and the `class DocumentResponseDto` field lists, and assign them in the constructor: `this.acessoDepartamentoIds = input.acessoDepartamentoIds; this.acessoUsuarioIds = input.acessoUsuarioIds;`)

- [ ] **Step 2: Load grants alongside the document for the detail view**

In `apps/api/src/modules/documents/documents.service.ts`, add a private helper and use it in `toResponseDto`'s caller. Since `toResponseDto` is synchronous and called from multiple places (list + detail), keep it synchronous but accept the grant arrays as parameters rather than fetching them itself:

```ts
  toResponseDto(
    document: Document,
    grants: { acessoDepartamentoIds: string[]; acessoUsuarioIds: string[] } = {
      acessoDepartamentoIds: [],
      acessoUsuarioIds: [],
    },
  ): DocumentResponseDto {
```

(keep the rest of the method body identical, just add `acessoDepartamentoIds: grants.acessoDepartamentoIds, acessoUsuarioIds: grants.acessoUsuarioIds,` to the `new DocumentResponseDto({...})` call.)

Add a new method to fetch grants for a single document (used only by the controller's `findOne`, not `findAll` — list rows don't need per-row grant detail, keeping list queries cheap):

```ts
  async getAccessGrants(
    documentId: string,
  ): Promise<{ acessoDepartamentoIds: string[]; acessoUsuarioIds: string[] }> {
    const [departmentGrants, userGrants] = await Promise.all([
      this.documentAccessDepartmentRepo.find({ where: { documentId } }),
      this.documentAccessUserRepo.find({ where: { documentId } }),
    ]);
    return {
      acessoDepartamentoIds: departmentGrants.map((g) => g.departamentoId),
      acessoUsuarioIds: userGrants.map((g) => g.usuarioId),
    };
  }
```

- [ ] **Step 3: Wire the controller**

In `apps/api/src/modules/documents/documents.controller.ts`:

`findOne` — load and pass grants:

```ts
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.findOne(id, user);
    const grants = await this.documentsService.getAccessGrants(id);
    return this.documentsService.toResponseDto(document, grants);
  }
```

`findAll` stays calling `toResponseDto(document)` with no second argument (defaults to empty arrays — list rows don't expose grants, matching Task 11's plan to only show/edit grants on the detail page).

`create` — pass `currentUser` through to the service and extend the audit payload:

```ts
  async create(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentResponseDto> {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    const document = await this.documentsService.upload({ ...dto, actingUser: currentUser }, file);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'CRIAR_DOCUMENTO',
      entidade: 'Document',
      entidadeId: document.id,
      dadosAnteriores: null,
      dadosNovos: {
        id: document.id,
        nome: document.nome,
        departamentoId: document.departamentoId,
        serieId: document.serieId,
        dossieId: document.dossieId,
        confidencialidade: document.confidencialidade,
        arquivoNome: document.arquivoNome,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.documentsService.toResponseDto(document);
  }
```

`update` — pass `currentUser` as the third argument, extend the audit `dadosAnteriores`/`dadosNovos` with grant snapshots:

```ts
  async update(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const before = await this.documentsService.findOne(id);
    const grantsBefore = await this.documentsService.getAccessGrants(id);
    const document = await this.documentsService.update(id, dto, currentUser);
    const grantsAfter = await this.documentsService.getAccessGrants(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'ATUALIZAR_DOCUMENTO',
      entidade: 'Document',
      entidadeId: document.id,
      dadosAnteriores: {
        nome: before.nome,
        descricao: before.descricao,
        confidencialidade: before.confidencialidade,
        serieId: before.serieId,
        dossieId: before.dossieId,
        isActive: before.isActive,
        ...grantsBefore,
      },
      dadosNovos: {
        nome: document.nome,
        descricao: document.descricao,
        confidencialidade: document.confidencialidade,
        serieId: document.serieId,
        dossieId: document.dossieId,
        isActive: document.isActive,
        ...grantsAfter,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.documentsService.toResponseDto(document, grantsAfter);
  }
```

- [ ] **Step 4: Mirror the DTO fields in `@ged/types`**

In `packages/@ged/types/src/index.ts`, add to `DocumentDto` (after `exigeCadastro`):

```ts
  readonly acessoDepartamentoIds: string[];
  readonly acessoUsuarioIds: string[];
```

Add to `UploadDocumentInput` and `UpdateDocumentInput` (both already have `confidencialidade?`):

```ts
  readonly accessDepartamentoIds?: string[];
  readonly accessUserIds?: string[];
```

- [ ] **Step 5: Update tests**

Extend `apps/api/src/modules/documents/documents.controller.spec.ts` (read it first — it exists per the earlier repo listing) to cover: `findOne` calls `getAccessGrants` and passes it to `toResponseDto`; `update` passes `currentUser` as the third arg to `service.update`. Follow that file's existing mocking conventions exactly (it's not shown in this plan — read it before editing, same instruction as Task 6 Step 1 for the upload spec).

Also extend `documents.service.spec.ts`'s `toResponseDto` describe block with one test: calling `toResponseDto(document)` with no second argument defaults `acessoDepartamentoIds`/`acessoUsuarioIds` to `[]`.

- [ ] **Step 6: Run the full suite**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: PASS except the 2 known pre-existing web failures.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/documents/dto/document-response.dto.ts apps/api/src/modules/documents/documents.service.ts apps/api/src/modules/documents/documents.repository.ts apps/api/src/modules/documents/interfaces/document-repository.interface.ts apps/api/src/modules/documents/documents.controller.ts apps/api/src/modules/documents/documents.controller.spec.ts packages/@ged/types/src/index.ts apps/api/src/modules/documents/documents.service.spec.ts
git commit -m "feat(documents): expose access grants on the document detail response"
```

---

### Task 9: `MultiCombobox` UI primitive

**Files:**
- Create: `apps/web/src/components/ui/multi-combobox.tsx`
- Create: `apps/web/src/components/ui/multi-combobox.spec.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface MultiComboboxOption { readonly label: string; readonly value: string; }
  export interface MultiComboboxProps {
    readonly values: readonly string[];
    readonly onValuesChange: (values: string[]) => void;
    readonly options: readonly MultiComboboxOption[];
    readonly placeholder?: string;
    readonly searchPlaceholder?: string;
    readonly disabled?: boolean;
    readonly className?: string;
    readonly error?: boolean;
  }
  export function MultiCombobox(props: MultiComboboxProps): JSX.Element;
  ```
  Task 10/11 use this for the `RESTRITO` department picker and the `CONFIDENCIAL` user picker.

- [ ] **Step 1: Use the `ui-ux-pro-max` skill to design and build the component**

Invoke the `ui-ux-pro-max` skill for this component. Context to give it: this app's existing single-select `Combobox` at `apps/web/src/components/ui/combobox.tsx` is the visual/interaction reference (dark-first slate + indigo Tailwind v4 palette, `cn()` from `@/lib/utils`, popover with search input, keyboard nav, click-outside-to-close) — the new `MultiCombobox` must feel like the same design system, not a bolted-on library. Behavior to implement: trigger button shows selected option labels as removable chips (or a "`N` selecionados" summary when many are selected — designer's call, follow the skill's guidance), popover has the same search input, each option row has a checkbox-style indicator (not a native `<input type="checkbox">` — reuse `Check` icon toggling like `Combobox` does, just don't close the popover on select), footer or header "Limpar seleção" affordance. Must satisfy `apps/web/CLAUDE.md`'s ban on native `<select>`/`<input type="checkbox">`.

- [ ] **Step 2: Write tests**

Create `apps/web/src/components/ui/multi-combobox.spec.tsx` covering, at minimum (Testing Library, same style as the existing `apps/web/src/components/layout/sidebar.spec.tsx`/`theme-toggle.spec.tsx` — read one of those first for this repo's exact RTL setup/render helpers before writing):
- Renders placeholder when `values` is empty.
- Clicking the trigger opens the popover and shows all `options`.
- Typing in the search filters the visible options by label (case-insensitive).
- Clicking an unselected option adds it to `values` via `onValuesChange` (called with the previous values plus the new one) **and keeps the popover open** (multi-select, unlike single-select `Combobox`).
- Clicking an already-selected option removes it from `values` via `onValuesChange`.
- Clicking outside the popover closes it.
- `disabled` prevents opening.

- [ ] **Step 3: Run the tests**

Run: `pnpm --filter=web test multi-combobox`
Expected: PASS for every case written in Step 2.

- [ ] **Step 4: Full verification**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: PASS except the 2 known pre-existing failures (this component isn't used anywhere yet, so it can't affect other tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/multi-combobox.tsx apps/web/src/components/ui/multi-combobox.spec.tsx
git commit -m "feat(ui): add MultiCombobox primitive"
```

---

### Task 10: Confidentiality section component + upload form integration

**Files:**
- Create: `apps/web/src/components/documents/confidentiality-section.tsx`
- Create: `apps/web/src/components/documents/confidentiality-section.spec.tsx`
- Modify: `apps/web/src/components/documents/upload-document-form.tsx`
- Modify: `apps/web/src/hooks/use-documents.ts` (`UploadDocumentPayload` gains grant fields)

**Interfaces:**
- Consumes: `MultiCombobox` (Task 9), `usePermissions().hasPermission` (existing), `useDepartments()` (existing), `useUsers()` (existing), `Confidencialidade`/`CONFIDENCIALIDADE` from `@/types`.
- Produces:
  ```ts
  export interface ConfidentialitySectionValue {
    confidencialidade: Confidencialidade;
    accessDepartamentoIds: string[];
    accessUserIds: string[];
    exigeCadastro: boolean;
    destaque: boolean;
  }
  export interface ConfidentialitySectionProps {
    readonly value: ConfidentialitySectionValue;
    readonly onChange: (value: ConfidentialitySectionValue) => void;
    readonly canManage: boolean;
    readonly errors?: { confidencialidade?: string; accessUserIds?: string };
  }
  export function ConfidentialitySection(props: ConfidentialitySectionProps): JSX.Element;
  ```
  Task 11's edit dialog reuses this exact component/props shape.

- [ ] **Step 1: Use the `ui-ux-pro-max` skill to design the section**

Invoke the skill. Context: this section replaces the current single `Combobox` + two `Checkbox`es block in `upload-document-form.tsx` (shown below, "current implementation" for reference) with a richer, level-dependent layout:
- Level selector (`Combobox`, 3 options: Público/Restrito/Confidencial) — disabled (locked to "Restrito", greyed with an explanatory note "Apenas administradores ou usuários com permissão podem definir outro nível") when `canManage` is `false`.
- When `PUBLICO`: two radio-style options "Livre acesso" / "Acesso identificado" driving `exigeCadastro` (false/true) — reuse the existing "Exibir no portal público como destaque" `Checkbox` for `destaque`, both disabled unless level is `PUBLICO`, matching the current form's existing disabled-checkbox pattern.
- When `RESTRITO`: a `MultiCombobox` of departments (`useDepartments()`) bound to `accessDepartamentoIds`, labeled "Departamentos adicionais com acesso" with helper text "O departamento do documento sempre tem acesso.".
- When `CONFIDENCIAL`: a `MultiCombobox` of users (`useUsers()`, label = `${user.name} (${user.email})`) bound to `accessUserIds`, labeled "Usuários com acesso", with the current acting user's own selection pre-checked and **not removable** (skill's call on how to represent "locked" chips — could grey it out or show a small lock icon; must still visually communicate it can't be deselected). Show `errors.accessUserIds` beneath it in `text-xs text-rose-400` per `apps/web/CLAUDE.md`'s form-error convention.
- All of it collapses to nothing extra (just the disabled level selector) when `canManage` is `false` — a non-manager never sees the department/user pickers at all.

Current implementation to replace (for the skill's context, and to know exactly what lines move out of `upload-document-form.tsx` into the new component):

```tsx
      <div className="max-w-xs">
        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
          Confidencialidade <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <Controller
          name="confidencialidade"
          control={control}
          render={({ field }) => (
            <Combobox
              value={field.value}
              onValueChange={field.onChange}
              options={CONFIDENCIALIDADE_OPTIONS}
              placeholder="Selecione a confidencialidade"
              error={!!errors.confidencialidade}
            />
          )}
        />
        {errors.confidencialidade && (
          <p className="text-rose-500 dark:text-rose-400 text-xs mt-1">{errors.confidencialidade.message}</p>
        )}
      </div>

      <div className="space-y-2.5">
        {/* destaque + exigeCadastro checkboxes, both disabled unless isPublico — see current file */}
      </div>
```

- [ ] **Step 2: Write tests**

Create `apps/web/src/components/documents/confidentiality-section.spec.tsx` covering:
- `canManage=false`: level selector renders disabled and shows "Restrito"; no department/user picker renders.
- `canManage=true`, level `RESTRITO`: department `MultiCombobox` renders; user picker does not.
- `canManage=true`, level `CONFIDENCIAL`: user `MultiCombobox` renders; department picker does not; `errors.accessUserIds` renders when passed.
- `canManage=true`, level `PUBLICO`: the livre/identificado toggle and `destaque` checkbox render and are enabled.
- Changing the level combobox calls `onChange` with the new `confidencialidade` and resets `accessDepartamentoIds`/`accessUserIds` to `[]` (switching level clears the other level's grants — mirrors Task 5's backend rule that only one grant type is ever active at a time).

- [ ] **Step 3: Run tests**

Run: `pnpm --filter=web test confidentiality-section`
Expected: PASS for every case in Step 2.

- [ ] **Step 4: Integrate into `upload-document-form.tsx`**

Replace the `confidencialidade` zod field + the destaque/exigeCadastro fields with a nested object matching `ConfidentialitySectionValue`, wire `canManage = usePermissions().hasPermission('DOCUMENTS_MANAGE_CONFIDENTIALITY')`, and render `<ConfidentialitySection>` via `Controller` (same pattern as every other field in this form) in place of the two blocks removed in Task 1 Step 5. Default `confidencialidade` to `CONFIDENCIALIDADE.RESTRITO` in the form's `defaultValues` (previously there was no default — it was required with no default, forcing the user to always pick). Update `onSubmit` to spread the section's fields into the `upload.mutate(...)` payload (`accessDepartamentoIds`, `accessUserIds` alongside the existing `confidencialidade`/`destaque`/`exigeCadastro`).

- [ ] **Step 5: Extend `UploadDocumentPayload` and the multipart body builder**

In `apps/web/src/hooks/use-documents.ts`, add to `UploadDocumentPayload`:

```ts
  accessDepartamentoIds?: string[];
  accessUserIds?: string[];
```

and in `useUploadDocument`'s `mutationFn`, append after the existing `exigeCadastro` append:

```ts
      if (payload.accessDepartamentoIds) {
        payload.accessDepartamentoIds.forEach((id) => formData.append('accessDepartamentoIds[]', id));
      }
      if (payload.accessUserIds) {
        payload.accessUserIds.forEach((id) => formData.append('accessUserIds[]', id));
      }
```

Confirm `CreateDocumentDto`'s `@IsUUID('all', { each: true })` validators (Task 4) correctly parse this `field[]` multipart array convention — check how `class-transformer`/multer already handle any other array field in this codebase (grep `[]'` or an existing multi-value form field in a `*.controller.ts` using `FileInterceptor`); if none exists yet and multer/NestJS doesn't auto-array `field[]` multipart keys, switch to repeated `formData.append('accessDepartamentoIds', id)` (same key, multiple values) instead — NestJS's default `ValidationPipe` with a multipart body normally receives repeated keys as an array without special config, which is the more standard multipart-array convention; prefer that over `field[]` unless you find an existing precedent for `[]` in this codebase.

- [ ] **Step 6: Full verification**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: PASS except the 2 known pre-existing failures.

- [ ] **Step 7: Manual smoke check**

Since this touches a real form flow, per this repo's `CLAUDE.md` workflow note ("para mudanças não-triviais, usar `/verify`"), at minimum start the web dev server (`pnpm --filter=web dev`) and load `/documents/upload` to visually confirm: the section renders, switching levels shows/hides the right controls, and a non-manager test account (if one is easily available) sees the level locked to Restrito. If no manual browser check is feasible in this environment, note that explicitly in the task report rather than claiming it was done.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/documents/confidentiality-section.tsx apps/web/src/components/documents/confidentiality-section.spec.tsx apps/web/src/components/documents/upload-document-form.tsx apps/web/src/hooks/use-documents.ts
git commit -m "feat(web): add ConfidentialitySection and integrate it into the upload form"
```

---

### Task 11: Edit-confidentiality dialog + 3-level badges/filters on list & detail

**Files:**
- Create: `apps/web/src/app/(dashboard)/documents/[id]/_components/edit-confidentiality-dialog.tsx`
- Create: `apps/web/src/app/(dashboard)/documents/[id]/_components/edit-confidentiality-dialog.spec.tsx`
- Modify: `apps/web/src/app/(dashboard)/documents/[id]/_components/document-detail-page-client.tsx`
- Modify: `apps/web/src/components/documents/document-list.tsx`

**Interfaces:**
- Consumes: `ConfidentialitySection` (Task 10), `useUpdateDocument` (existing, currently unused anywhere in the UI), `usePermissions().hasPermission`, `DocumentDto.acessoDepartamentoIds`/`.acessoUsuarioIds` (Task 8).

- [ ] **Step 1: Build the edit dialog**

Create `apps/web/src/app/(dashboard)/documents/[id]/_components/edit-confidentiality-dialog.tsx`, modeled on the existing `DeleteConfirm` modal pattern already in this same file (`role="dialog" aria-modal="true"`, `fixed inset-0 z-50` backdrop) but larger (this holds a full form, not a confirm/cancel pair). Props: `{ document: DocumentDto; onClose: () => void }`. Internally: `useForm` seeded from `document.confidencialidade`/`document.acessoDepartamentoIds`/`document.acessoUsuarioIds`/`document.exigeCadastro`/`document.destaque`, renders `<ConfidentialitySection>` via `Controller`, submit calls `useUpdateDocument().mutate({ id: document.id, payload: { confidencialidade, accessDepartamentoIds, accessUserIds, exigeCadastro, destaque } })`, closes on success (`onSuccess: onClose`). Use the `ui-ux-pro-max` skill if the dialog's layout needs any visual decisions beyond directly reusing `ConfidentialitySection` (it likely doesn't — the section already carries the design).

- [ ] **Step 2: Write tests**

Create `edit-confidentiality-dialog.spec.tsx` covering:
- Renders pre-filled with the document's current confidentiality state.
- Submitting calls `useUpdateDocument`'s mutate with the edited payload (mock the hook, same mocking convention as this repo's other hook-consuming component specs — check `create-user-form.spec.tsx` for the exact mocking pattern of a React Query mutation hook before writing this).
- Cancel/close calls `onClose` without mutating.

- [ ] **Step 3: Run tests**

Run: `pnpm --filter=web test edit-confidentiality-dialog`
Expected: PASS.

- [ ] **Step 4: Wire into the detail page + update badges for 3 levels**

In `document-detail-page-client.tsx`:
- Remove the already-fixed-up (Task 1) `INTERNO`-free `CONFIDENCIALIDADE_BADGE`/`CONFIDENCIALIDADE_LABEL` — no further change needed to those maps themselves (Task 1 already trimmed them to 3 entries), just confirm they're still exactly `{ PUBLICO, RESTRITO, CONFIDENCIAL }`.
- Add `const canManageConfidentiality = usePermissions().hasPermission('DOCUMENTS_MANAGE_CONFIDENTIALITY')` and `const [showEditConfidentiality, setShowEditConfidentiality] = useState(false)`.
- Add an "Alterar confidencialidade" button next to the existing Baixar/Remover buttons, visible only when `canManageConfidentiality` is true, opening the dialog.
- When `document.confidencialidade === 'RESTRITO'` and `document.acessoDepartamentoIds.length > 0`, or `=== 'CONFIDENCIAL'`, render a small read-only summary line under the badges (e.g. "Também visível para: Financeiro, Jurídico" resolved via `useDepartments()`/`useUsers()` name lookups, following the same `.find(...)` pattern already used for `departamentoNome`/`serieLabel` in this file) — this is the "access policy panel" piece of the visualization requirement.
- Render `{showEditConfidentiality && <EditConfidentialityDialog document={document} onClose={() => setShowEditConfidentiality(false)} />}`.

- [ ] **Step 5: Confirm `document-list.tsx` needs no further change**

Task 1 already trimmed `CONFIDENCIALIDADE_BADGE`/`_LABEL`/`_OPTIONS` in this file to the 3 remaining levels — re-read the file to confirm nothing else there references a 4th level or the removed `allowedDepartamentoIds` filter naming (it doesn't; the list's query filters are unrelated to this plan's enforcement rewrite, which is server-side only). No code change expected in this file for this task; if you find something, note it and fix it, but don't invent unrelated changes.

- [ ] **Step 6: Full verification**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: PASS except the 2 known pre-existing failures.

- [ ] **Step 7: Manual smoke check**

Same as Task 10 Step 7 — load `/documents/[id]` for a real document, confirm the button appears/hides correctly by permission, dialog opens pre-filled, submit updates the badge on save. Note explicitly if this isn't feasible to verify in-session.

- [ ] **Step 8: Commit**

```bash
git add "apps/web/src/app/(dashboard)/documents/[id]/_components/edit-confidentiality-dialog.tsx" "apps/web/src/app/(dashboard)/documents/[id]/_components/edit-confidentiality-dialog.spec.tsx" "apps/web/src/app/(dashboard)/documents/[id]/_components/document-detail-page-client.tsx" apps/web/src/components/documents/document-list.tsx
git commit -m "feat(web): add confidentiality edit dialog and access-policy summary on the document detail page"
```

---

### Task 12: `use-documents.ts` update payload + final type sweep

**Files:**
- Modify: `apps/web/src/hooks/use-documents.ts` (`useUpdateDocument`'s payload type, via `UpdateDocumentInput` from `@ged/types` — already extended in Task 8 Step 4, confirm it flows through)
- Modify: `apps/web/src/hooks/use-documents.spec.tsx` (if it exists — check first)

**Interfaces:**
- Consumes: `UpdateDocumentInput.accessDepartamentoIds`/`.accessUserIds` (Task 8).

- [ ] **Step 1: Confirmed — no existing spec**

`apps/web/src/hooks/use-documents.spec.tsx` does not exist (confirmed) — Step 3 below is skipped; this task is Step 2 + Step 4 only.

- [ ] **Step 2: Confirm `useUpdateDocument` needs no code change**

`useUpdateDocument`'s `mutationFn` already does `apiClient.patch<DocumentDto>(..., payload, ...)` where `payload: UpdateDocumentInput` — since Task 8 Step 4 already added `accessDepartamentoIds`/`accessUserIds` to that shared type, this hook requires **no code change**, only a type-check confirmation that Task 11's dialog can pass those fields through without a TS error. Run `pnpm type-check` and confirm clean.

- [ ] **Step 3: If a spec file exists, add one test**

If Step 1 found a spec file, add a test asserting `useUpdateDocument`'s mutate call forwards `accessDepartamentoIds`/`accessUserIds` verbatim in the PATCH body (mock `apiClient.patch`, assert call args) — follow that file's existing structure. If no spec file exists, skip this step (this hook has no dedicated spec today and this task isn't the place to introduce a testing pattern for the whole file — Task 10/11's component tests already exercise the payload shape end-to-end via mocked hooks).

- [ ] **Step 4: Full verification**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: PASS except the 2 known pre-existing failures — and this should now be true with **zero** other exceptions anywhere in the diff, since this is the last task.

- [ ] **Step 5: Commit** (only if Step 3 produced a change)

```bash
git add apps/web/src/hooks/use-documents.spec.tsx
git commit -m "test(web): cover accessDepartamentoIds/accessUserIds in useUpdateDocument"
```

---

## Final Verification (after all 12 tasks)

1. **Full quality gate:** `pnpm lint && pnpm type-check && pnpm test` from repo root — clean except the 2 named pre-existing failures.
2. **Migration dry-run against an isolated Postgres** (not the shared `ged-db` dev container): start a throwaway container, e.g. `docker run --rm -d --name ged-db-verify -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ged -p 55432:5432 postgres:17-alpine`, point `DATABASE_URL` at it (`postgres://postgres:postgres@localhost:55432/ged`), run every existing migration plus this plan's 2 new ones (`pnpm --filter=@ged/database db:migrate`), confirm no errors, then `db:migrate:revert` twice to confirm both new `down()`s are correct, then `docker rm -f ged-db-verify`.
3. **End-to-end access scenarios** (manual, via a running API against the throwaway DB, or `/verify` if that skill's project script covers this flow):
   - Upload by a user *without* `DOCUMENTS_MANAGE_CONFIDENTIALITY` and not ADMIN/SUPER_ADMIN → document is created `RESTRITO`, no grants, even if the request body asked for `CONFIDENCIAL`.
   - A manager-permission user sets an existing document to `CONFIDENCIAL` with a specific user list → a user *not* on that list gets 404 on both list and detail; a user *on* the list gets the document; ADMIN/SUPER_ADMIN always get it.
   - A `RESTRITO` document gets an extra department grant → a user in that department (but not the owning department) now sees it; a user in neither does not.
   - Switching a document to `PUBLICO` (both `exigeCadastro` true/false) → it appears on `/portal`; identified access still requires the lead-capture flow (unchanged, this plan doesn't touch the public module).
4. **Regression check:** confirm the public portal (`apps/api/src/modules/public/*`) is untouched and its own tests (if any) still pass — this plan never modifies `packages/@ged/database`'s `document_leads` or the `public` module, only `documents`/`document.entity.ts`/shared types.
