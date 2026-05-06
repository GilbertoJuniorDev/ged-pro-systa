'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { EnderecoDto } from '../types';

export interface CreateEnderecoPayload {
  tipo: 'RESIDENCIAL' | 'COMERCIAL' | 'OUTRO';
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export type UpdateEnderecoPayload = Partial<CreateEnderecoPayload>;

export function useEnderecos(userId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['enderecos', userId],
    queryFn: () =>
      apiClient.get<EnderecoDto[]>(`/users/${userId}/pessoa-fisica/enderecos`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken && !!userId,
  });
}

export function useCreateEndereco(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEnderecoPayload) =>
      apiClient.post<EnderecoDto>(`/users/${userId}/pessoa-fisica/enderecos`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enderecos', userId] });
      toast.success('Endereço adicionado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar endereço';
      toast.error(message);
    },
  });
}

export function useUpdateEndereco(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEnderecoPayload }) =>
      apiClient.patch<EnderecoDto>(`/users/${userId}/pessoa-fisica/enderecos/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enderecos', userId] });
      toast.success('Endereço atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar endereço';
      toast.error(message);
    },
  });
}

export function useDeleteEndereco(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/users/${userId}/pessoa-fisica/enderecos/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enderecos', userId] });
      toast.success('Endereço removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover endereço';
      toast.error(message);
    },
  });
}
