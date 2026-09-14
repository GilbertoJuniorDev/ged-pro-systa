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
  PUBLICO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  RESTRITO: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CONFIDENCIAL: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
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
                    className="font-medium text-slate-900 transition-colors hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300"
                  >
                    {doc.nome}
                  </Link>
                </DataTableTd>
                <DataTableTd className="text-slate-600 dark:text-slate-400">
                  {doc.departamentoId ? (
                    departamentoNomeById(doc.departamentoId)
                  ) : (
                    <span className="italic text-slate-500 dark:text-slate-600">Não classificado</span>
                  )}
                </DataTableTd>
                {showDossieColumn && (
                  <DataTableTd className="text-slate-600 dark:text-slate-400">
                    {doc.dossieId ? (
                      <button
                        onClick={() => drillDossie(undefined, doc.dossieId as string)}
                        className="cursor-pointer text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        Ver dossiê →
                      </button>
                    ) : (
                      <span className="italic text-slate-500 dark:text-slate-600">Avulso</span>
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
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    {FASE_LABEL[doc.fase]}
                  </span>
                </DataTableTd>
                <DataTableTd align="right" className="tabular-nums text-slate-600 dark:text-slate-400">
                  {formatBytes(doc.arquivoTamanho)}
                </DataTableTd>
                <DataTableTd align="right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => downloadDocument.mutate({ id: doc.id, filename: doc.arquivoNome })}
                      disabled={downloadDocument.isPending}
                      className="cursor-pointer rounded-lg border border-indigo-300 px-3 py-1 text-xs text-indigo-600 transition-colors hover:border-indigo-500 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:border-indigo-500 dark:hover:text-indigo-100"
                    >
                      Baixar
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => setEditTarget(doc)}
                        className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="cursor-pointer rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-600 transition-colors hover:border-rose-500 hover:text-rose-800 dark:border-rose-800 dark:text-rose-400 dark:hover:border-rose-600 dark:hover:text-rose-200"
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
