'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { PaginatedResult } from '../types';

export type ErrorLogSource = 'api' | 'web-client' | 'web-server';
export type ErrorLogLevel = 'warn' | 'error' | 'fatal';

export interface ErrorLogDto {
  id: string;
  source: ErrorLogSource;
  level: ErrorLogLevel;
  message: string;
  stack: string | null;
  code: string | null;
  statusCode: number | null;
  method: string | null;
  url: string | null;
  userAgent: string | null;
  ip: string | null;
  userId: string | null;
  userEmail: string | null;
  requestId: string | null;
  context: Record<string, unknown> | null;
  createdAt: string;
}

export interface ErrorLogFilters {
  source?: ErrorLogSource;
  level?: ErrorLogLevel;
  statusCode?: number;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function useErrorLogs(filters: ErrorLogFilters = {}) {
  const { data: session } = useSession();

  const params = new URLSearchParams();
  if (filters.source) params.set('source', filters.source);
  if (filters.level) params.set('level', filters.level);
  if (typeof filters.statusCode === 'number') {
    params.set('statusCode', String(filters.statusCode));
  }
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.search) params.set('search', filters.search);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const queryString = params.toString();
  const path = queryString ? `/error-logs?${queryString}` : '/error-logs';

  return useQuery({
    queryKey: ['error-logs', filters],
    queryFn: () =>
      apiClient.get<PaginatedResult<ErrorLogDto>>(path, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}
