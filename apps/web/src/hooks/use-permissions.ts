'use client';

import { useSession } from 'next-auth/react';

interface PermissionsSessionUser {
  permissoes?: string[];
  modulos?: string[];
  role?: string;
}

export function usePermissions() {
  const { data: session } = useSession();
  const user = session?.user as PermissionsSessionUser | undefined;
  const permissoes = user?.permissoes ?? [];
  const modulos = user?.modulos ?? [];

  function hasPermission(name: string): boolean {
    if (user?.role === 'ADMIN') return true;
    return permissoes.includes(name);
  }

  function hasModuleAccess(slug: string): boolean {
    if (user?.role === 'ADMIN') return true;
    return modulos.includes(slug);
  }

  return { permissoes, modulos, hasPermission, hasModuleAccess };
}
