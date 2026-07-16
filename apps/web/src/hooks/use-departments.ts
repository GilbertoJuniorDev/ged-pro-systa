'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { DepartmentDto, UpsertDepartmentInput } from '../types';

export type CreateDepartmentPayload = UpsertDepartmentInput;

export interface UpdateDepartmentPayload {
  nome?: string;
  descricao?: string | null;
  isActive?: boolean;
}

export function useDepartments(enabled: boolean = true) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['departments'],
    queryFn: () =>
      apiClient.get<DepartmentDto[]>('/departments', {
        token: session?.user?.accessToken,
      }),
    enabled: enabled && !!session?.user?.accessToken,
  });
}

export function useCreateDepartment() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) =>
      apiClient.post<DepartmentDto>('/departments', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento criado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar departamento';
      toast.error(message);
    },
  });
}

export function useUpdateDepartment() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartmentPayload }) =>
      apiClient.patch<DepartmentDto>(`/departments/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar departamento';
      toast.error(message);
    },
  });
}

export function useDeleteDepartment() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/departments/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover departamento';
      toast.error(message);
    },
  });
}
