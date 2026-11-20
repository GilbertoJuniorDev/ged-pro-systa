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
    return <p className="py-4 text-sm text-danger">Erro ao carregar dossiês.</p>;
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
          <StatTile label="Total" value={total} accent="text-foreground" />
          <StatTile label="Ativos (página)" value={ativos} accent="text-success" />
          <StatTile label="Inativos (página)" value={inativos} accent="text-muted-foreground" />
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
                <DataTableTd className="font-medium text-foreground">{d.nome}</DataTableTd>
                <DataTableTd className="text-muted-foreground">{nomeById(d.departamentoId)}</DataTableTd>
                <DataTableTd className="text-muted-foreground">
                  {d.arquivoId ? (arquivoLabelById.get(d.arquivoId) ?? '—') : <span className="italic text-muted-foreground">Avulso</span>}
                </DataTableTd>
                <DataTableTd>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      d.isActive
                        ? 'ring-1 ring-inset ring-success/40 text-success'
                        : 'bg-foreground/5 text-muted-foreground'
                    }`}
                  >
                    {d.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </DataTableTd>
                <DataTableTd align="right" className="tabular-nums text-muted-foreground">
                  {d.documentsCount}
                </DataTableTd>
                <DataTableTd align="right">
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEditTarget(d)}
                      className={`${ACTION_BTN} border-primary/40 text-primary hover:border-primary hover:text-primary-hover`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteTarget(d)}
                      className={`${ACTION_BTN} border-danger/40 text-danger hover:border-danger`}
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
