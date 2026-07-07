'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { DossieDto, UpsertDossieInput } from '../types';

export type CreateDossiePayload = UpsertDossieInput;

export interface UpdateDossiePayload {
  nome?: string;
  descricao?: string | null;
  isActive?: boolean;
}

export function useDossies(departamentoId?: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['dossies', departamentoId ?? null],
    queryFn: () =>
      apiClient.get<DossieDto[]>(
        `/dossies${departamentoId ? `?departamentoId=${departamentoId}` : ''}`,
        { token: session?.user?.accessToken },
      ),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreateDossie() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDossiePayload) =>
      apiClient.post<DossieDto>('/dossies', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dossies'] });
      toast.success('Dossiê criado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar dossiê';
      toast.error(message);
    },
  });
}

export function useUpdateDossie() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDossiePayload }) =>
      apiClient.patch<DossieDto>(`/dossies/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dossies'] });
      toast.success('Dossiê atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar dossiê';
      toast.error(message);
    },
  });
}

export function useDeleteDossie() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/dossies/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dossies'] });
      toast.success('Dossiê removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover dossiê';
      toast.error(message);
    },
  });
}
