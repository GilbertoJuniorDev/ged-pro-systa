'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { PermissionDto } from '../types';

export interface CreatePermissionPayload {
  nome: string;
  descricao?: string;
  moduloId?: string | null;
}

export interface UpdatePermissionPayload {
  nome?: string;
  descricao?: string;
  moduloId?: string | null;
}

export function usePermissionsManagement() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['permissions-management'],
    queryFn: () =>
      apiClient.get<PermissionDto[]>('/permissions', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreatePermission() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePermissionPayload) =>
      apiClient.post<PermissionDto>('/permissions', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['permissions-management'] });
      toast.success('Permissão criada com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar permissão';
      toast.error(message);
    },
  });
}

export function useUpdatePermission() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePermissionPayload }) =>
      apiClient.patch<PermissionDto>(`/permissions/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['permissions-management'] });
      toast.success('Permissão atualizada com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar permissão';
      toast.error(message);
    },
  });
}

export function useDeletePermission() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/permissions/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['permissions-management'] });
      toast.success('Permissão removida com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover permissão';
      toast.error(message);
    },
  });
}
