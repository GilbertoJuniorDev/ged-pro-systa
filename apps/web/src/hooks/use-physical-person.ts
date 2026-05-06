'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { PhysicalPersonDto } from '../types';

export interface CreatePhysicalPersonPayload {
  nome: string;
  sobrenome: string;
  cpf: string;
  dataNascimento: string;
  sexo: 'M' | 'F' | 'O';
}

export type UpdatePhysicalPersonPayload = Partial<CreatePhysicalPersonPayload>;

export function usePhysicalPerson(userId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['physical-person', userId],
    queryFn: () =>
      apiClient.get<PhysicalPersonDto>(`/users/${userId}/physical-person`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken && !!userId,
    retry: (failureCount, error) => {
      // Não retry em 404 (usuário ainda não tem pessoa física)
      if (error instanceof Error && error.message.includes('404')) return false;
      return failureCount < 2;
    },
  });
}

export function useCreatePhysicalPerson(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePhysicalPersonPayload) =>
      apiClient.post<PhysicalPersonDto>(`/users/${userId}/physical-person`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['physical-person', userId] });
      toast.success('Perfil criado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar perfil';
      toast.error(message);
    },
  });
}

export function useUpdatePhysicalPerson(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePhysicalPersonPayload) =>
      apiClient.patch<PhysicalPersonDto>(`/users/${userId}/physical-person`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['physical-person', userId] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      toast.error(message);
    },
  });
}
