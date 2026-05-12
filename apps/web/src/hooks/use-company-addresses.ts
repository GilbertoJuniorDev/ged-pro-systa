'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { CompanyAddressDto, UpsertCompanyAddressInput } from '../types';

const KEY = ['company-addresses'] as const;

export function useCompanyAddresses() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: KEY,
    queryFn: () =>
      apiClient.get<CompanyAddressDto[]>('/company/addresses', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreateCompanyAddress() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertCompanyAddressInput) =>
      apiClient.post<CompanyAddressDto>('/company/addresses', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Endereço adicionado!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao adicionar endereço'),
  });
}

export function useUpdateCompanyAddress() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertCompanyAddressInput }) =>
      apiClient.put<CompanyAddressDto>(`/company/addresses/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Endereço atualizado!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar endereço'),
  });
}

export function useDeleteCompanyAddress() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/company/addresses/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Endereço removido!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao remover endereço'),
  });
}
