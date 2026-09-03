'use client';

import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import type { DossieDto } from '@/types';
import { useDocuments } from '@/hooks/use-documents';
import { useDossies, useDeleteDossie } from '@/hooks/use-dossies';
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
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EditDossieDialog } from '../edit-dossie-dialog';
import { DocumentsTable } from './documents-table';

const PAGE_LIMIT = 20;
const ACTION_BTN =
  'cursor-pointer rounded-lg border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const SUB_TABS: readonly { value: 'documentos' | 'dossies'; label: string }[] = [
  { value: 'documentos', label: 'Documentos avulsos' },
  { value: 'dossies', label: 'Dossiês avulsos' },
];

export function AvulsosPanel() {
  const { params, setParams } = useExplorerParams();
  const { isAdmin, options: departmentOptions, nomeById } = useDepartmentFilter(
    params.depto,
    (v) => setParams({ depto: v, page: undefined }),
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setParams({ avulsos: tab.value, page: undefined })}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                params.avulsos === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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

      {params.avulsos === 'documentos' ? (
        <AvulsosDocumentos departamentoId={params.depto} search={params.q} nomeById={nomeById} />
      ) : (
        <AvulsosDossies departamentoId={params.depto} search={params.q} nomeById={nomeById} />
      )}
    </>
  );
}

function AvulsosDocumentos({
  departamentoId,
  search,
  nomeById,
}: {
  departamentoId: string;
  search: string;
  nomeById: (id: string) => string;
}) {
  const { params, setParams } = useExplorerParams();
  const { data, isLoading, isError } = useDocuments({
    departamentoId: departamentoId || undefined,
    semDossie: true,
    search: search || undefined,
    page: params.page,
    limit: PAGE_LIMIT,
  });

  if (isError) {
    return <p className="py-4 text-sm text-rose-500 dark:text-rose-400">Erro ao carregar documentos.</p>;
  }

  const documentos = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <DocumentsTable
        documents={documentos}
        isLoading={isLoading}
        departamentoNomeById={nomeById}
        showDossieColumn={false}
        emptyTitle={search ? 'Nenhum documento avulso encontrado.' : 'Nenhum documento avulso.'}
        emptySuggestions={search ? undefined : ['Todo documento enviado está vinculado a um dossiê.']}
      />
      <Pagination
        total={total}
        page={params.page}
        limit={PAGE_LIMIT}
        onPageChange={(p) => setParams({ page: p })}
        itemLabel={['documento avulso', 'documentos avulsos']}
      />
    </>
  );
}

function AvulsosDossies({
  departamentoId,
  search,
  nomeById,
}: {
  departamentoId: string;
  search: string;
  nomeById: (id: string) => string;
}) {
  const { params, setParams, drillDossie } = useExplorerParams();
  const { data, isLoading, isError } = useDossies({
    departamentoId: departamentoId || undefined,
    semArquivo: true,
    search: search || undefined,
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
      <DataTable>
        <DataTableHead>
          <DataTableTh>Nome</DataTableTh>
          <DataTableTh>Departamento</DataTableTh>
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
                  title={search ? 'Nenhum dossiê avulso encontrado.' : 'Nenhum dossiê avulso.'}
                  suggestions={search ? undefined : ['Todo dossiê cadastrado está vinculado a um arquivo.']}
                />
              </td>
            </tr>
          ) : (
            dossies.map((d) => (
              <DataTableRow key={d.id} onClick={() => drillDossie(undefined, d.id)}>
                <DataTableTd className="font-medium text-slate-900 dark:text-slate-200">{d.nome}</DataTableTd>
                <DataTableTd className="text-slate-600 dark:text-slate-400">{nomeById(d.departamentoId)}</DataTableTd>
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
        itemLabel={['dossiê avulso', 'dossiês avulsos']}
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
