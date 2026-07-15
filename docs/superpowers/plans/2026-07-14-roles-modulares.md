# Roles → Permissões Modulares (Fase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the role model to `SUPER_ADMIN` / `ADMIN` / common user (reusing the `VIEWER` enum value), collapsing today's `MANAGER` into the common role, and move write authorization on `documents`/`dossies`/`document-series` from role gates (`@Roles(ADMIN, MANAGER)`) to the already-existing granular permission system (`@Permissions(...)`), so an admin can grant write capability to any individual common user without promoting them to a role.

**Architecture:** Fix `PermissionsGuard` to bypass `ADMIN` (matching its own documented contract and `RolesGuard`'s existing pattern), seed five new write permissions under the existing `documentos` permission module, recreate the Postgres `users_role_enum` without `MANAGER` (existing `MANAGER` rows migrate to `VIEWER`, mirroring the exact enum-recreation technique already used and reviewed in Phase 1's `RemoveInternoConfidencialidade` migration), then swap the three modules' write-route decorators and their `PRIVILEGED_ROLES` bypass arrays. Frontend role pickers/labels/specs follow the same collapse.

**Tech Stack:** NestJS + TypeORM (Postgres) backend; Next.js 15 + React Query + react-hook-form + Zod frontend. Same pnpm/turbo monorepo as Phase 1.

## Global Constraints

