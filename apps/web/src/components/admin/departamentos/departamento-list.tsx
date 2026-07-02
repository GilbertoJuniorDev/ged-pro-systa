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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-slate-100 font-semibold mb-1">Remover departamento?</p>
        <p className="text-slate-400 text-sm mb-6">
          O departamento <span className="text-slate-200 font-medium">&quot;{departamento.nome}&quot;</span> será removido.
          Usuários vinculados perderão o vínculo com este departamento.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors disabled:opacity-50"
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
    <tr className="border-b border-slate-800">
      {Array.from({ length: 4 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-800 animate-pulse" style={{ width: i === 1 ? '50%' : '70%' }} />
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
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
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
    return <p className="text-rose-400 text-sm py-4">Erro ao carregar departamentos.</p>;
  }

  const total = departamentos?.length ?? 0;
  const ativos = departamentos?.filter((d) => d.isActive).length ?? 0;
  const inativos = total - ativos;

  return (
    <>
      {!isLoading && total > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          <StatTile label="Total" value={total} accent="text-slate-100" />
          <StatTile label="Ativos" value={ativos} accent="text-emerald-400" />
          <StatTile label="Inativos" value={inativos} accent="text-slate-500" />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : total === 0
                ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01" />
                        </svg>
                        <p>Nenhum departamento cadastrado.</p>
                        <p className="text-xs text-slate-600">Crie o primeiro departamento para organizar os usuários por setor.</p>
                      </div>
                    </td>
                  </tr>
                )
                : departamentos?.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-200 font-medium">{d.nome}</td>
                    <td className="px-4 py-3 text-slate-400">{d.descricao ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.isActive
                            ? 'bg-emerald-900/40 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {d.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(d)}
                          className="px-3 py-1 text-xs text-indigo-300 hover:text-indigo-100 border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="px-3 py-1 text-xs text-rose-400 hover:text-rose-200 border border-rose-800 hover:border-rose-600 rounded-lg transition-colors"
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
