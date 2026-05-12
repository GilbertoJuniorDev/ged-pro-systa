'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { CompanyPhoneDto, UpsertCompanyPhoneInput } from '../types';

const KEY = ['company-phones'] as const;

export function useCompanyPhones() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: KEY,
    queryFn: () =>
      apiClient.get<CompanyPhoneDto[]>('/company/phones', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreateCompanyPhone() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertCompanyPhoneInput) =>
      apiClient.post<CompanyPhoneDto>('/company/phones', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Telefone adicionado!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao adicionar telefone'),
  });
}

export function useUpdateCompanyPhone() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertCompanyPhoneInput }) =>
      apiClient.put<CompanyPhoneDto>(`/company/phones/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Telefone atualizado!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar telefone'),
  });
}

export function useDeleteCompanyPhone() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/company/phones/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Telefone removido!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao remover telefone'),
  });
}
