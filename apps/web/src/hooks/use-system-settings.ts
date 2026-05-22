'use client';

import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../lib/api-client';

export interface SystemSettingDto {
  readonly key: string;
  readonly value: string | null;
}

export function useSystemSetting(key: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['system-settings', key],
    queryFn: () =>
      apiClient.get<SystemSettingDto>(`/system-settings/${key}`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useUpdateSystemSetting(key: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: string | null) =>
      apiClient.put<SystemSettingDto>(
        `/system-settings/${key}`,
        { value },
        { token: session?.user?.accessToken },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['system-settings', key],
      });
      toast.success('Configuração salva com sucesso!');
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar configuração';
      toast.error(message);
    },
  });
}
