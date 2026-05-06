'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { PhoneDto } from '../types';

export interface CreatePhonePayload {
  tipo: 'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL';
  numero: string;
}

export type UpdatePhonePayload = Partial<CreatePhonePayload>;

export function usePhones(userId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['phones', userId],
    queryFn: () =>
      apiClient.get<PhoneDto[]>(`/users/${userId}/physical-person/phones`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken && !!userId,
  });
}

export function useCreatePhone(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePhonePayload) =>
      apiClient.post<PhoneDto>(`/users/${userId}/physical-person/phones`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['phones', userId] });
      toast.success('Telefone adicionado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar telefone';
      toast.error(message);
    },
  });
}

export function useUpdatePhone(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePhonePayload }) =>
      apiClient.patch<PhoneDto>(`/users/${userId}/physical-person/phones/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['phones', userId] });
      toast.success('Telefone atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar telefone';
      toast.error(message);
    },
  });
}

export function useDeletePhone(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/users/${userId}/physical-person/phones/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['phones', userId] });
      toast.success('Telefone removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover telefone';
      toast.error(message);
    },
  });
}
