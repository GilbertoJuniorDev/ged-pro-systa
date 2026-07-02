'use client';

import { useSession } from 'next-auth/react';
import { ROLE } from '@ged/types';

interface PermissionsSessionUser {
  permissoes?: string[];
  modulos?: string[];
  role?: string;
}

function isFullAccessRole(role?: string): boolean {
  return role === ROLE.ADMIN || role === ROLE.SUPER_ADMIN;
}

export function usePermissions() {
  const { data: session } = useSession();
  const user = session?.user as PermissionsSessionUser | undefined;
  const permissoes = user?.permissoes ?? [];
  const modulos = user?.modulos ?? [];

  function hasPermission(name: string): boolean {
    if (isFullAccessRole(user?.role)) return true;
    return permissoes.includes(name);
  }

  function hasModuleAccess(slug: string): boolean {
    if (isFullAccessRole(user?.role)) return true;
    return modulos.includes(slug);
  }

  return { permissoes, modulos, hasPermission, hasModuleAccess };
}
