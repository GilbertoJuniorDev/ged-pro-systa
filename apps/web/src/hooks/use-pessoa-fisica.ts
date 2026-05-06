'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { PessoaFisicaDto } from '../types';

export interface CreatePessoaFisicaPayload {
  nome: string;
  sobrenome: string;
  cpf: string;
  dataNascimento: string;
  sexo: 'M' | 'F' | 'O';
}

export type UpdatePessoaFisicaPayload = Partial<CreatePessoaFisicaPayload>;

export function usePessoaFisica(userId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['pessoa-fisica', userId],
    queryFn: () =>
      apiClient.get<PessoaFisicaDto>(`/users/${userId}/pessoa-fisica`, {
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

export function useCreatePessoaFisica(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePessoaFisicaPayload) =>
      apiClient.post<PessoaFisicaDto>(`/users/${userId}/pessoa-fisica`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pessoa-fisica', userId] });
      toast.success('Perfil criado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar perfil';
      toast.error(message);
    },
  });
}

export function useUpdatePessoaFisica(userId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePessoaFisicaPayload) =>
      apiClient.patch<PessoaFisicaDto>(`/users/${userId}/pessoa-fisica`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pessoa-fisica', userId] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      toast.error(message);
    },
  });
}
