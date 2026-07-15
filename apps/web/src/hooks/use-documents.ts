'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { downloadFile } from '../lib/download';
import type {
  Confidencialidade,
  DocumentDto,
  DocumentFase,
  UpdateDocumentInput,
} from '../types';

export interface DocumentFilters {
  departamentoId?: string;
  dossieId?: string;
  serieId?: string;
  fase?: DocumentFase;
  confidencialidade?: Confidencialidade;
  page?: number;
  limit?: number;
}

export interface PaginatedDocuments {
  data: DocumentDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UploadDocumentPayload {
  file: File;
  nome: string;
  descricao?: string | null;
  validade?: string | null;
  confidencialidade: Confidencialidade;
  departamentoId: string;
  serieId: string;
  dossieId?: string | null;
  destaque?: boolean;
  exigeCadastro?: boolean;
  accessDepartamentoIds?: string[];
  accessUserIds?: string[];
}

function buildQueryString(filters: DocumentFilters): string {
  const params = new URLSearchParams();
  if (filters.departamentoId) params.set('departamentoId', filters.departamentoId);
  if (filters.dossieId) params.set('dossieId', filters.dossieId);
  if (filters.serieId) params.set('serieId', filters.serieId);
  if (filters.fase) params.set('fase', filters.fase);
  if (filters.confidencialidade) params.set('confidencialidade', filters.confidencialidade);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useDocuments(filters: DocumentFilters = {}) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () =>
      apiClient.get<PaginatedDocuments>(`/documents${buildQueryString(filters)}`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}

export function useDocument(id: string | undefined) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['documents', 'detail', id],
    queryFn: () =>
      apiClient.get<DocumentDto>(`/documents/${id}`, {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken && !!id,
  });
}

export function useUploadDocument() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadDocumentPayload) => {
      const formData = new FormData();
      formData.append('arquivo', payload.file);
      formData.append('nome', payload.nome);
      if (payload.descricao) formData.append('descricao', payload.descricao);
      if (payload.validade) formData.append('validade', payload.validade);
      formData.append('confidencialidade', payload.confidencialidade);
      formData.append('departamentoId', payload.departamentoId);
      formData.append('serieId', payload.serieId);
      if (payload.dossieId) formData.append('dossieId', payload.dossieId);
      if (payload.destaque !== undefined) formData.append('destaque', String(payload.destaque));
      if (payload.exigeCadastro !== undefined) formData.append('exigeCadastro', String(payload.exigeCadastro));
      // `[]` suffix (not a bare repeated key): the API's multer stack (multer -> append-field)
      // only turns a repeated *bare* key into an array starting from its 2nd occurrence — a
      // single value stays a raw string, which would fail CreateDocumentDto's
      // `@IsUUID('all', { each: true })`. The `field[]` suffix always yields an array, even
      // for exactly one value (verified against append-field@1.0.0, the version this repo's
      // multer@1.4.5-lts.x pulls in) — and a single value is the common case here (e.g. a
      // Confidencial document with only the acting user granted).
      if (payload.accessDepartamentoIds) {
        payload.accessDepartamentoIds.forEach((id) => formData.append('accessDepartamentoIds[]', id));
      }
      if (payload.accessUserIds) {
        payload.accessUserIds.forEach((id) => formData.append('accessUserIds[]', id));
      }

      return apiClient.post<DocumentDto>('/documents', formData, {
        token: session?.user?.accessToken,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao enviar documento';
      toast.error(message);
    },
  });
}

export function useUpdateDocument() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentInput }) =>
      apiClient.patch<DocumentDto>(`/documents/${id}`, payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento atualizado com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar documento';
      toast.error(message);
    },
  });
}

export function useDeleteDocument() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/documents/${id}`, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento removido com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao remover documento';
      toast.error(message);
    },
  });
}

export function useTransferDocument() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<DocumentDto>(`/documents/${id}/transferir`, undefined, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento transferido para a fase intermediária!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao transferir documento';
      toast.error(message);
    },
  });
}

export function useDownloadDocument() {
  const { data: session } = useSession();

  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      downloadFile(`/documents/${id}/download`, session?.user?.accessToken, filename),
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao baixar documento';
      toast.error(message);
    },
  });
}
