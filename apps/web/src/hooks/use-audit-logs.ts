'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { AuditLogDto, PaginatedResult } from '../types';

export interface AuditLogFilters {
  usuarioId?: string;
  acao?: string;
  entidade?: string;
  page?: number;
  limit?: number;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { data: session } = useSession();

  const params = new URLSearchParams();
  if (filters.usuarioId) params.set('usuarioId', filters.usuarioId);
  if (filters.acao) params.set('acao', filters.acao);
  if (filters.entidade) params.set('entidade', filters.entidade);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const queryString = params.toString();
  const path = queryString ? `/audit-logs?${queryString}` : '/audit-logs';

  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () =>
      apiClient.get<PaginatedResult<AuditLogDto>>(path, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}