- Target roles after this plan: `SUPER_ADMIN`, `ADMIN`, `VIEWER` (the common/non-privileged role — the enum value is reused as-is; `MANAGER` is removed). No new enum value is introduced. `VIEWER`'s user-facing PT-BR label changes from "Visualizador" to **"Usuário"** (it is no longer read-only-only — see Task 8).
- Existing users with `role = 'MANAGER'` are migrated to `role = 'VIEWER'` by the migration's data step, **before** the enum type is recreated. They receive **no** automatic permission grants (deliberate — an ADMIN must grant capabilities manually afterward via the existing "Permissões" tab / user-permissions endpoints, which are untouched by this plan).
- `PermissionsGuard` (`apps/api/src/common/guards/permissions.guard.ts`) currently bypasses only `SUPER_ADMIN`, contradicting `apps/api/CLAUDE.md`'s documented contract ("Permission-based: `@Permissions('nome')` + `PermissionsGuard` (**ADMIN faz bypass**)") and diverging from `RolesGuard`'s existing `SUPER_ADMIN`-bypass-then-role-check shape. Task 1 fixes the guard to also bypass `ADMIN`, matching `RolesGuard`'s pattern exactly. This is a deliberate, reviewed architectural correction — not scope creep — because every later task in this plan depends on `ADMIN` continuing to have unconditional write access once `@Roles(ADMIN, MANAGER)` is replaced by `@Permissions(...)`.
- New permissions are added under the **existing** `documentos` permission module (`apps/api/src/database/seeds/permissions.seed.ts`, slug `documentos`, currently holding only `DOCUMENTS_MANAGE_CONFIDENTIALITY`) — no new module is created. Exact names: `DOCUMENTS_CREATE`, `DOCUMENTS_EDIT`, `DOCUMENTS_DELETE`, `DOSSIES_MANAGE`, `DOCUMENT_SERIES_MANAGE`.
- Permission-to-route mapping (all three modules keep their existing class-level `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)` — `PermissionsGuard` is additive, not a replacement, since `RolesGuard` still guards nothing once no route carries `@Roles` in these three controllers, but stays harmless/no-op per route with no `@Roles` decorator):
  - `documents`: `POST /documents` → `DOCUMENTS_CREATE`; `PATCH /documents/:id` and `PATCH /documents/:id/transferir` → `DOCUMENTS_EDIT`; `DELETE /documents/:id` → `DOCUMENTS_DELETE`.
  - `dossies`: `POST /dossies`, `PATCH /dossies/:id`, `DELETE /dossies/:id` → `DOSSIES_MANAGE` (one permission, no finer split — matches the module's existing three-endpoint-one-concern shape).
  - `document-series`: `POST /document-series`, `PATCH /document-series/:id`, `DELETE /document-series/:id` → `DOCUMENT_SERIES_MANAGE`.
- `PRIVILEGED_ROLES`-style arrays (read-side department-scope bypass, unrelated to the write-gate change above) in `documents.service.ts:59`, `dossies.service.ts:17`, `document-series.service.ts:24` all currently read `[ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.MANAGER]` — drop `ROLE.MANAGER`, leaving `[ROLE.SUPER_ADMIN, ROLE.ADMIN]`. This is a distinct, simpler change from the write-gate conversion: it only affects who bypasses department-scoping on **reads**, not who can write.
- No native TypeScript `enum` — `const object + as const + type`, per `packages/@ged/database/CLAUDE.md` (unchanged rule, just re-stated since this plan edits `ROLE`/entity enum arrays directly).
- No native `<select>` on the frontend — `Combobox` only, per `apps/web/CLAUDE.md`.
- Migration numbering continues from the last existing migration `1782950400010-CreateDocumentAccessGrantsTable` → this plan adds `1782950400011`.
- Do **not** run the new migration against the shared dev Postgres container (`ged-db`) — verify by diff review during implementation; a live isolated-Postgres dry-run (up + down) happens once at the end of the whole plan, by the human/controller, exactly as Phase 1's final verification did.
- Quality gate per task: `pnpm lint && pnpm type-check` clean. Run `pnpm --filter=api test` and `pnpm --filter=web test` **separately** (root `pnpm test` silently skips `apps/api` once `apps/web` fails on unrelated pre-existing issues — this bit Phase 1 too). Pre-existing, out-of-scope failures (confirmed pre-existing on this branch's base, unrelated to this plan — do not try to fix): `apps/web/src/lib/api-client.spec.ts` (4 tests), `apps/web/src/components/admin/create-user-form.spec.tsx` (8 tests), `apps/api/src/modules/subscription/subscription.service.spec.ts` (whole suite, DI setup bug), `apps/api/test/integration/system.integration.spec.ts` (whole suite, missing `JWT_SECRET` — no `.env` in this worktree), `apps/api/test/integration/auth.integration.spec.ts` (occasionally flaky under parallel load). Any OTHER failure is this plan's responsibility to fix.
- Cache warning: `apps/api`'s `tsc --incremental` build-info cache (`apps/api/dist/.tsbuildinfo`) can silently hide real type errors if stale — this specifically bit Phase 1's Task 1. If type-check passes suspiciously easily after a change that should affect `apps/api`, rerun with `turbo run type-check --force` before trusting a green result.
- Out of scope for this plan (deliberately cut, not forgotten): adding `permissaoIds` to the general `PATCH /users/:id` update path. The existing "Permissões" tab / `user-permissions` endpoints (`assign`/`revoke`, already live) already give an ADMIN a working way to grant/revoke permissions for any user, including freshly-migrated ex-`MANAGER`s — bundling permission editing into the generic user-update PATCH as well would be redundant UI/API surface for no new capability, so it's cut per YAGNI.

---

### Task 1: Fix `PermissionsGuard` to bypass `ADMIN`

**Files:**
- Modify: `apps/api/src/common/guards/permissions.guard.ts`
- Modify: `apps/api/src/common/guards/permissions.guard.spec.ts`

**Interfaces:**
- Produces: `PermissionsGuard.canActivate` now returns `true` immediately for `user.role === ROLE.ADMIN`, in addition to the existing `SUPER_ADMIN` bypass — no interface/signature change, purely behavioral. Every later task in this plan that gates a write route with `@Permissions(...)` depends on this.

- [ ] **Step 1: Update the guard**

In `apps/api/src/common/guards/permissions.guard.ts`, change:

```ts
    // SUPER_ADMIN tem bypass total
    if (user.role === ROLE.SUPER_ADMIN) {
      return true;
    }
```

to:

```ts
    // SUPER_ADMIN e ADMIN têm bypass total — mesma regra do RolesGuard.
    if (user.role === ROLE.SUPER_ADMIN || user.role === ROLE.ADMIN) {
      return true;
    }
```

- [ ] **Step 2: Update the existing test that asserts the OLD (buggy) behavior**

In `apps/api/src/common/guards/permissions.guard.spec.ts`, the test currently named `'should NOT bypass for ADMIN and should go through hasPermission check'` (asserting `hasPermission` IS called for ADMIN) is now asserting the wrong contract. Replace it with:

```ts
  it('should return true for ADMIN regardless of permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(['documents:delete']);
    const ctx = makeContext({ sub: 'admin-1', role: ROLE.ADMIN, email: 'a@b.com' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockChecker.hasPermission).not.toHaveBeenCalled();
  });
```

(mirrors the existing `'should return true for SUPER_ADMIN regardless of permissions'` test immediately above it — same shape, different role, and the assertion flips from "was called" to "was NOT called".)

Leave every other existing test in this file unchanged (the `VIEWER`-role tests already correctly exercise the `hasPermission` path and are unaffected by this fix).

- [ ] **Step 3: Run the test and full quality gate**

Run: `pnpm --filter=api test permissions.guard`
Expected: PASS, all cases including the new ADMIN-bypass test.

Run: `pnpm lint && pnpm type-check` (forced: `pnpm exec turbo run type-check --force`), then `pnpm --filter=api test` and `pnpm --filter=web test` separately.
Expected: PASS except the named pre-existing failures. Note: `system-settings` (the only current `@Permissions`-gated module, `SETTINGS_VIEW`/`SETTINGS_EDIT`) is now also implicitly bypassed for `ADMIN` — this is an intended, in-scope side effect of the fix (matches `apps/api/CLAUDE.md`'s documented contract), not a regression; if `system-settings.controller.spec.ts` or `.service.spec.ts` has a test asserting an ADMIN is denied a settings action without the permission, that test's expectation was itself encoding the pre-existing bug and should be updated to expect success — check for this specifically and report it if found, since it wasn't part of the file inventory this task started with.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/common/guards/permissions.guard.ts apps/api/src/common/guards/permissions.guard.spec.ts
git commit -m "fix(permissions): PermissionsGuard now bypasses ADMIN, matching its documented contract"
```

---

### Task 2: Seed the five new write permissions

**Files:**
- Modify: `apps/api/src/database/seeds/permissions.seed.ts`

**Interfaces:**
- Produces: five new rows seeded idempotently (checked by `nome`, same as every existing entry) under the existing `documentos` module: `DOCUMENTS_CREATE`, `DOCUMENTS_EDIT`, `DOCUMENTS_DELETE`, `DOSSIES_MANAGE`, `DOCUMENT_SERIES_MANAGE`. Tasks 5-7 depend on these exact string names existing once the seed runs.

- [ ] **Step 1: Extend the `documentos` module's permissions array**

In `apps/api/src/database/seeds/permissions.seed.ts`, the `documentos` module entry currently reads (verify against the live file first — it should match exactly, since Phase 1 was the only prior editor):

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

Change its `permissions` array to:

```ts
    permissions: [
      {
        nome: 'DOCUMENTS_MANAGE_CONFIDENTIALITY',
        descricao: 'Gerenciar confidencialidade e acesso de documentos',
      },
      {
        nome: 'DOCUMENTS_CREATE',
        descricao: 'Criar documentos',
      },
      {
        nome: 'DOCUMENTS_EDIT',
        descricao: 'Editar e transferir documentos',
      },
      {
        nome: 'DOCUMENTS_DELETE',
        descricao: 'Remover documentos',
      },
      {
        nome: 'DOSSIES_MANAGE',
        descricao: 'Criar, editar e remover dossiês',
      },
      {
        nome: 'DOCUMENT_SERIES_MANAGE',
        descricao: 'Criar, editar e remover séries documentais',
      },
    ],
```

- [ ] **Step 2: Verify**

Run: `pnpm type-check`
Expected: PASS. No dedicated spec exists for this file (none of its sibling entries have one either — verified true as of Phase 1); correctness is a data-literal addition matching the existing `ModuleSeed`/`PermissionSeed` shape exactly, picked up the next time the API boots against a real database (exercised in this plan's final live-migration verification).

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/database/seeds/permissions.seed.ts
git commit -m "feat(permissions): seed DOCUMENTS_CREATE/EDIT/DELETE, DOSSIES_MANAGE, DOCUMENT_SERIES_MANAGE"
```

---

### Task 3: `users_role_enum` migration — remove `MANAGER`, keep `VIEWER` as the common role

**Files:**
- Modify: `packages/@ged/types/src/index.ts`
- Modify: `packages/@ged/database/src/entities/user.entity.ts`
- Create: `packages/@ged/database/src/migrations/1782950400011-RemoveManagerFromUsersRoleEnum.ts`
- Modify: `packages/@ged/database/src/migrations/run.ts`

**Interfaces:**
- Produces: `ROLE = { ADMIN, SUPER_ADMIN, VIEWER }` (no `MANAGER`), `Role = 'ADMIN' | 'SUPER_ADMIN' | 'VIEWER'`. Every later task in this plan (backend DTOs, frontend role pickers, all specs) depends on `MANAGER` no longer being a member of this type — removing it here is what makes `tsc` surface every remaining reference for Tasks 4/8 to fix.

- [ ] **Step 1: Update `packages/@ged/types/src/index.ts`**

Change:

```ts
export const ROLE = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SUPER_ADMIN: 'SUPER_ADMIN',
  VIEWER: 'VIEWER',
} as const;
```

to:

```ts
export const ROLE = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  VIEWER: 'VIEWER',
} as const;
```

`export type Role = (typeof ROLE)[keyof typeof ROLE];` (unchanged, derives correctly from the smaller const).

Also in the same file, `UpdateUserPayload`'s `readonly role?: Extract<Role, 'ADMIN' | 'MANAGER' | 'VIEWER'>;` (line 40) becomes:

```ts
  readonly role?: Extract<Role, 'ADMIN' | 'VIEWER'>;
```

- [ ] **Step 2: Update the entity column**

In `packages/@ged/database/src/entities/user.entity.ts`, the `role` column's `enum: [...]` array currently reads `['ADMIN', 'MANAGER', 'VIEWER', 'SUPER_ADMIN']` — remove `'MANAGER'`:

```ts
  @Column({
    name: 'role',
    type: 'enum',
    enum: ['ADMIN', 'VIEWER', 'SUPER_ADMIN'],
    default: ROLE.VIEWER,
  })
  role!: Role;
```

(read the file first to confirm the exact current formatting/decorator shape before editing — this plan describes the field's current values, not necessarily its exact whitespace.)

- [ ] **Step 3: Run type-check to find every now-broken reference**

Run: `pnpm exec turbo run type-check --force`
Expected: FAIL. This surfaces every file that still references `ROLE.MANAGER`/`'MANAGER'` as a `Role`-typed value across the whole monorepo. **Do not fix any of them in this task** — Tasks 4-8 own those files. Just confirm the failing-file list roughly matches this plan's later tasks' file lists (backend: `assignable-roles.ts`, `create-user.dto.ts`, `update-user.dto.ts`, `documents.service.ts`, `dossies.service.ts`, `document-series.service.ts`, and their specs; frontend: `role-labels.ts`, `create-user-form.tsx`, `edit-user-dialog.tsx`, `user-list.tsx`, `user-detail-client.tsx`, and their specs). If you see a genuinely unexpected file break that isn't accounted for anywhere in this plan, report it — don't silently fix it and don't silently ignore it.

- [ ] **Step 4: Write the migration**

Create `packages/@ged/database/src/migrations/1782950400011-RemoveManagerFromUsersRoleEnum.ts`, following the exact enum-recreation technique of `1782950400009-RemoveInternoConfidencialidade.ts` (Phase 1, already reviewed and live-verified):

```ts
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveManagerFromUsersRoleEnum1782950400011 implements MigrationInterface {
  name = 'RemoveManagerFromUsersRoleEnum1782950400011';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Postgres não permite remover um valor de um tipo ENUM diretamente — é preciso
    // migrar os dados, recriar o tipo sem o valor e trocar a coluna para o novo tipo.
    // Usuários MANAGER passam a ser VIEWER (papel comum) — sem concessão automática
    // de permissões; um ADMIN concede manualmente depois, se necessário.
    await queryRunner.query(`
      UPDATE "users" SET "role" = 'VIEWER' WHERE "role" = 'MANAGER'
    `);

    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "users_role_enum" RENAME TO "users_role_enum_old"`);
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'VIEWER', 'SUPER_ADMIN')`);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "users_role_enum"
      USING "role"::text::"users_role_enum"
    `);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'VIEWER'`);
    await queryRunner.query(`DROP TYPE "users_role_enum_old"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Restaura o tipo com os 4 valores originais. NÃO restaura quais linhas VIEWER
    // eram originalmente MANAGER — essa informação foi perdida no up() (mesma
    // limitação, aceita e documentada, da migration 1782950400009 para INTERNO).
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "users_role_enum" RENAME TO "users_role_enum_new"`);
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER', 'SUPER_ADMIN')`);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "users_role_enum"
      USING "role"::text::"users_role_enum"
    `);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'VIEWER'`);
    await queryRunner.query(`DROP TYPE "users_role_enum_new"`);
  }
}
```

- [ ] **Step 5: Register the migration**

In `packages/@ged/database/src/migrations/run.ts`, add the import after the last-registered migration (`CreateDocumentAccessGrantsTable1782950400010`) and append `RemoveManagerFromUsersRoleEnum1782950400011,` to the `migrations: [...]` array.

- [ ] **Step 6: Do NOT proceed to fix other files in this task**

This task's quality-gate check is intentionally scoped to "the two edited files plus the new migration compile and are internally consistent" — the monorepo-wide `type-check` will still fail (expected, per Step 3) until Tasks 4-8 land. Confirm `pnpm --filter=@ged/types type-check` and `pnpm --filter=@ged/database type-check` both individually pass (these two packages alone do not reference `MANAGER` anywhere else), then stop.

- [ ] **Step 7: Commit**

```bash
git add packages/@ged/types/src/index.ts packages/@ged/database/src/entities/user.entity.ts packages/@ged/database/src/migrations/1782950400011-RemoveManagerFromUsersRoleEnum.ts packages/@ged/database/src/migrations/run.ts
git commit -m "feat(users): remove MANAGER from users_role_enum, collapse into VIEWER"
```

---

### Task 4: Backend user role-assignment updates (`assignable-roles`, user DTOs)

**Files:**
- Modify: `apps/api/src/modules/users/constants/assignable-roles.ts`
- Modify: `apps/api/src/modules/users/constants/assignable-roles.spec.ts`
- Modify: `apps/api/src/modules/users/dto/create-user.dto.ts`
- Modify: `apps/api/src/modules/users/dto/update-user.dto.ts`
- Modify: `apps/api/src/modules/users/use-cases/create-user-with-profile.use-case.spec.ts` (if it references `ROLE.MANAGER` — read fresh and confirm)
- Modify: `apps/api/src/modules/users/users.service.spec.ts`, `apps/api/src/modules/users/users.controller.spec.ts`, `apps/api/src/modules/users/use-cases/update-user-with-departments.use-case.spec.ts` (if any reference `ROLE.MANAGER` — read fresh)
- Modify: `apps/api/src/common/guards/roles.guard.spec.ts` (gap in this plan's original file inventory, found and fixed during Task 4's execution — `ROLE.MANAGER` was used there purely as a generic non-privileged-role fixture in two tests, no behavioral coupling to the specific value; mechanically substituted with `ROLE.VIEWER`, test titles updated to match. Not module-specific, so it didn't fit naturally under Task 5/6/7 either — recorded here for the historical record since Task 4 is where the gap surfaced.)

**Interfaces:**
- Consumes: `ROLE`/`Role` from `@ged/types` (Task 3, now without `MANAGER`).
- Produces: `getAssignableRoles(actingRole)` returns `[ADMIN, VIEWER]` for a `SUPER_ADMIN` actor, `[VIEWER]` for any other actor — `ADMIN` remains non-self-assignable by a non-`SUPER_ADMIN` actor (unchanged existing rule, just fewer options in the non-`SUPER_ADMIN` branch since `MANAGER` no longer exists to offer).

- [ ] **Step 1: Update `getAssignableRoles`**

In `apps/api/src/modules/users/constants/assignable-roles.ts`, change:

```ts
export function getAssignableRoles(actingRole: Role): readonly Role[] {
  if (actingRole === ROLE.SUPER_ADMIN) {
    return [ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER];
  }
  return [ROLE.MANAGER, ROLE.VIEWER];
}
```

to:

```ts
export function getAssignableRoles(actingRole: Role): readonly Role[] {
  if (actingRole === ROLE.SUPER_ADMIN) {
    return [ROLE.ADMIN, ROLE.VIEWER];
  }
  return [ROLE.VIEWER];
}
```

- [ ] **Step 2: Update its spec**

In `apps/api/src/modules/users/constants/assignable-roles.spec.ts`, update the two assertions (read the file first — it currently expects `getAssignableRoles(ROLE.ADMIN)` → `[ROLE.MANAGER, ROLE.VIEWER]` and `getAssignableRoles(ROLE.SUPER_ADMIN)` → `[ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER]`) to expect `[ROLE.VIEWER]` and `[ROLE.ADMIN, ROLE.VIEWER]` respectively.

- [ ] **Step 3: Update the two DTOs' `ALLOWED_ROLES`**

In both `apps/api/src/modules/users/dto/create-user.dto.ts` and `apps/api/src/modules/users/dto/update-user.dto.ts`, change:

```ts
const ALLOWED_ROLES = [ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER] as const;
```

to:

```ts
const ALLOWED_ROLES = [ROLE.ADMIN, ROLE.VIEWER] as const;
```

(no other change needed in either file — `@IsIn(ALLOWED_ROLES)` picks up the smaller list automatically.)

- [ ] **Step 4: Sweep the remaining spec files for `ROLE.MANAGER`/`'MANAGER'`**

Read each of `create-user-with-profile.use-case.spec.ts`, `users.service.spec.ts`, `users.controller.spec.ts`, `update-user-with-departments.use-case.spec.ts` and grep for `MANAGER`. For any hit that's a fixture default (e.g. `role: ROLE.MANAGER` in a mock user object with no assertion depending on `MANAGER` specifically as a distinct value), change it to `ROLE.VIEWER`. For any hit that's an actual assertion about `MANAGER`-specific behavior (e.g. asserting a `MANAGER` actor is denied something an `ADMIN` can do), read the surrounding test carefully — if the distinction it was testing no longer exists (because `MANAGER` is gone), the test itself may need to be removed or rewritten to test the analogous `VIEWER`-vs-`ADMIN` distinction instead. Use the same judgment Phase 1's Task 1 implementer used for the analogous `INTERNO`→`RESTRITO` fixture sweep — mechanical substitution is safe when the test has no logic depending on the specific value; anything with real behavioral coupling to `MANAGER` needs a judgment call, and should be reported if genuinely ambiguous rather than guessed.

- [ ] **Step 5: Full verification**

Run: `pnpm lint && pnpm type-check` (forced), then `pnpm --filter=api test` and `pnpm --filter=web test` separately.
Expected: `apps/api` should now be fully clean except the two named pre-existing failures (`subscription.service.spec.ts`, `system.integration.spec.ts`) — `apps/web` will still show `MANAGER`/`VIEWER`-related type errors until Task 8 lands; that's expected and not this task's job to fix. Confirm specifically that `apps/api`'s type-check and test suite are clean at the end of this task — that's this task's real completion bar, since it's the last backend-role-assignment task before the write-gate conversion tasks (5-7) run.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/users/constants/assignable-roles.ts apps/api/src/modules/users/constants/assignable-roles.spec.ts apps/api/src/modules/users/dto/create-user.dto.ts apps/api/src/modules/users/dto/update-user.dto.ts apps/api/src/modules/users/use-cases/create-user-with-profile.use-case.spec.ts apps/api/src/modules/users/users.service.spec.ts apps/api/src/modules/users/users.controller.spec.ts apps/api/src/modules/users/use-cases/update-user-with-departments.use-case.spec.ts
git commit -m "feat(users): drop MANAGER from assignable roles and user DTOs"
```

