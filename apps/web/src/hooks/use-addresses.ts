'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { AddressDto } from '../types';

export interface CreateAddressPayload {
  tipo: 'RESIDENCIAL' | 'COMERCIAL' | 'OUTRO';
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export function useAddresses(userId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: () =>
      apiClient.get<AddressDto[]>(`/users/${userId}/physical-person/addresses`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken && !!userId,
  });
}

export function useCreateAddress(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAddressPayload) =>
      apiClient.post<AddressDto>(`/users/${userId}/physical-person/addresses`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses', userId] });
      toast.success('Endereço adicionado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar endereço';
      toast.error(message);
    },
  });
}

export function useUpdateAddress(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAddressPayload }) =>
      apiClient.patch<AddressDto>(`/users/${userId}/physical-person/addresses/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses', userId] });
      toast.success('Endereço atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar endereço';
      toast.error(message);
    },
  });
}

export function useDeleteAddress(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/users/${userId}/physical-person/addresses/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses', userId] });
      toast.success('Endereço removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover endereço';
      toast.error(message);
    },
  });
}
