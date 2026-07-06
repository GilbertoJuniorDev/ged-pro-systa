'use client';

import { useSession } from 'next-auth/react';
import type { Role } from '@ged/types';

interface AuthSessionUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  sub?: string;
  accessToken?: string;
  role?: Role;
  departamentos?: { id: string; nome: string }[];
  selectedDepartmentId?: string | null;
  viewMode?: 'department' | 'admin' | null;
}

export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user as AuthSessionUser | undefined;

  return { session, status, isLoading, isAuthenticated, user };
}
