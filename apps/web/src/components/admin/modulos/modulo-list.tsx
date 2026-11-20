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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-foreground font-semibold mb-1">Remover módulo?</p>
        <p className="text-muted-foreground text-sm mb-6">
          O módulo <span className="text-foreground font-medium">&quot;{modulo.nome}&quot;</span> será removido.
          As permissões associadas perderão o vínculo com este módulo.
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
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-border animate-pulse" style={{ width: i === 1 ? '40%' : '70%' }} />
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
    return <p className="text-danger text-sm py-4">Erro ao carregar módulos.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-foreground/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : modulos?.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum módulo cadastrado. Crie o primeiro módulo para começar.
                    </td>
                  </tr>
                )
                : modulos?.map((m) => (
                  <tr key={m.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{m.nome}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-primary bg-primary-soft px-1.5 py-0.5 rounded">
                        {m.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.descricao ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.isActive
                            ? 'ring-1 ring-inset ring-success/40 text-success'
                            : 'bg-foreground/10 text-muted-foreground'
                        }`}
                      >
                        {m.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(m)}
                          className="px-3 py-1 text-xs text-primary hover:text-primary-hover border border-primary/40 hover:border-primary rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
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
