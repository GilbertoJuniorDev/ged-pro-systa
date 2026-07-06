'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { ApiResponse } from '../types';

interface CreateUserPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role?: string;
  readonly permissaoIds?: readonly string[];
  readonly departamentoIds?: readonly string[];
  readonly pessoaFisica: {
    readonly nome: string;
    readonly sobrenome: string;
    readonly cpf: string;
    readonly dataNascimento: string;
    readonly sexo: 'M' | 'F' | 'O';
  };
}

interface UserCreated {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export function useCreateUser() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      apiClient.post<ApiResponse<UserCreated>>('/users', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário';
      toast.error(message);
    },
  });
}
