'use client';

import { useState } from 'react';
import type { DossieDto } from '@/types';
import { useDossies, useDeleteDossie } from '@/hooks/use-dossies';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { usePermissions } from '@/hooks/use-permissions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DossiesDataTable } from '../arquivos/dossies-data-table';
import { EditDossieDialog } from '../edit-dossie-dialog';
import { CreateDossieDialog } from '../create-dossie-dialog';

const PAGE_LIMIT = 20;

export function ArquivoDossiesPanel({ arquivoId }: { arquivoId: string }) {
  const { params, setParams, drillDossie } = useExplorerParams();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('DOSSIES_MANAGE');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError } = useDossies({
    arquivoId,
    search: params.q || undefined,
    page: params.page,
    limit: PAGE_LIMIT,
  });

  const deleteDossie = useDeleteDossie();
  const [editTarget, setEditTarget] = useState<DossieDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DossieDto | null>(null);

  if (isError) {
    return <p className="py-4 text-sm text-rose-500 dark:text-rose-400">Erro ao carregar dossiês.</p>;
  }

  const dossies = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            + Vincular dossiê
          </button>
        </div>
      )}

      <DossiesDataTable
        dossies={dossies}
        isLoading={isLoading}
        total={total}
        page={params.page}
        limit={PAGE_LIMIT}
        searchActive={Boolean(params.q)}
        canManage={canManage}
        onRowClick={(d) => drillDossie(arquivoId, d.id)}
        onPageChange={(p) => setParams({ page: p })}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      {showCreate && <CreateDossieDialog onClose={() => setShowCreate(false)} />}
      {editTarget && <EditDossieDialog dossie={editTarget} onClose={() => setEditTarget(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          title="Remover dossiê?"
          description={`O dossiê "${deleteTarget.nome}" será removido permanentemente.`}
          confirmLabel="Remover"
          pendingLabel="Removendo…"
          tone="danger"
          isPending={deleteDossie.isPending}
          onConfirm={() => deleteDossie.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
