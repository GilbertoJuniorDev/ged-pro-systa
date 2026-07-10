'use client';

import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { PublicDocumentDto, RegisterAccessInput, RegisterAccessResult } from '../types';

// Hooks do portal público — NUNCA passam `{ token }` nem usam `enabled: !!session...`:
// as rotas /public/documents/* não exigem autenticação (@Public() no controller da API).

export interface PublicDocumentFilters {
  search?: string;
  serieId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPublicDocuments {
  data: PublicDocumentDto[];
  total: number;
  page: number;
  limit: number;
}

function buildQueryString(filters: PublicDocumentFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.serieId) params.set('serieId', filters.serieId);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function usePublicDocuments(filters: PublicDocumentFilters = {}) {
  return useQuery({
    queryKey: ['public-documents', filters],
    queryFn: () => apiClient.get<PaginatedPublicDocuments>(`/public/documents${buildQueryString(filters)}`),
  });
}

export function usePublicDestaques() {
  return useQuery({
    queryKey: ['public-documents', 'destaques'],
    queryFn: () => apiClient.get<PublicDocumentDto[]>('/public/documents/destaques'),
  });
}

export function usePublicRecentes(limit?: number) {
  return useQuery({
    queryKey: ['public-documents', 'recentes', limit],
    queryFn: () =>
      apiClient.get<PublicDocumentDto[]>(`/public/documents/recentes${limit ? `?limit=${limit}` : ''}`),
  });
}

export function usePublicDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['public-documents', 'detail', id],
    queryFn: () => apiClient.get<PublicDocumentDto>(`/public/documents/${id}`),
    enabled: !!id,
  });
}

export function useRegisterAccess() {
  return useMutation({
    mutationFn: ({ documentId, input }: { documentId: string; input: RegisterAccessInput }) =>
      apiClient.post<RegisterAccessResult>(`/public/documents/${documentId}/acesso`, input),
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao registrar acesso';
      toast.error(message);
    },
  });
}
