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
          <StatTile label="Total" value={total} accent="text-foreground" />
          <StatTile label="Abertos (página)" value={abertos} accent="text-success" />
          <StatTile label="Fechados (página)" value={fechados} accent="text-muted-foreground" />
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
                <DataTableTd className="font-mono text-muted-foreground">{a.codigo}</DataTableTd>
                <DataTableTd className="font-medium text-foreground">{a.nome}</DataTableTd>
                <DataTableTd className="text-muted-foreground">{nomeById(a.departamentoId)}</DataTableTd>
                <DataTableTd className="text-muted-foreground">{localizacaoArquivo(a)}</DataTableTd>
                <DataTableTd>
                  <ArquivoStatusBadge status={a.status} />
                </DataTableTd>
                <DataTableTd align="right" className="tabular-nums text-muted-foreground">
                  {a.dossiesCount}
                </DataTableTd>
                {canManage && (
                  <DataTableTd align="right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {a.status === 'ABERTO' ? (
                        <>
                          <button
                            onClick={() => onEdit(a)}
                            className={`${ACTION_BTN} border-primary/40 text-primary hover:border-primary hover:text-primary-hover`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onEncerrar(a)}
                            className={`${ACTION_BTN} border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground`}
                          >
                            Encerrar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onReabrir(a)}
                          className={`${ACTION_BTN} border-success/40 text-success hover:border-success`}
                        >
                          Reabrir
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(a)}
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
        itemLabel={['arquivo', 'arquivos']}
      />
    </>
  );
}
