import { ROLE } from '@ged/database';
import type { Role } from '@ged/types';

/**
 * Papéis que um usuário com `actingRole` tem permissão para atribuir a outro usuário.
 * SUPER_ADMIN nunca é atribuível por esta via, independentemente de quem estiver agindo.
 */
export function getAssignableRoles(actingRole: Role): readonly Role[] {
  if (actingRole === ROLE.SUPER_ADMIN) {
    return [ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER];
  }
  return [ROLE.MANAGER, ROLE.VIEWER];
}