(adjust the file list to whatever you actually touched in Step 4 — some of the listed spec files may have needed zero changes; don't `git add` files you didn't modify.)

---

### Task 5: Convert `documents` write-gates to permissions

**Files:**
- Modify: `apps/api/src/modules/documents/documents.controller.ts`
- Modify: `apps/api/src/modules/documents/documents.service.ts`
- Modify: `apps/api/src/modules/documents/documents.module.ts`
- Modify: `apps/api/src/modules/documents/documents.service.spec.ts` (only if it references `ROLE.MANAGER` — read fresh)
- Modify: `apps/api/src/modules/documents/documents.controller.spec.ts` (only if guard behavior is asserted there — read fresh; earlier research found no `MANAGER`/`Roles` reference in this file, so likely no change needed, but confirm)

**Interfaces:**
- Consumes: `PermissionsGuard` (Task 1, now `ADMIN`-bypassing), `@Permissions(...)` decorator (existing, `apps/api/src/common/decorators/permissions.decorator.ts`), the five permission strings seeded in Task 2.
- Produces: `documents.controller.ts`'s write routes are now permission-gated instead of role-gated; `PRIVILEGED_ROLES` in `documents.service.ts` no longer includes `MANAGER`.

- [ ] **Step 1: Add `PermissionsGuard` to the controller's class-level guards and import `Permissions`**

