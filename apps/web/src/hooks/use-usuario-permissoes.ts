'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { UsuarioPermissaoDto } from '../types';

export function useUsuarioPermissoes(userId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['usuario-permissoes', userId],
    queryFn: () =>
      apiClient.get<UsuarioPermissaoDto[]>(`/users/${userId}/permissoes`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken && !!userId,
  });
}

export function useAssignPermissao(userId: string) {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissaoId: string) =>
      apiClient.post<UsuarioPermissaoDto>(`/users/${userId}/permissoes`, { permissaoId }, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['usuario-permissoes', userId] });
      const currentUserId = (session?.user as { sub?: string } | undefined)?.sub;
      if (currentUserId === userId) {
        void update();
      }
      toast.success('Permissão atribuída com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atribuir permissão';
      toast.error(message);
    },
  });
}

export function useRevokePermissao(userId: string) {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissaoId: string) =>
      apiClient.delete<void>(`/users/${userId}/permissoes/${permissaoId}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['usuario-permissoes', userId] });
      const currentUserId = (session?.user as { sub?: string } | undefined)?.sub;
      if (currentUserId === userId) {
        void update();
      }
      toast.success('Permissão revogada com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao revogar permissão';
      toast.error(message);
    },
  });
}
