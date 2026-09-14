'use client';

import { Archive } from 'lucide-react';
import type { ArquivoDto } from '@/types';
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
import { localizacaoArquivo } from '@/lib/utils';
import { ArquivoStatusBadge } from '../arquivo-status-badge';

const ACTION_BTN =
  'cursor-pointer rounded-lg border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export interface ArquivosDataTableProps {
  arquivos: readonly ArquivoDto[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  filtersActive: boolean;
  nomeById: (departamentoId: string) => string;
  canManage: boolean;
  onRowClick: (arquivo: ArquivoDto) => void;
  onPageChange: (page: number) => void;
  onEdit: (arquivo: ArquivoDto) => void;
  onEncerrar: (arquivo: ArquivoDto) => void;
  onReabrir: (arquivo: ArquivoDto) => void;
  onDelete: (arquivo: ArquivoDto) => void;
}

export function ArquivosDataTable({
  arquivos,
  isLoading,
  total,
  page,
  limit,
  filtersActive,
  nomeById,
  canManage,
  onRowClick,
  onPageChange,
  onEdit,
  onEncerrar,
  onReabrir,
  onDelete,
}: ArquivosDataTableProps) {
  const abertos = arquivos.filter((a) => a.status === 'ABERTO').length;
  const fechados = arquivos.filter((a) => a.status === 'FECHADO').length;
  const columns = canManage ? 7 : 6;

  return (
    <>
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
          {canManage && <DataTableTh align="right">Ações</DataTableTh>}
        </DataTableHead>
        <DataTableBody>
          {isLoading ? (
            <TableSkeletonRows columns={columns} />
          ) : total === 0 ? (
            <tr>
              <td colSpan={columns}>
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
              <DataTableRow key={a.id} onClick={() => onRowClick(a)}>
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
                {canManage && (
                  <DataTableTd align="right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {a.status === 'ABERTO' ? (
                        <>
                          <button
                            onClick={() => onEdit(a)}
                            className={`${ACTION_BTN} border-indigo-300 text-indigo-600 hover:border-indigo-500 hover:text-indigo-800 dark:border-indigo-700 dark:text-indigo-300 dark:hover:border-indigo-500 dark:hover:text-indigo-100`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onEncerrar(a)}
                            className={`${ACTION_BTN} border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100`}
                          >
                            Encerrar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onReabrir(a)}
                          className={`${ACTION_BTN} border-emerald-300 text-emerald-600 hover:border-emerald-500 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 dark:hover:border-emerald-500 dark:hover:text-emerald-100`}
                        >
                          Reabrir
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(a)}
                        className={`${ACTION_BTN} border-rose-300 text-rose-600 hover:border-rose-500 hover:text-rose-800 dark:border-rose-800 dark:text-rose-400 dark:hover:border-rose-600 dark:hover:text-rose-200`}
                      >
                        Remover
                      </button>
                    </div>
                  </DataTableTd>
                )}
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>

      <Pagination
        total={total}
        page={page}
        limit={limit}
        onPageChange={onPageChange}
        itemLabel={['arquivo', 'arquivos']}
      />
    </>
  );
}
