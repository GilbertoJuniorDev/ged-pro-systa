'use client';

import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import type { DossieDto } from '@/types';
import { useDossies, useDeleteDossie } from '@/hooks/use-dossies';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import {
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableBody,
  DataTableRow,
  DataTableTd,
} from '@/components/ui/data-table';
import { TableSkeletonRows } from '@/components/ui/table-skeleton-rows';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EditDossieDialog } from '../edit-dossie-dialog';
import { CreateDossieDialog } from '../create-dossie-dialog';

const PAGE_LIMIT = 20;
const ACTION_BTN =
  'cursor-pointer rounded-lg border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function ArquivoDossiesPanel({ arquivoId }: { arquivoId: string }) {
  const { params, setParams, drillDossie } = useExplorerParams();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError } = useDossies({
    arquivoId,
    search: params.q || undefined,
    page: params.page,
    limit: PAGE_LIMIT,
  });

  const deleteDossie = useDeleteDossie();
  const [editTarget, setEditTarget] = useState<DossieDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DossieDto | null>(null);

  if (isError) {
    return <p className="py-4 text-sm text-rose-500 dark:text-rose-400">Erro ao carregar dossiês.</p>;
  }

  const dossies = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          + Vincular dossiê
        </button>
      </div>

      <DataTable>
        <DataTableHead>
          <DataTableTh>Nome</DataTableTh>
          <DataTableTh>Descrição</DataTableTh>
          <DataTableTh>Status</DataTableTh>
          <DataTableTh align="right">Documentos</DataTableTh>
          <DataTableTh align="right">Ações</DataTableTh>
        </DataTableHead>
        <DataTableBody>
          {isLoading ? (
            <TableSkeletonRows columns={5} />
          ) : total === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState
                  icon={<FolderOpen className="h-8 w-8" strokeWidth={1.5} />}
                  title={
                    params.q
                      ? 'Nenhum dossiê encontrado com os filtros atuais.'
                      : 'Nenhum dossiê vinculado a este arquivo.'
                  }
                  suggestions={params.q ? undefined : ['Vincule um dossiê já existente ou crie um novo.']}
                />
              </td>
            </tr>
          ) : (
            dossies.map((d) => (
              <DataTableRow key={d.id} onClick={() => drillDossie(arquivoId, d.id)}>
                <DataTableTd className="font-medium text-slate-900 dark:text-slate-200">{d.nome}</DataTableTd>
                <DataTableTd className="text-slate-600 dark:text-slate-400">{d.descricao ?? '—'}</DataTableTd>
                <DataTableTd>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      d.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {d.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </DataTableTd>
                <DataTableTd align="right" className="tabular-nums text-slate-600 dark:text-slate-400">
                  {d.documentsCount}
                </DataTableTd>
                <DataTableTd align="right">
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEditTarget(d)}
                      className={`${ACTION_BTN} border-indigo-300 text-indigo-600 hover:border-indigo-500 hover:text-indigo-800 dark:border-indigo-700 dark:text-indigo-300 dark:hover:border-indigo-500 dark:hover:text-indigo-100`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteTarget(d)}
                      className={`${ACTION_BTN} border-rose-300 text-rose-600 hover:border-rose-500 hover:text-rose-800 dark:border-rose-800 dark:text-rose-400 dark:hover:border-rose-600 dark:hover:text-rose-200`}
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

      <Pagination
        total={total}
        page={params.page}
        limit={PAGE_LIMIT}
        onPageChange={(p) => setParams({ page: p })}
        itemLabel={['dossiê', 'dossiês']}
      />

      {showCreate && <CreateDossieDialog onClose={() => setShowCreate(false)} />}
      {editTarget && <EditDossieDialog dossie={editTarget} onClose={() => setEditTarget(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          title="Remover dossiê?"
          description={`O dossiê "${deleteTarget.nome}" será removido permanentemente.`}
          confirmLabel="Remover"
          pendingLabel="Removendo…"
          tone="danger"
          isPending={deleteDossie.isPending}
          onConfirm={() => deleteDossie.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
