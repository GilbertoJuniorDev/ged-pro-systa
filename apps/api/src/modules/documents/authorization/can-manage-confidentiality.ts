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
