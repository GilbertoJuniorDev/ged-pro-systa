'use client';

import { useState } from 'react';
import type { ModuleDto } from '@/types';
import { useModules, useDeleteModule } from '@/hooks/use-modules';
import { EditModuloDialog } from './edit-modulo-dialog';

interface DeleteConfirmProps {
  modulo: ModuleDto;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ modulo, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-slate-100 font-semibold mb-1">Remover módulo?</p>
        <p className="text-slate-400 text-sm mb-6">
          O módulo <span className="text-slate-200 font-medium">&quot;{modulo.nome}&quot;</span> será removido.
          As permissões associadas perderão o vínculo com este módulo.
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
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-800 animate-pulse" style={{ width: i === 1 ? '40%' : '70%' }} />
        </td>
      ))}
    </tr>
  );
}

export function ModuloList() {
  const { data: modulos, isLoading, isError } = useModules();
  const deleteModulo = useDeleteModule();
  const [editTarget, setEditTarget] = useState<ModuleDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModuleDto | null>(null);

  if (isError) {
    return <p className="text-rose-400 text-sm py-4">Erro ao carregar módulos.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : modulos?.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Nenhum módulo cadastrado. Crie o primeiro módulo para começar.
                    </td>
                  </tr>
                )
                : modulos?.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-200 font-medium">{m.nome}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-indigo-300 bg-indigo-950/50 px-1.5 py-0.5 rounded">
                        {m.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{m.descricao ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.isActive
                            ? 'bg-emerald-900/40 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {m.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(m)}
                          className="px-3 py-1 text-xs text-indigo-300 hover:text-indigo-100 border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
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
        <EditModuloDialog modulo={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {deleteTarget && (
        <DeleteConfirm
          modulo={deleteTarget}
          isPending={deleteModulo.isPending}
          onConfirm={() => {
            deleteModulo.mutate(deleteTarget.id, {
              onSettled: () => setDeleteTarget(null),
            });
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
