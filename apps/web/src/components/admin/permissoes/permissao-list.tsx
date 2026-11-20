'use client';

import { useState } from 'react';
import type { PermissionDto } from '@/types';
import { usePermissionsManagement, useDeletePermission } from '@/hooks/use-permission-management';
import { permissionLabel } from '@/lib/permission-labels';
import { EditPermissaoDialog } from './edit-permissao-dialog';

interface DeleteConfirmProps {
  permissao: PermissionDto;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ permissao, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-foreground font-semibold mb-1">Remover permissão?</p>
        <p className="text-muted-foreground text-sm mb-6">
          A permissão <span className="text-foreground font-medium">&quot;{permissao.nome}&quot;</span> será removida
          e todos os usuários perderão este acesso.
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
          <div className="h-4 rounded bg-border animate-pulse" style={{ width: i === 1 ? '60%' : '80%' }} />
        </td>
      ))}
    </tr>
  );
}

export function PermissaoList() {
  const { data: permissoes, isLoading, isError } = usePermissionsManagement();
  const deletePermissao = useDeletePermission();
  const [editTarget, setEditTarget] = useState<PermissionDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PermissionDto | null>(null);

  if (isError) {
    return (
      <p className="text-danger text-sm py-4">Erro ao carregar permissões.</p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-foreground/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Módulo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Criada em</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : permissoes?.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma permissão cadastrada.
                    </td>
                  </tr>
                )
                : permissoes?.map((p) => {
                  const { label, description } = permissionLabel(p.nome, p.descricao);
                  return (
                  <tr key={p.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{label}</td>
                    <td className="px-4 py-3">
                      {p.modulo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-soft text-primary">
                          {p.modulo.nome}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{description}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(p)}
                          className="px-3 py-1 text-xs text-primary hover:text-primary-hover border border-primary/40 hover:border-primary rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="px-3 py-1 text-xs text-danger border border-danger/30 hover:border-danger rounded-lg transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
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
