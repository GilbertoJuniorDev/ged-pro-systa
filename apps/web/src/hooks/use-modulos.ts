'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { ModuloDto } from '../types';

export interface CreateModuloPayload {
  nome: string;
  slug: string;
  descricao?: string | null;
  icone?: string | null;
  ordem?: number;
}

export interface UpdateModuloPayload {
  nome?: string;
  slug?: string;
  descricao?: string | null;
  icone?: string | null;
  ordem?: number;
  isActive?: boolean;
}

export function useModulos() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['modulos'],
    queryFn: () =>
      apiClient.get<ModuloDto[]>('/modulos', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreateModulo() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateModuloPayload) =>
      apiClient.post<ModuloDto>('/modulos', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['modulos'] });
      toast.success('Módulo criado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar módulo';
      toast.error(message);
    },
  });
}

export function useUpdateModulo() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModuloPayload }) =>
      apiClient.patch<ModuloDto>(`/modulos/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['modulos'] });
      toast.success('Módulo atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar módulo';
      toast.error(message);
    },
  });
}

export function useDeleteModulo() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/modulos/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['modulos'] });
      toast.success('Módulo removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover módulo';
      toast.error(message);
    },
  });
}
