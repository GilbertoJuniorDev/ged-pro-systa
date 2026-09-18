'use client';

import { FolderOpen } from 'lucide-react';
import type { DossieDto } from '@/types';
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

const ACTION_BTN =
  'cursor-pointer rounded-lg border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export interface DossiesDataTableProps {
  dossies: readonly DossieDto[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  searchActive: boolean;
  canManage: boolean;
  emptyTitle?: string;
  emptySuggestions?: readonly string[];
  onRowClick: (dossie: DossieDto) => void;
  onPageChange: (page: number) => void;
  onEdit: (dossie: DossieDto) => void;
  onDelete: (dossie: DossieDto) => void;
}

export function DossiesDataTable({
  dossies,
  isLoading,
  total,
  page,
  limit,
  searchActive,
  canManage,
  emptyTitle,
  emptySuggestions,
  onRowClick,
  onPageChange,
  onEdit,
  onDelete,
}: DossiesDataTableProps) {
  const columns = canManage ? 5 : 4;

  return (
    <>
      <DataTable>
        <DataTableHead>
          <DataTableTh>Nome</DataTableTh>
          <DataTableTh>Descrição</DataTableTh>
          <DataTableTh>Status</DataTableTh>
          <DataTableTh align="right">Documentos</DataTableTh>
          {canManage && <DataTableTh align="right">Ações</DataTableTh>}
        </DataTableHead>
        <DataTableBody>
          {isLoading ? (
            <TableSkeletonRows columns={columns} />
          ) : total === 0 ? (
            <tr>
              <td colSpan={columns}>
                <EmptyState
                  icon={<FolderOpen className="h-8 w-8" strokeWidth={1.5} />}
                  title={
                    searchActive
                      ? 'Nenhum dossiê encontrado com os filtros atuais.'
                      : (emptyTitle ?? 'Nenhum dossiê vinculado a este arquivo.')
                  }
                  suggestions={
                    searchActive
                      ? undefined
                      : (emptySuggestions ?? ['Vincule um dossiê já existente ou crie um novo.'])
                  }
                />
              </td>
            </tr>
          ) : (
            dossies.map((d) => (
              <DataTableRow key={d.id} onClick={() => onRowClick(d)}>
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
                {canManage && (
                  <DataTableTd align="right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(d)}
                        className={`${ACTION_BTN} border-indigo-300 text-indigo-600 hover:border-indigo-500 hover:text-indigo-800 dark:border-indigo-700 dark:text-indigo-300 dark:hover:border-indigo-500 dark:hover:text-indigo-100`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(d)}
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
        itemLabel={['dossiê', 'dossiês']}
      />
    </>
  );
}
