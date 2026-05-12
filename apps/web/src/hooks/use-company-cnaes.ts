'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { CompanyCnaeDto, UpsertCompanyCnaeInput } from '../types';

const KEY = ['company-cnaes'] as const;

export function useCompanyCnaes() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: KEY,
    queryFn: () =>
      apiClient.get<CompanyCnaeDto[]>('/company/cnaes', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreateCompanyCnae() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertCompanyCnaeInput) =>
      apiClient.post<CompanyCnaeDto>('/company/cnaes', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('CNAE adicionado!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao adicionar CNAE'),
  });
}

export function useUpdateCompanyCnae() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertCompanyCnaeInput }) =>
      apiClient.put<CompanyCnaeDto>(`/company/cnaes/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('CNAE atualizado!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar CNAE'),
  });
}

export function useDeleteCompanyCnae() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/company/cnaes/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('CNAE removido!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao remover CNAE'),
  });
}
