'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAppearanceRefresh } from '@/hooks/use-appearance-refresh';
import type { PortalAppearanceDto, UpdatePortalAppearanceInput } from '@/types';

const QUERY_KEY = ['admin-appearance', 'portal'];

export function usePortalAppearance() {
  const { data: session } = useSession();

  return useQuery<PortalAppearanceDto>({
    queryKey: QUERY_KEY,
    queryFn: () =>
      apiClient.get<PortalAppearanceDto>('/admin/appearance/portal', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useUpdatePortalAppearance() {
  const { data: session } = useSession();
  const refreshAppearance = useAppearanceRefresh('portal');

  return useMutation({
    mutationFn: (payload: UpdatePortalAppearanceInput) =>
      apiClient.put<PortalAppearanceDto>('/admin/appearance/portal', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: async () => {
      await refreshAppearance();
      toast.success('Aparência do portal atualizada!');
    },
    onError: (err) => {
      toast.error(toMessage(err, 'Erro ao atualizar a aparência do portal'));
    },
  });
}

export function useUploadPortalLogo() {
  const { data: session } = useSession();
  const refreshAppearance = useAppearanceRefresh('portal');

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      return apiClient.post<PortalAppearanceDto>('/admin/appearance/portal/logo', formData, {
        token: session?.user?.accessToken,
      });
    },
    onSuccess: async () => {
      await refreshAppearance();
      toast.success('Logo do portal atualizado!');
    },
    onError: (err) => {
      toast.error(toMessage(err, 'Erro ao enviar o logo'));
    },
  });
}

export function useDeletePortalLogo() {
  const { data: session } = useSession();
  const refreshAppearance = useAppearanceRefresh('portal');

  return useMutation({
    mutationFn: () =>
      apiClient.delete<PortalAppearanceDto>('/admin/appearance/portal/logo', {
        token: session?.user?.accessToken,
      }),
    onSuccess: async () => {
      await refreshAppearance();
      toast.success('Logo do portal removido.');
    },
    onError: (err) => {
      toast.error(toMessage(err, 'Erro ao remover o logo'));
    },
  });
}
