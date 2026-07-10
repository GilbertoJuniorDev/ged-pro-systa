'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { PublicDocumentDto, RegisterAccessInput } from '@/types';
import { useRegisterAccess } from '@/hooks/use-public-documents';
import { downloadPublicFile } from '@/lib/public-download';

const VISITANTE_STORAGE_KEY = 'ged:portal:visitante';

/** Lê os dados do último visitante cadastrado nesta sessão de navegador, se houver. */
export function readVisitante(): RegisterAccessInput | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(VISITANTE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Partial<RegisterAccessInput>;
    if (
      typeof candidate.email === 'string' &&
      typeof candidate.nome === 'string' &&
      typeof candidate.documento === 'string' &&
      (candidate.tipoDocumento === 'CPF' || candidate.tipoDocumento === 'CNPJ')
    ) {
      return {
        email: candidate.email,
        nome: candidate.nome,
        documento: candidate.documento,
        tipoDocumento: candidate.tipoDocumento,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Persiste os dados do visitante para pular a digitação em próximos downloads gated. */
export function saveVisitante(visitante: RegisterAccessInput): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VISITANTE_STORAGE_KEY, JSON.stringify(visitante));
}

/**
 * Orquestra o fluxo de download do portal público:
 * - Documento livre (`exigeCadastro=false`) → baixa direto, sem token.
 * - Documento com cadastro exigido + visitante já conhecido nesta sessão → reenvia os
 *   dados salvos ao backend (registra um novo lead — a chamada NUNCA é pulada, só a
 *   digitação) e baixa com o token retornado, sem reabrir o formulário.
 * - Documento com cadastro exigido + nenhum visitante salvo → expõe `pendingDocument`
 *   para o orquestrador abrir o `CadastroDownloadModal`.
 */
export function usePortalDownload() {
  const [pendingDocument, setPendingDocument] = useState<PublicDocumentDto | null>(null);
  const registerAccess = useRegisterAccess();

  const requestDownload = useCallback(
    (document: PublicDocumentDto) => {
      if (!document.exigeCadastro) {
        void downloadPublicFile(document.id, document.arquivoNome).catch(() => {
          toast.error('Erro ao baixar o arquivo.');
        });
        return;
      }

      const visitante = readVisitante();
      if (!visitante) {
        setPendingDocument(document);
        return;
      }

      registerAccess.mutate(
        { documentId: document.id, input: visitante },
        {
          onSuccess: ({ downloadToken }) => {
            void downloadPublicFile(document.id, document.arquivoNome, downloadToken).catch(() => {
              toast.error('Erro ao baixar o arquivo.');
            });
          },
        },
      );
    },
    [registerAccess],
  );

  const closeModal = useCallback(() => setPendingDocument(null), []);

  return {
    pendingDocument,
    requestDownload,
    closeModal,
    isReturningVisitorPending: registerAccess.isPending,
  };
}
