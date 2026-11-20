'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileStack } from 'lucide-react';
import type { Confidencialidade, DocumentDto, DocumentFase } from '@/types';
import { useDeleteDocument, useDownloadDocument } from '@/hooks/use-documents';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { usePermissions } from '@/hooks/use-permissions';
import {
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableBody,
  DataTableRow,
  DataTableTd,
} from '@/components/ui/data-table';
import { TableSkeletonRows } from '@/components/ui/table-skeleton-rows';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EditDocumentClassificationDialog } from '@/components/documents/edit-document-classification-dialog';
import { formatBytes } from '@/lib/utils';

const CONFIDENCIALIDADE_BADGE: Record<Confidencialidade, string> = {
  PUBLICO: 'bg-foreground/5 text-muted-foreground',
  RESTRITO: 'bg-warning/10 text-warning',
  CONFIDENCIAL: 'bg-danger/10 text-danger',
};

const CONFIDENCIALIDADE_LABEL: Record<Confidencialidade, string> = {
  PUBLICO: 'Público',
  RESTRITO: 'Restrito',
  CONFIDENCIAL: 'Confidencial',
};

const FASE_LABEL: Record<DocumentFase, string> = {
  CORRENTE: 'Corrente',
  INTERMEDIARIO: 'Intermediário',
};

interface Props {
  documents: readonly DocumentDto[];
  isLoading: boolean;
  departamentoNomeById: (departamentoId: string) => string;
  showDossieColumn?: boolean;
  emptyTitle: string;
  emptySuggestions?: readonly string[];
}

export function DocumentsTable({
  documents,
  isLoading,
  departamentoNomeById,
  showDossieColumn = true,
  emptyTitle,
  emptySuggestions,
}: Props) {
  const { drillDossie } = useExplorerParams();
  const downloadDocument = useDownloadDocument();
  const deleteDocument = useDeleteDocument();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('DOCUMENTS_EDIT');
  const [deleteTarget, setDeleteTarget] = useState<DocumentDto | null>(null);
  const [editTarget, setEditTarget] = useState<DocumentDto | null>(null);

  const columns = showDossieColumn ? 7 : 6;

  return (
    <>
      <DataTable>
        <DataTableHead>
          <DataTableTh>Nome</DataTableTh>
          <DataTableTh>Departamento</DataTableTh>
          {showDossieColumn && <DataTableTh>Dossiê</DataTableTh>}
          <DataTableTh>Confidencialidade</DataTableTh>
          <DataTableTh>Fase</DataTableTh>
          <DataTableTh align="right">Tamanho</DataTableTh>
          <DataTableTh align="right">Ações</DataTableTh>
        </DataTableHead>
        <DataTableBody>
          {isLoading ? (
            <TableSkeletonRows columns={columns} />
          ) : documents.length === 0 ? (
            <tr>
              <td colSpan={columns}>
                <EmptyState
                  icon={<FileStack className="h-8 w-8" strokeWidth={1.5} />}
                  title={emptyTitle}
                  suggestions={emptySuggestions}
                />
              </td>
            </tr>
          ) : (
            documents.map((doc) => (
              <DataTableRow key={doc.id}>
                <DataTableTd>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="font-medium text-foreground transition-colors hover:text-primary-hover"
                  >
                    {doc.nome}
                  </Link>
                </DataTableTd>
                <DataTableTd className="text-muted-foreground">
                  {doc.departamentoId ? (
                    departamentoNomeById(doc.departamentoId)
                  ) : (
                    <span className="italic text-muted-foreground">Não classificado</span>
                  )}
                </DataTableTd>
                {showDossieColumn && (
                  <DataTableTd className="text-muted-foreground">
                    {doc.dossieId ? (
                      <button
                        onClick={() => drillDossie(undefined, doc.dossieId as string)}
                        className="cursor-pointer text-primary transition-colors hover:text-primary-hover"
                      >
                        Ver dossiê →
                      </button>
                    ) : (
                      <span className="italic text-muted-foreground">Avulso</span>
                    )}
                  </DataTableTd>
                )}
                <DataTableTd>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCIALIDADE_BADGE[doc.confidencialidade]}`}
                  >
                    {CONFIDENCIALIDADE_LABEL[doc.confidencialidade]}
                  </span>
                </DataTableTd>
                <DataTableTd>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      doc.fase === 'CORRENTE'
                        ? 'bg-primary-soft text-primary'
                        : 'bg-foreground/5 text-muted-foreground'
                    }`}
                  >
                    {FASE_LABEL[doc.fase]}
                  </span>
                </DataTableTd>
                <DataTableTd align="right" className="tabular-nums text-muted-foreground">
                  {formatBytes(doc.arquivoTamanho)}
                </DataTableTd>
                <DataTableTd align="right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => downloadDocument.mutate({ id: doc.id, filename: doc.arquivoNome })}
                      disabled={downloadDocument.isPending}
                      className="cursor-pointer rounded-lg border border-primary/40 px-3 py-1 text-xs text-primary transition-colors hover:border-primary hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Baixar
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => setEditTarget(doc)}
                        className="cursor-pointer rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="cursor-pointer rounded-lg border border-danger/40 px-3 py-1 text-xs text-danger transition-colors hover:border-danger"
                    >
                      Remover
                    </button>
                  </div>
                </DataTableTd>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>

      {deleteTarget && (
        <ConfirmDialog
          title="Remover documento?"
          description={`O documento "${deleteTarget.nome}" e o arquivo enviado serão removidos permanentemente.`}
          confirmLabel="Remover"
          pendingLabel="Removendo…"
          tone="danger"
          isPending={deleteDocument.isPending}
          onConfirm={() => deleteDocument.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {editTarget && (
        <EditDocumentClassificationDialog document={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </>
  );
}
