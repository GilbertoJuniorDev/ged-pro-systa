'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { TelefoneDto } from '../types';

export interface CreateTelefonePayload {
  tipo: 'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL';
  numero: string;
}

export type UpdateTelefonePayload = Partial<CreateTelefonePayload>;

export function useTelefones(userId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['telefones', userId],
    queryFn: () =>
      apiClient.get<TelefoneDto[]>(`/users/${userId}/pessoa-fisica/telefones`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken && !!userId,
  });
}

export function useCreateTelefone(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTelefonePayload) =>
      apiClient.post<TelefoneDto>(`/users/${userId}/pessoa-fisica/telefones`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['telefones', userId] });
      toast.success('Telefone adicionado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar telefone';
      toast.error(message);
    },
  });
}

export function useUpdateTelefone(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTelefonePayload }) =>
      apiClient.patch<TelefoneDto>(`/users/${userId}/pessoa-fisica/telefones/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['telefones', userId] });
      toast.success('Telefone atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar telefone';
      toast.error(message);
    },
  });
}

export function useDeleteTelefone(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/users/${userId}/pessoa-fisica/telefones/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['telefones', userId] });
      toast.success('Telefone removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover telefone';
      toast.error(message);
    },
  });
}
