'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { SystemVersionDto, AdminSystemVersionDto } from '../types';

export function useSystemVersion() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['system-version'],
    queryFn: () =>
      apiClient.get<SystemVersionDto>('/system/version', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSystemVersion() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['system-version-admin'],
    queryFn: () =>
      apiClient.get<AdminSystemVersionDto>('/system/version/admin', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
    staleTime: 30 * 1000,
  });
}
