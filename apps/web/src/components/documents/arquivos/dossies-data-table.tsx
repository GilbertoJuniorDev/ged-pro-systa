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
                <DataTableTd className="font-medium text-foreground">{d.nome}</DataTableTd>
                <DataTableTd className="text-muted-foreground">{d.descricao ?? '—'}</DataTableTd>
                <DataTableTd>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      d.isActive
                        ? 'bg-success/10 text-success'
                        : 'bg-foreground/5 text-muted-foreground'
                    }`}
                  >
                    {d.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </DataTableTd>
                <DataTableTd align="right" className="tabular-nums text-muted-foreground">
                  {d.documentsCount}
                </DataTableTd>
                {canManage && (
                  <DataTableTd align="right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(d)}
                        className={`${ACTION_BTN} border-primary/40 text-primary hover:border-primary hover:text-primary-hover`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(d)}
                        className={`${ACTION_BTN} border-danger/40 text-danger hover:border-danger`}
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
