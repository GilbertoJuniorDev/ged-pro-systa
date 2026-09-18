'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAppearanceRefresh } from '@/hooks/use-appearance-refresh';
import type { SystemAppearanceDto, UpdateSystemAppearanceInput } from '@/types';

const QUERY_KEY = ['admin-appearance', 'system'];

export function useSystemAppearance() {
  const { data: session } = useSession();

  return useQuery<SystemAppearanceDto>({
    queryKey: QUERY_KEY,
    queryFn: () =>
      apiClient.get<SystemAppearanceDto>('/admin/appearance/system', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useUpdateSystemAppearance() {
  const { data: session } = useSession();
  const refreshAppearance = useAppearanceRefresh('system');

  return useMutation({
    mutationFn: (payload: UpdateSystemAppearanceInput) =>
      apiClient.put<SystemAppearanceDto>('/admin/appearance/system', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: async () => {
      await refreshAppearance();
      toast.success('Cores do sistema atualizadas!');
    },
    onError: (err) => {
      toast.error(toMessage(err, 'Erro ao atualizar a aparência do sistema'));
    },
  });
}

export function useUploadSystemLogo() {
  const { data: session } = useSession();
  const refreshAppearance = useAppearanceRefresh('system');

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      return apiClient.post<SystemAppearanceDto>('/admin/appearance/system/logo', formData, {
        token: session?.user?.accessToken,
      });
    },
    onSuccess: async () => {
      await refreshAppearance();
      toast.success('Logo do sistema atualizado!');
    },
    onError: (err) => {
      toast.error(toMessage(err, 'Erro ao enviar o logo'));
    },
  });
}

export function useDeleteSystemLogo() {
  const { data: session } = useSession();
  const refreshAppearance = useAppearanceRefresh('system');

  return useMutation({
    mutationFn: () =>
      apiClient.delete<SystemAppearanceDto>('/admin/appearance/system/logo', {
        token: session?.user?.accessToken,
      }),
    onSuccess: async () => {
      await refreshAppearance();
      toast.success('Logo do sistema removido.');
    },
    onError: (err) => {
      toast.error(toMessage(err, 'Erro ao remover o logo'));
    },
  });
}
