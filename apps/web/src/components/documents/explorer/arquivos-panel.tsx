'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import type { ArquivoDto, ArquivoStatus } from '@/types';
import {
  useArquivos,
  useDeleteArquivo,
  useEncerrarArquivo,
  useReabrirArquivo,
} from '@/hooks/use-arquivos';
import { useDepartmentFilter } from '@/hooks/use-department-filter';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
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
import { localizacaoArquivo } from '@/lib/utils';
import { ArquivoStatusBadge } from '../arquivo-status-badge';
import { EditArquivoDialog } from '../edit-arquivo-dialog';

const PAGE_LIMIT = 20;

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: '', label: 'Todos os status' },
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'FECHADO', label: 'Fechado' },
];

const ACTION_BTN =
  'cursor-pointer rounded-lg border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function ArquivosPanel() {
  const { params, setParams, drillArquivo } = useExplorerParams();
  const { isAdmin, options: departmentOptions, nomeById } = useDepartmentFilter(
    params.depto,
    (v) => setParams({ depto: v, page: undefined }),
  );

  const { data, isLoading, isError } = useArquivos({
    departamentoId: params.depto || undefined,
    status: (params.status || undefined) as ArquivoStatus | undefined,
    search: params.q || undefined,
    page: params.page,
    limit: PAGE_LIMIT,
  });

  const deleteArquivo = useDeleteArquivo();
  const encerrarArquivo = useEncerrarArquivo();
  const reabrirArquivo = useReabrirArquivo();

  const [editTarget, setEditTarget] = useState<ArquivoDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArquivoDto | null>(null);
  const [encerrarTarget, setEncerrarTarget] = useState<ArquivoDto | null>(null);
  const [reabrirTarget, setReabrirTarget] = useState<ArquivoDto | null>(null);

  if (isError) {
    return <p className="py-4 text-sm text-rose-500 dark:text-rose-400">Erro ao carregar arquivos.</p>;
  }

  const arquivos = data?.data ?? [];
  const total = data?.total ?? 0;
  const abertos = arquivos.filter((a) => a.status === 'ABERTO').length;
  const fechados = arquivos.filter((a) => a.status === 'FECHADO').length;
  const filtersActive = Boolean(params.q) || Boolean(params.status) || Boolean(params.depto);

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
        <div className="max-w-xs">
          <Combobox
            value={params.status}
            onValueChange={(v) => setParams({ status: v, page: undefined })}
            options={STATUS_OPTIONS}
            placeholder="Todos os status"
          />
        </div>
      </div>

      {!isLoading && total > 0 && (
        <div className="mb-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Total" value={total} accent="text-slate-950 dark:text-slate-100" />
          <StatTile label="Abertos (página)" value={abertos} accent="text-emerald-500 dark:text-emerald-400" />
          <StatTile label="Fechados (página)" value={fechados} accent="text-slate-500" />
        </div>
      )}

      <DataTable>
        <DataTableHead>
          <DataTableTh>Código</DataTableTh>
          <DataTableTh>Nome</DataTableTh>
          <DataTableTh>Departamento</DataTableTh>
          <DataTableTh>Localização</DataTableTh>
          <DataTableTh>Status</DataTableTh>
          <DataTableTh align="right">Dossiês</DataTableTh>
          <DataTableTh align="right">Ações</DataTableTh>
        </DataTableHead>
        <DataTableBody>
          {isLoading ? (
            <TableSkeletonRows columns={7} />
          ) : total === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={<Archive className="h-8 w-8" strokeWidth={1.5} />}
                  title={
                    filtersActive
                      ? 'Nenhum arquivo encontrado com os filtros atuais.'
                      : 'Nenhum arquivo cadastrado.'
                  }
                  suggestions={
                    filtersActive
                      ? ['Verifique a ortografia', 'Remova o filtro de status ou departamento']
                      : ['Crie o primeiro arquivo para organizar a guarda física dos documentos.']
                  }
                />
              </td>
            </tr>
          ) : (
            arquivos.map((a) => (
              <DataTableRow key={a.id} onClick={() => drillArquivo(a.id)}>
                <DataTableTd className="font-mono text-slate-700 dark:text-slate-300">{a.codigo}</DataTableTd>
                <DataTableTd className="font-medium text-slate-900 dark:text-slate-200">{a.nome}</DataTableTd>
                <DataTableTd className="text-slate-600 dark:text-slate-400">{nomeById(a.departamentoId)}</DataTableTd>
                <DataTableTd className="text-slate-600 dark:text-slate-400">{localizacaoArquivo(a)}</DataTableTd>
                <DataTableTd>
                  <ArquivoStatusBadge status={a.status} />
                </DataTableTd>
                <DataTableTd align="right" className="tabular-nums text-slate-600 dark:text-slate-400">
                  {a.dossiesCount}
                </DataTableTd>
                <DataTableTd align="right">
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {a.status === 'ABERTO' ? (
                      <>
                        <button
                          onClick={() => setEditTarget(a)}
                          className={`${ACTION_BTN} border-indigo-300 text-indigo-600 hover:border-indigo-500 hover:text-indigo-800 dark:border-indigo-700 dark:text-indigo-300 dark:hover:border-indigo-500 dark:hover:text-indigo-100`}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setEncerrarTarget(a)}
                          className={`${ACTION_BTN} border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100`}
                        >
                          Encerrar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setReabrirTarget(a)}
                        className={`${ACTION_BTN} border-emerald-300 text-emerald-600 hover:border-emerald-500 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 dark:hover:border-emerald-500 dark:hover:text-emerald-100`}
                      >
                        Reabrir
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(a)}
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
        itemLabel={['arquivo', 'arquivos']}
      />

      {editTarget && <EditArquivoDialog arquivo={editTarget} onClose={() => setEditTarget(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          title="Remover arquivo?"
          description={`O arquivo "${deleteTarget.codigo} — ${deleteTarget.nome}" será removido. Isso só é possível se não houver dossiês vinculados a ele.`}
          confirmLabel="Remover"
          pendingLabel="Removendo…"
          tone="danger"
          isPending={deleteArquivo.isPending}
          onConfirm={() => deleteArquivo.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {encerrarTarget && (
        <ConfirmDialog
          title="Encerrar arquivo?"
          description={`O arquivo "${encerrarTarget.codigo} — ${encerrarTarget.nome}" será encerrado. Não será mais possível editá-lo ou vincular novos dossiês até reabri-lo.`}
          confirmLabel="Encerrar"
          pendingLabel="Encerrando…"
          isPending={encerrarArquivo.isPending}
          onConfirm={() => encerrarArquivo.mutate(encerrarTarget.id, { onSettled: () => setEncerrarTarget(null) })}
          onCancel={() => setEncerrarTarget(null)}
        />
      )}

      {reabrirTarget && (
        <ConfirmDialog
          title="Reabrir arquivo?"
          description={`O arquivo "${reabrirTarget.codigo} — ${reabrirTarget.nome}" voltará a aceitar edições e novos dossiês.`}
          confirmLabel="Reabrir"
          pendingLabel="Reabrindo…"
          isPending={reabrirArquivo.isPending}
          onConfirm={() => reabrirArquivo.mutate(reabrirTarget.id, { onSettled: () => setReabrirTarget(null) })}
          onCancel={() => setReabrirTarget(null)}
        />
      )}
    </>
  );
}
