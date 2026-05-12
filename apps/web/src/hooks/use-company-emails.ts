'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { CompanyEmailDto, UpsertCompanyEmailInput } from '../types';

const KEY = ['company-emails'] as const;

export function useCompanyEmails() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: KEY,
    queryFn: () =>
      apiClient.get<CompanyEmailDto[]>('/company/emails', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreateCompanyEmail() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertCompanyEmailInput) =>
      apiClient.post<CompanyEmailDto>('/company/emails', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('E-mail adicionado!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao adicionar e-mail'),
  });
}

export function useUpdateCompanyEmail() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertCompanyEmailInput }) =>
      apiClient.put<CompanyEmailDto>(`/company/emails/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('E-mail atualizado!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar e-mail'),
  });
}

export function useDeleteCompanyEmail() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/company/emails/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('E-mail removido!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao remover e-mail'),
  });
}
