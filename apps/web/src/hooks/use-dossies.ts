'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { DossieDto, DossieQuery, PaginatedResult, UpsertDossieInput } from '../types';

export type CreateDossiePayload = UpsertDossieInput;

export interface UpdateDossiePayload {
  nome?: string;
  descricao?: string | null;
  isActive?: boolean;
  arquivoId?: string | null;
}

function buildQueryString(query: DossieQuery): string {
  const params = new URLSearchParams();
  if (query.departamentoId) params.set('departamentoId', query.departamentoId);
  if (query.arquivoId) params.set('arquivoId', query.arquivoId);
  if (query.semArquivo) params.set('semArquivo', 'true');
  if (query.search) params.set('search', query.search);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useDossies(query: DossieQuery = {}) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['dossies', query],
    queryFn: () =>
      apiClient.get<PaginatedResult<DossieDto>>(`/dossies${buildQueryString(query)}`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useDossie(id: string | undefined) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['dossies', 'detail', id],
    queryFn: () => apiClient.get<DossieDto>(`/dossies/${id}`, { token: session?.user?.accessToken }),
    enabled: !!session?.user?.accessToken && !!id,
  });
}

// Lista simples de dossiês para preencher um Combobox (ex.: formulário de upload, seletor de
// dossiê ao criar/editar arquivo). Embrulha useDossies e desembrulha `.data` — quem consome só
// quer o array, não a paginação.
export function useDossieOptions(departamentoId?: string) {
  const query = useDossies({ departamentoId, limit: 100 });
  return { ...query, data: query.data?.data };
}

export function useCreateDossie() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDossiePayload) =>
      apiClient.post<DossieDto>('/dossies', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dossies'] });
      toast.success('Dossiê criado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar dossiê';
      toast.error(message);
    },
  });
}

export function useUpdateDossie() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDossiePayload }) =>
      apiClient.patch<DossieDto>(`/dossies/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dossies'] });
      toast.success('Dossiê atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar dossiê';
      toast.error(message);
    },
  });
}

export function useDeleteDossie() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/dossies/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dossies'] });
      toast.success('Dossiê removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover dossiê';
      toast.error(message);
    },
  });
}