In `apps/api/src/modules/documents/documents.controller.ts`, add to imports:

```ts
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
```

Change the class decorator from:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
```

to:

```ts
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
```

(`RolesGuard` stays — it's now a no-op on every route in this controller since none of them carry `@Roles` anymore after this task, but removing it isn't necessary and keeping it costs nothing; leaving it also matches the pattern every other role-or-permission-gated controller in this codebase already follows of listing both guards even when only one decorator type is actually used on a given route.)

- [ ] **Step 2: Swap the four write-route decorators**

Replace each `@Roles(ROLE.ADMIN, ROLE.MANAGER)` with the mapping from this plan's Global Constraints:
- `create()` (`POST /documents`): `@Permissions('DOCUMENTS_CREATE')`
- `update()` (`PATCH /documents/:id`): `@Permissions('DOCUMENTS_EDIT')`
- `transferir()` (`PATCH /documents/:id/transferir`): `@Permissions('DOCUMENTS_EDIT')`
- `remove()` (`DELETE /documents/:id`): `@Permissions('DOCUMENTS_DELETE')`

The `ROLE` import from `@ged/database` may become unused in this file after this change — check with a grep for `ROLE\.` across the rest of the file before removing the import; if nothing else in the file uses `ROLE`, remove the now-dead import (lint's `no-unused-vars` will also catch this).

- [ ] **Step 3: Update `PRIVILEGED_ROLES`**

In `apps/api/src/modules/documents/documents.service.ts:59`, change:

```ts
const PRIVILEGED_ROLES: readonly Role[] = [ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.MANAGER];
```

to:

```ts
const PRIVILEGED_ROLES: readonly Role[] = [ROLE.SUPER_ADMIN, ROLE.ADMIN];
```

- [ ] **Step 4: Add `PermissionsGuard` to `documents.module.ts`'s providers**

Correction to this plan's original research: `UserPermissionsModule` is already imported in `apps/api/src/modules/documents/documents.module.ts` (Phase 1, Task 6) and already exports `USER_PERMISSIONS_SERVICE`/`UserPermissionsService`, which is what `PermissionsGuard`'s own constructor needs injected — **but `PermissionsGuard` itself is NOT currently listed in this module's `providers: [...]` array** (only `RolesGuard` is, confirmed by direct read: `grep -n "PermissionsGuard" apps/api/src/modules/documents/documents.module.ts` returns nothing before this task). Without registering it, NestJS cannot instantiate the class reference used in Step 1's `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)` and DI resolution will fail. Add the import and provider entry:

```ts
import { PermissionsGuard } from '../../common/guards/permissions.guard';
```

and add `PermissionsGuard` to the `providers: [...]` array, alongside the existing `RolesGuard`.

- [ ] **Step 5: Sweep `documents.service.spec.ts` for `ROLE.MANAGER`**

Grep the spec file for `MANAGER`. Any fixture-default usage (a mock `JwtPayload` with `role: ROLE.MANAGER` used only as "some privileged role" in a test unrelated to the specific role value) → change to `ROLE.ADMIN` (since `PRIVILEGED_ROLES` no longer includes `MANAGER`, a test that was using `MANAGER` to represent "a privileged bypass role" must now use `ADMIN` or `SUPER_ADMIN` to keep testing the same bypass behavior — using the removed `ROLE.MANAGER` value would be a compile error after Task 3, so this is a forced, not optional, edit if any such reference exists).

- [ ] **Step 6: Full verification**

Run: `pnpm --filter=api test documents` (focused), then `pnpm lint && pnpm type-check` (forced), then `pnpm --filter=api test` and `pnpm --filter=web test` separately.
Expected: PASS except the named pre-existing failures.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/documents/documents.controller.ts apps/api/src/modules/documents/documents.service.ts apps/api/src/modules/documents/documents.service.spec.ts
git commit -m "feat(documents): convert write routes from @Roles(ADMIN,MANAGER) to @Permissions"
```

