import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
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

    // Denial never mutates state — it always throws before touching the grant tables.
    // This matters most on update: silently forcing an already-CONFIDENCIAL/RESTRITO-with-
    // grants document back to bare RESTRITO as a side effect of an unauthorized request
    // would destroy real access-control state. Only the "nothing beyond the default was
    // requested" path (requestsManagement === false) skips the permission check entirely —
    // that's the safe, no-op-equivalent default, not a denial.
    if (requestsManagement) {
      const allowed = await canManageConfidentiality(input.actingUser, this.userPermissionsService);
      if (!allowed) {
        throw new ForbiddenException(
          'Você não tem permissão para gerenciar a confidencialidade deste documento',
        );
      }
    }

    const confidencialidade: Confidencialidade =
      input.requestedConfidencialidade ?? CONFIDENCIALIDADE.RESTRITO;

    if (confidencialidade === CONFIDENCIALIDADE.CONFIDENCIAL) {
      const requestedUserIds = input.requestedAccessUserIds ?? [];
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
      const accessDepartamentoIds = input.requestedAccessDepartamentoIds ?? [];
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

    // Full clear (e.g. moving away from RESTRITO to PUBLICO/CONFIDENCIAL): wipe every
    // grant row for the document in one shot rather than diffing id-by-id.
    if (departamentoIds.length === 0) {
      if (currentIds.length > 0) {
        await manager.delete(DocumentAccessDepartment, { documentId });
      }
      return;
    }

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

    // Full clear (e.g. moving away from CONFIDENCIAL): wipe every grant row for the
    // document in one shot rather than diffing id-by-id.
    if (usuarioIds.length === 0) {
      if (currentIds.length > 0) {
        await manager.delete(DocumentAccessUser, { documentId });
      }
      return;
    }

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
