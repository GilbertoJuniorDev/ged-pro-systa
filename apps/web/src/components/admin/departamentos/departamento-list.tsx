'use client';

import { useState } from 'react';
import type { DepartmentDto } from '@/types';
import { useDepartments, useDeleteDepartment } from '@/hooks/use-departments';
import { EditDepartamentoDialog } from './edit-departamento-dialog';

interface DeleteConfirmProps {
  departamento: DepartmentDto;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ departamento, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-foreground font-semibold mb-1">Remover departamento?</p>
        <p className="text-muted-foreground text-sm mb-6">
          O departamento <span className="text-foreground font-medium">&quot;{departamento.nome}&quot;</span> será removido.
          Usuários vinculados perderão o vínculo com este departamento.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-danger hover:bg-danger/90 text-background rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Removendo…' : 'Remover'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-border animate-pulse" style={{ width: i === 1 ? '50%' : '70%' }} />
        </td>
      ))}
    </tr>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  accent: string;
}

function StatTile({ label, value, accent }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border bg-foreground/5 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export function DepartamentoList() {
  const { data: departamentos, isLoading, isError } = useDepartments();
  const deleteDepartamento = useDeleteDepartment();
  const [editTarget, setEditTarget] = useState<DepartmentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentDto | null>(null);

  if (isError) {
    return <p className="text-danger text-sm py-4">Erro ao carregar departamentos.</p>;
  }

  const total = departamentos?.length ?? 0;
  const ativos = departamentos?.filter((d) => d.isActive).length ?? 0;
  const inativos = total - ativos;

  return (
    <>
      {!isLoading && total > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          <StatTile label="Total" value={total} accent="text-foreground" />
          <StatTile label="Ativos" value={ativos} accent="text-success" />
          <StatTile label="Inativos" value={inativos} accent="text-muted-foreground" />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-foreground/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : total === 0
                ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01" />
                        </svg>
                        <p>Nenhum departamento cadastrado.</p>
                        <p className="text-xs text-muted-foreground">Crie o primeiro departamento para organizar os usuários por setor.</p>
                      </div>
                    </td>
                  </tr>
                )
                : departamentos?.map((d) => (
                  <tr key={d.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{d.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.descricao ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.isActive
                            ? 'ring-1 ring-inset ring-success/40 text-success'
                            : 'bg-foreground/10 text-muted-foreground'
                        }`}
                      >
                        {d.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(d)}
                          className="px-3 py-1 text-xs text-primary hover:text-primary-hover border border-primary/40 hover:border-primary rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="px-3 py-1 text-xs text-danger border border-danger/30 hover:border-danger rounded-lg transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditDepartamentoDialog departamento={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {deleteTarget && (
        <DeleteConfirm
          departamento={deleteTarget}
          isPending={deleteDepartamento.isPending}
          onConfirm={() => {
            deleteDepartamento.mutate(deleteTarget.id, {
              onSettled: () => setDeleteTarget(null),
            });
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
