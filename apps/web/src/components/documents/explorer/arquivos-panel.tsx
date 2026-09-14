'use client';

import { useState } from 'react';
import type { ArquivoDto, ArquivoStatus } from '@/types';
import {
  useArquivos,
  useDeleteArquivo,
  useEncerrarArquivo,
  useReabrirArquivo,
} from '@/hooks/use-arquivos';
import { useDepartmentFilter } from '@/hooks/use-department-filter';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { usePermissions } from '@/hooks/use-permissions';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArquivosDataTable } from '../arquivos/arquivos-data-table';
import { EditArquivoDialog } from '../edit-arquivo-dialog';

const PAGE_LIMIT = 20;

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: '', label: 'Todos os status' },
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'FECHADO', label: 'Fechado' },
];

export function ArquivosPanel() {
  const { params, setParams, drillArquivo } = useExplorerParams();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('ARQUIVOS_MANAGE');
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

      <ArquivosDataTable
        arquivos={arquivos}
        isLoading={isLoading}
        total={total}
        page={params.page}
        limit={PAGE_LIMIT}
        filtersActive={filtersActive}
        nomeById={nomeById}
        canManage={canManage}
        onRowClick={(a) => drillArquivo(a.id)}
        onPageChange={(p) => setParams({ page: p })}
        onEdit={setEditTarget}
        onEncerrar={setEncerrarTarget}
        onReabrir={setReabrirTarget}
        onDelete={setDeleteTarget}
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
