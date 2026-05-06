'use client';

import { useState } from 'react';
import type { PermissaoDto } from '@/types';
import { usePermissoes, useDeletePermissao } from '@/hooks/use-permissoes';
import { EditPermissaoDialog } from './edit-permissao-dialog';

interface DeleteConfirmProps {
  permissao: PermissaoDto;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ permissao, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-slate-100 font-semibold mb-1">Remover permissão?</p>
        <p className="text-slate-400 text-sm mb-6">
          A permissão <span className="text-slate-200 font-medium">"{permissao.nome}"</span> será removida
          e todos os usuários perderão este acesso.
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
          <div className="h-4 rounded bg-slate-800 animate-pulse" style={{ width: i === 1 ? '60%' : '80%' }} />
        </td>
      ))}
    </tr>
  );
}

export function PermissaoList() {
  const { data: permissoes, isLoading, isError } = usePermissoes();
  const deletePermissao = useDeletePermissao();
  const [editTarget, setEditTarget] = useState<PermissaoDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PermissaoDto | null>(null);

  if (isError) {
    return (
      <p className="text-rose-400 text-sm py-4">Erro ao carregar permissões.</p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Módulo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Criada em</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : permissoes?.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma permissão cadastrada.
                    </td>
                  </tr>
                )
                : permissoes?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-200 font-medium">{p.nome}</td>
                    <td className="px-4 py-3">
                      {p.modulo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-950/50 text-indigo-300">
                          {p.modulo.nome}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{p.descricao ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(p)}
                          className="px-3 py-1 text-xs text-indigo-300 hover:text-indigo-100 border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
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
        <EditPermissaoDialog
          permissao={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          permissao={deleteTarget}
          isPending={deletePermissao.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deletePermissao.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            });
          }}
        />
      )}
    </>
  );
}
