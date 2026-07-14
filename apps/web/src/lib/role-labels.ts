import type { Role } from '@ged/types';

/** Rótulos PT-BR para as roles de usuário — fonte única para forms e listagens. */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  VIEWER: 'Usuário',
  SUPER_ADMIN: 'Super Admin',
};

export function roleLabel(role: Role | string): string {
  return ROLE_LABELS[role] ?? role;
}
