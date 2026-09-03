'use client';

import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import type { DossieDto } from '@/types';
import { useDossies, useDeleteDossie } from '@/hooks/use-dossies';
import { useArquivos } from '@/hooks/use-arquivos';
import { useDepartmentFilter } from '@/hooks/use-department-filter';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { Combobox } from '@/components/ui/combobox';
import {
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableBody,
  DataTableRow,
  DataTableTd,
} from '@/components/ui/data-table';
import { TableSkeletonRows } from '@/components/ui/table-skeleton-rows';
import { StatTile } from '@/components/ui/stat-tile';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EditDossieDialog } from '../edit-dossie-dialog';

const PAGE_LIMIT = 20;
const ACTION_BTN =
  'cursor-pointer rounded-lg border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function DossiesPanel() {
  const { params, setParams, drillDossie } = useExplorerParams();
  const { isAdmin, options: departmentOptions, nomeById } = useDepartmentFilter(
    params.depto,
    (v) => setParams({ depto: v, page: undefined }),
  );

  const { data, isLoading, isError } = useDossies({
    departamentoId: params.depto || undefined,
    search: params.q || undefined,
    page: params.page,
    limit: PAGE_LIMIT,
  });
  const { data: arquivos } = useArquivos({ limit: 100 });
  const arquivoLabelById = new Map(
    (arquivos?.data ?? []).map((a) => [a.id, `${a.codigo} — ${a.nome}`]),
  );

  const deleteDossie = useDeleteDossie();
  const [editTarget, setEditTarget] = useState<DossieDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DossieDto | null>(null);

  if (isError) {
    return <p className="py-4 text-sm text-rose-500 dark:text-rose-400">Erro ao carregar dossiês.</p>;
  }

  const dossies = data?.data ?? [];
  const total = data?.total ?? 0;
  const ativos = dossies.filter((d) => d.isActive).length;
  const inativos = dossies.filter((d) => !d.isActive).length;
  const filtersActive = Boolean(params.q) || Boolean(params.depto);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="max-w-xs">
          <Combobox
            value={params.depto}
            onValueChange={(v) => setParams({ depto: v, page: undefined })}
            options={departmentOptions}
            placeholder="Todos os departamentos"
            disabled={!isAdmin}
          />
        </div>
      </div>

      {!isLoading && total > 0 && (
        <div className="mb-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Total" value={total} accent="text-slate-950 dark:text-slate-100" />
          <StatTile label="Ativos (página)" value={ativos} accent="text-emerald-500 dark:text-emerald-400" />
          <StatTile label="Inativos (página)" value={inativos} accent="text-slate-500" />
        </div>
      )}

      <DataTable>
        <DataTableHead>
          <DataTableTh>Nome</DataTableTh>
          <DataTableTh>Departamento</DataTableTh>
          <DataTableTh>Arquivo</DataTableTh>
          <DataTableTh>Status</DataTableTh>
          <DataTableTh align="right">Documentos</DataTableTh>
          <DataTableTh align="right">Ações</DataTableTh>
        </DataTableHead>
        <DataTableBody>
          {isLoading ? (
            <TableSkeletonRows columns={6} />
          ) : total === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={<FolderOpen className="h-8 w-8" strokeWidth={1.5} />}
                  title={
                    filtersActive
                      ? 'Nenhum dossiê encontrado com os filtros atuais.'
                      : 'Nenhum dossiê cadastrado.'
                  }
                  suggestions={
                    filtersActive
                      ? ['Verifique a ortografia', 'Remova o filtro de departamento']
                      : ['Crie o primeiro dossiê para agrupar documentos relacionados.']
                  }
                />
              </td>
            </tr>
          ) : (
            dossies.map((d) => (
              <DataTableRow key={d.id} onClick={() => drillDossie(d.arquivoId ?? undefined, d.id)}>
                <DataTableTd className="font-medium text-slate-900 dark:text-slate-200">{d.nome}</DataTableTd>
                <DataTableTd className="text-slate-600 dark:text-slate-400">{nomeById(d.departamentoId)}</DataTableTd>
                <DataTableTd className="text-slate-600 dark:text-slate-400">
                  {d.arquivoId ? (arquivoLabelById.get(d.arquivoId) ?? '—') : <span className="italic text-slate-500 dark:text-slate-600">Avulso</span>}
                </DataTableTd>
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
