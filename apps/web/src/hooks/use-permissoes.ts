'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { PermissaoDto } from '../types';

export interface CreatePermissaoPayload {
  nome: string;
  descricao?: string;
  moduloId?: string | null;
}

export interface UpdatePermissaoPayload {
  nome?: string;
  descricao?: string;
  moduloId?: string | null;
}

export function usePermissoes() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['permissoes'],
    queryFn: () =>
      apiClient.get<PermissaoDto[]>('/permissoes', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreatePermissao() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePermissaoPayload) =>
      apiClient.post<PermissaoDto>('/permissoes', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['permissoes'] });
      toast.success('Permissão criada com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar permissão';
      toast.error(message);
    },
  });
}

export function useUpdatePermissao() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePermissaoPayload }) =>
      apiClient.patch<PermissaoDto>(`/permissoes/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['permissoes'] });
      toast.success('Permissão atualizada com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar permissão';
      toast.error(message);
    },
  });
}

export function useDeletePermissao() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/permissoes/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['permissoes'] });
      toast.success('Permissão removida com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover permissão';
      toast.error(message);
    },
  });
}
