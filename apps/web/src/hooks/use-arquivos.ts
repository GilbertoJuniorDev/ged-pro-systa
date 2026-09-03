'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  ArquivoDto,
  ArquivoQuery,
  CreateArquivoInput,
  PaginatedResult,
  UpdateArquivoInput,
} from '../types';

export type CreateArquivoPayload = CreateArquivoInput;
export type UpdateArquivoPayload = UpdateArquivoInput;

function buildQueryString(query: ArquivoQuery): string {
  const params = new URLSearchParams();
  if (query.departamentoId) params.set('departamentoId', query.departamentoId);
  if (query.status) params.set('status', query.status);
  if (query.ano) params.set('ano', String(query.ano));
  if (query.search) params.set('search', query.search);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useArquivos(query: ArquivoQuery = {}) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['arquivos', query],
    queryFn: () =>
      apiClient.get<PaginatedResult<ArquivoDto>>(`/arquivos${buildQueryString(query)}`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useArquivo(id: string | undefined) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['arquivos', 'detail', id],
    queryFn: () =>
      apiClient.get<ArquivoDto>(`/arquivos/${id}`, { token: session?.user?.accessToken }),
    enabled: !!session?.user?.accessToken && !!id,
  });
}

export function useCreateArquivo() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateArquivoPayload) =>
      apiClient.post<ArquivoDto>('/arquivos', payload, { token: session?.user?.accessToken }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['arquivos'] });
      toast.success('Arquivo criado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar arquivo';
      toast.error(message);
    },
  });
}

export function useUpdateArquivo() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateArquivoPayload }) =>
      apiClient.patch<ArquivoDto>(`/arquivos/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['arquivos'] });
      toast.success('Arquivo atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar arquivo';
      toast.error(message);
    },
  });
}

export function useEncerrarArquivo() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<ArquivoDto>(`/arquivos/${id}/encerrar`, undefined, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['arquivos'] });
      toast.success('Arquivo encerrado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao encerrar arquivo';
      toast.error(message);
    },
  });
}

export function useReabrirArquivo() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<ArquivoDto>(`/arquivos/${id}/reabrir`, undefined, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['arquivos'] });
      toast.success('Arquivo reaberto com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao reabrir arquivo';
      toast.error(message);
    },
  });
}

export function useDeleteArquivo() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/arquivos/${id}`, { token: session?.user?.accessToken }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['arquivos'] });
      toast.success('Arquivo removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover arquivo';
      toast.error(message);
    },
  });
}
