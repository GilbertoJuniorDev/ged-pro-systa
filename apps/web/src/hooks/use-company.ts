'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '../lib/api-client';
import type { CompanyDto, UpsertCompanyInput } from '../types';

export function useCompany() {
  const { data: session } = useSession();

  return useQuery<CompanyDto | null>({
    queryKey: ['company'],
    queryFn: async () => {
      try {
        return await apiClient.get<CompanyDto>('/company', {
          token: session?.user?.accessToken,
        });
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) return null;
        throw err;
      }
    },
    enabled: !!session?.user?.accessToken,
  });
}

export function useUpsertCompany() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertCompanyInput) =>
      apiClient.put<CompanyDto>('/company', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Empresa salva com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao salvar empresa';
      toast.error(message);
    },
  });
}
