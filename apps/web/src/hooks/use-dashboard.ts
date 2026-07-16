'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { ROLE } from '@ged/types';
import { apiClient } from '../lib/api-client';
import type { DashboardAdminSummaryDto, DashboardSummaryDto } from '../types';

export function useDashboardSummary() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () =>
      apiClient.get<DashboardSummaryDto>('/dashboard/summary', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useDashboardAdminSummary() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isPrivileged = role === ROLE.ADMIN || role === ROLE.SUPER_ADMIN;

  return useQuery({
    queryKey: ['dashboard', 'admin-summary'],
    queryFn: () =>
      apiClient.get<DashboardAdminSummaryDto>('/dashboard/admin-summary', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken && isPrivileged,
  });
}