(add `documents.module.ts`/`documents.controller.spec.ts` too only if you actually changed them.)

---

### Task 6: Convert `dossies` write-gates to permissions

**Files:**
- Modify: `apps/api/src/modules/dossies/dossies.controller.ts`
- Modify: `apps/api/src/modules/dossies/dossies.service.ts`
- Modify: `apps/api/src/modules/dossies/dossies.module.ts`
- Modify: `apps/api/src/modules/dossies/dossies.service.spec.ts` (only if it references `ROLE.MANAGER` — read fresh)

**Interfaces:**
- Same shape as Task 5, applied to the `dossies` module. This task is independent of Task 5/7 (different module, no shared file) and can be done in either order relative to them, but depends on Tasks 1-3 (guard fix, permission seed, `MANAGER` removed from the type) landing first.

- [ ] **Step 1: Add `PermissionsGuard` + import `Permissions`, swap decorators**

In `apps/api/src/modules/dossies/dossies.controller.ts`:
- Add imports `PermissionsGuard` (`../../common/guards/permissions.guard`) and `Permissions` (`../../common/decorators/permissions.decorator`).
- Class decorator: `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)`.
- Replace `@Roles(ROLE.ADMIN, ROLE.MANAGER)` on `create()`, `update()`, `remove()` (all three, per this module's endpoints) with `@Permissions('DOSSIES_MANAGE')`.
- Remove the `ROLE` import if it becomes unused (check first).

- [ ] **Step 2: Register `PermissionsGuard` in the module and import `UserPermissionsModule`**

Unlike `documents.module.ts`, `dossies.module.ts` does **not** currently import `UserPermissionsModule` or provide `PermissionsGuard`. In `apps/api/src/modules/dossies/dossies.module.ts`, add:

```ts
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';
```

Add `UserPermissionsModule` to the `imports: [...]` array (alongside the existing `AuditLogsModule`, `UserDepartmentsModule`), and add `PermissionsGuard` to the `providers: [...]` array (alongside the existing `RolesGuard`).

- [ ] **Step 3: Update `PRIVILEGED_ROLES`**

In `apps/api/src/modules/dossies/dossies.service.ts:17`, drop `ROLE.MANAGER` from the array, same as Task 5 Step 3.

- [ ] **Step 4: Sweep `dossies.service.spec.ts` for `ROLE.MANAGER`**

Same instruction as Task 5 Step 5, scoped to this file.

- [ ] **Step 5: Full verification**

Run: `pnpm --filter=api test dossies` (focused), then `pnpm lint && pnpm type-check` (forced), then `pnpm --filter=api test` and `pnpm --filter=web test` separately.
Expected: PASS except the named pre-existing failures.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/dossies/dossies.controller.ts apps/api/src/modules/dossies/dossies.service.ts apps/api/src/modules/dossies/dossies.module.ts apps/api/src/modules/dossies/dossies.service.spec.ts
git commit -m "feat(dossies): convert write routes from @Roles(ADMIN,MANAGER) to @Permissions(DOSSIES_MANAGE)"
```

(only include `dossies.service.spec.ts` if you actually changed it.)

---

### Task 7: Convert `document-series` write-gates to permissions

**Files:**
- Modify: `apps/api/src/modules/document-series/document-series.controller.ts`
- Modify: `apps/api/src/modules/document-series/document-series.service.ts`
- Modify: `apps/api/src/modules/document-series/document-series.module.ts`
- Modify: `apps/api/src/modules/document-series/document-series.service.spec.ts` (only if it references `ROLE.MANAGER` — read fresh)

**Interfaces:**
- Identical shape to Task 6, applied to `document-series`. Independent of Tasks 5/6.

- [ ] **Step 1: Add `PermissionsGuard` + import `Permissions`, swap decorators**

In `apps/api/src/modules/document-series/document-series.controller.ts`: same pattern as Task 6 Step 1 — add the two imports, add `PermissionsGuard` to the class `@UseGuards`, replace all three `@Roles(ROLE.ADMIN, ROLE.MANAGER)` occurrences (`create`, `update`, `remove`) with `@Permissions('DOCUMENT_SERIES_MANAGE')`, remove the `ROLE` import if unused.

- [ ] **Step 2: Register `PermissionsGuard` in the module and import `UserPermissionsModule`**

Same pattern as Task 6 Step 2, applied to `apps/api/src/modules/document-series/document-series.module.ts` (also currently missing both).

- [ ] **Step 3: Update `PRIVILEGED_ROLES`**

In `apps/api/src/modules/document-series/document-series.service.ts:24`, drop `ROLE.MANAGER` from the array.

- [ ] **Step 4: Sweep `document-series.service.spec.ts` for `ROLE.MANAGER`**

Same instruction as Task 5 Step 5, scoped to this file.

- [ ] **Step 5: Full verification**

Run: `pnpm --filter=api test document-series` (focused), then `pnpm lint && pnpm type-check` (forced), then `pnpm --filter=api test` and `pnpm --filter=web test` separately.
Expected: PASS except the named pre-existing failures. **This should be the point where `apps/api` is fully clean with zero exceptions beyond the two named pre-existing failures** — Tasks 1-7 together are the entire backend scope of this plan.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/document-series/document-series.controller.ts apps/api/src/modules/document-series/document-series.service.ts apps/api/src/modules/document-series/document-series.module.ts apps/api/src/modules/document-series/document-series.service.spec.ts
git commit -m "feat(document-series): convert write routes from @Roles(ADMIN,MANAGER) to @Permissions(DOCUMENT_SERIES_MANAGE)"
```

(only include `document-series.service.spec.ts` if you actually changed it.)

---

### Task 8: Frontend role collapse (labels, forms, user list/detail) + specs

**Files:**
- Modify: `apps/web/src/lib/role-labels.ts`
- Modify: `apps/web/src/components/admin/create-user-form.tsx`
- Modify: `apps/web/src/components/admin/edit-user-dialog.tsx`
- Modify: `apps/web/src/components/admin/user-list.tsx`
- Modify: `apps/web/src/app/(dashboard)/admin/users/[id]/_components/user-detail-client.tsx`
- Modify: `apps/web/src/components/admin/create-user-form.spec.tsx`, `apps/web/src/hooks/use-users.spec.tsx`, `apps/web/src/hooks/use-permissions.spec.ts`, `apps/web/src/hooks/use-create-user.spec.tsx`, `apps/web/src/hooks/use-auth.spec.ts` (only the ones that actually reference `MANAGER`/`VIEWER` in a way `tsc`/the test run flags — read each fresh)

**Interfaces:**
- Consumes: `ROLE`/`Role` from `@ged/types` (Task 3, no `MANAGER`).
- No new exported interfaces — this task is a value-level sweep of every remaining frontend `MANAGER`/`VIEWER` reference the earlier research identified, following the same collapse already applied backend-side in Tasks 3-4.

- [ ] **Step 1: `role-labels.ts`**

Remove the `MANAGER: 'Gerente'` entry. Change `VIEWER: 'Visualizador'` to `VIEWER: 'Usuário'` (per this plan's Global Constraints — the role is no longer read-only-only, so its label should read as the generic common-user role).

- [ ] **Step 2: `create-user-form.tsx`**

- `role: z.enum([ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER])` → `role: z.enum([ROLE.ADMIN, ROLE.VIEWER])`.
- `assignableRoles = actingRole === ROLE.SUPER_ADMIN ? [ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER] : [ROLE.MANAGER, ROLE.VIEWER]` → `assignableRoles = actingRole === ROLE.SUPER_ADMIN ? [ROLE.ADMIN, ROLE.VIEWER] : [ROLE.VIEWER]` (mirrors the backend `getAssignableRoles` from Task 4 exactly — same logic, kept independently on the frontend since that's the existing pattern, not shared code).
- `defaultValues: { role: ROLE.VIEWER, ... }` — unchanged, already correct.

- [ ] **Step 3: `edit-user-dialog.tsx`**

Same two changes as Step 2 (zod enum, `assignableRoles` ternary) — read the file fresh, it's structurally near-identical to `create-user-form.tsx` for this part.

- [ ] **Step 4: `user-list.tsx`**

`ROLE_COLORS` map: remove the `MANAGER` entry, keep `ADMIN`/`VIEWER`/`SUPER_ADMIN`. The fallback usages (`ROLE_COLORS.VIEWER` at two call sites) are unaffected since `VIEWER` still exists.

- [ ] **Step 5: `user-detail-client.tsx`**

This file's role editor is narrower than `create-user-form`/`edit-user-dialog` — it currently offers a raw two-option choice between `'MANAGER'`/`'VIEWER'` for any non-`ADMIN` target user (gated by `user.role !== ROLE.ADMIN`, so `SUPER_ADMIN`/`ADMIN` target users never see this selector at all). With `MANAGER` gone, there is exactly one non-admin role left — a two-option toggle no longer makes sense. Read the file fresh and:
- Change `editSchema`'s `role: z.enum(['MANAGER', 'VIEWER'])` to `role: z.enum(['VIEWER'])` (the schema still needs to exist and validate correctly if the field is submitted, even if the UI no longer offers a real choice).
- Change line ~65's `role: user.role === 'ADMIN' ? 'MANAGER' : (user.role as 'MANAGER' | 'VIEWER')` to simply seed `'VIEWER'` when the target isn't `ADMIN` (the ternary's `'ADMIN'` branch was already dead in practice given the `user.role !== ROLE.ADMIN` gate around the whole selector — confirm this reading against the actual surrounding code before simplifying, don't guess blind).
- Replace the hard-coded two-option Combobox (`{ value: 'MANAGER', label: 'Gerente' }` / `{ value: 'VIEWER', label: 'Visualizador' }`) with a single, non-interactive read-only indicator showing "Usuário" (matching Step 1's new label) — since there is nothing left to choose between for a non-admin target user, a picker with one immutable option is worse UX than just showing the role as text. If promoting a `VIEWER` user to `ADMIN` from this specific screen is something the product still needs, that capability already exists via `edit-user-dialog.tsx` (which still offers the full `SUPER_ADMIN`-only `[ADMIN, VIEWER]` choice) — this task does not need to add ADMIN-promotion to `user-detail-client.tsx` as well; keep this file's scope to "stop offering a dead MANAGER/VIEWER choice," not "add new capability."

- [ ] **Step 6: Sweep the five listed spec files**

For each of `create-user-form.spec.tsx`, `use-users.spec.tsx`, `use-permissions.spec.ts`, `use-create-user.spec.tsx`, `use-auth.spec.ts`: grep for `MANAGER`. Fixture-default hits (a mock user/session with `role: ROLE.MANAGER` or `'MANAGER'` used generically) → change to `ROLE.VIEWER`/`'VIEWER'`. Any hit asserting `MANAGER`-specific UI behavior (e.g. "a MANAGER sees option X but not Y") needs the same judgment call as Task 4 Step 4 — rewrite to test the surviving `VIEWER`-vs-`ADMIN` distinction if one exists, or remove if the distinction no longer applies, and report anything genuinely ambiguous.

- [ ] **Step 7: Full verification**

Run: `pnpm --filter=web test` (full suite), `pnpm lint`, `pnpm exec turbo run type-check --force` (full monorepo).
Expected: **the whole monorepo should now be clean** — `apps/api` and `apps/web` both green except the two named pre-existing web failures (`api-client.spec.ts`, `create-user-form.spec.tsx`) and the two named pre-existing api failures (`subscription.service.spec.ts`, `system.integration.spec.ts`). This is the last task in the plan — confirm this explicitly rather than assuming.

- [ ] **Step 8: Manual smoke check (if feasible)**

Same caveats as Phase 1's frontend tasks — if no browser/dev-auth is available in this environment, substitute a successful `pnpm --filter=web build` covering `/admin/users` and `/admin/users/[id]`, and say so explicitly in the report rather than claiming a live click-through was done.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/lib/role-labels.ts apps/web/src/components/admin/create-user-form.tsx apps/web/src/components/admin/edit-user-dialog.tsx apps/web/src/components/admin/user-list.tsx "apps/web/src/app/(dashboard)/admin/users/[id]/_components/user-detail-client.tsx"
git commit -m "feat(web): collapse MANAGER into VIEWER across role pickers, labels, and user-detail editor"
```

(add whichever of the five spec files you actually changed in Step 6.)

---

## Final Verification (after all 8 tasks)

1. **Full quality gate:** `pnpm lint && pnpm type-check && pnpm test` from repo root — clean except the four named pre-existing failures (2 web, 2 api). Run `apps/web`/`apps/api` test suites separately to get true signal, per the root-`pnpm test`-fail-fast caveat noted throughout this plan.
2. **Migration dry-run against an isolated Postgres** (not the shared `ged-db` dev container) — same procedure as Phase 1: throwaway `postgres:17-alpine` container, run all migrations including the new `1782950400011`, spot-check `users_role_enum` now has exactly 3 values (`ADMIN`, `VIEWER`, `SUPER_ADMIN`) and any pre-seeded `MANAGER` user row now reads `VIEWER`, then revert and confirm the 4-value enum + `MANAGER` default type is restored.
3. **End-to-end scenarios** (manual, once a live API + seeded data is available):
   - A `VIEWER` (ex-`MANAGER` or otherwise) without `DOCUMENTS_CREATE` gets `403` on `POST /documents`.
   - An `ADMIN` grants a `VIEWER` user the `DOCUMENTS_CREATE` permission via the existing user-permissions endpoint → that `VIEWER` can now `POST /documents` successfully, without any role change.
   - `ADMIN` continues to succeed on every previously-`@Roles(ADMIN, MANAGER)` route with **zero** permission rows assigned (proves Task 1's guard fix is doing its job).
   - `SUPER_ADMIN` is unaffected everywhere (unchanged bypass in both `RolesGuard` and `PermissionsGuard`).
   - The user-creation and user-edit forms only ever offer `ADMIN`/`VIEWER` as assignable roles (never `MANAGER`), and a `SUPER_ADMIN`-only actor is the only one who can assign `ADMIN`.
4. **Regression check:** confirm Phase 1's confidentiality/access-control feature (already merged into this branch's history) is untouched — this plan never modifies `apps/api/src/modules/documents/use-cases/apply-document-confidentiality.use-case.ts`, `documents.repository.ts`, or anything under `apps/api/src/modules/public/*`.
