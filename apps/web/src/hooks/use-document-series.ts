'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { DestinacaoFinal, DocumentSeriesDto, UpsertDocumentSeriesInput } from '../types';

export type CreateDocumentSeriesPayload = UpsertDocumentSeriesInput;

export interface UpdateDocumentSeriesPayload {
  codigo?: string;
  nome?: string;
  descricao?: string | null;
  prazoCorrenteMeses?: number;
  prazoIntermediarioMeses?: number;
  destinacaoFinal?: DestinacaoFinal;
  baseLegal?: string | null;
  isActive?: boolean;
  seriePaiId?: string | null;
}

export function useDocumentSeries(departamentoId?: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['document-series', departamentoId ?? null],
    queryFn: () =>
      apiClient.get<DocumentSeriesDto[]>(
        `/document-series${departamentoId ? `?departamentoId=${departamentoId}` : ''}`,
        { token: session?.user?.accessToken },
      ),
    enabled: !!session?.user?.accessToken,
  });
}

export function useCreateDocumentSeries() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDocumentSeriesPayload) =>
      apiClient.post<DocumentSeriesDto>('/document-series', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['document-series'] });
      toast.success('Série criada com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao criar série';
      toast.error(message);
    },
  });
}

export function useUpdateDocumentSeries() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentSeriesPayload }) =>
      apiClient.patch<DocumentSeriesDto>(`/document-series/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['document-series'] });
      toast.success('Série atualizada com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar série';
      toast.error(message);
    },
  });
}

export function useDeleteDocumentSeries() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/document-series/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['document-series'] });
      toast.success('Série removida com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover série';
      toast.error(message);
    },
  });
}
