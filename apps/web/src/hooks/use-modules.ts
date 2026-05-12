'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { ModuleDto } from '../types';

export interface CreateModulePayload {
  nome: string;
  slug: string;
  descricao?: string | null;
  icone?: string | null;
  ordem?: number;
}

export interface UpdateModulePayload {
  nome?: string;
  slug?: string;
  descricao?: string | null;
  icone?: string | null;
  ordem?: number;
  isActive?: boolean;
}

export function useModules() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['modules'],
    queryFn: () =>
      apiClient.get<ModuleDto[]>('/modules', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreateModule() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateModulePayload) =>
      apiClient.post<ModuleDto>('/modules', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo criado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar módulo';
      toast.error(message);
    },
  });
}

export function useUpdateModule() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModulePayload }) =>
      apiClient.patch<ModuleDto>(`/modules/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar módulo';
      toast.error(message);
    },
  });
}

export function useDeleteModule() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/modules/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover módulo';
      toast.error(message);
    },
  });
}
