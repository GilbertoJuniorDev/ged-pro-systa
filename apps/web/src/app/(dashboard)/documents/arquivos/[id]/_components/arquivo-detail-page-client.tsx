'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { DossieDto } from '@/types';
import {
  useArquivo,
  useDeleteArquivo,
  useEncerrarArquivo,
  useReabrirArquivo,
} from '@/hooks/use-arquivos';
import { useDossies, useDeleteDossie } from '@/hooks/use-dossies';
import { useDepartments } from '@/hooks/use-departments';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePermissions } from '@/hooks/use-permissions';
import { localizacaoArquivo } from '@/lib/utils';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchInput } from '@/components/ui/search-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArquivoStatusBadge } from '@/components/documents/arquivo-status-badge';
import { EditArquivoDialog } from '@/components/documents/edit-arquivo-dialog';
import { CreateDossieDialog } from '@/components/documents/create-dossie-dialog';
import { EditDossieDialog } from '@/components/documents/edit-dossie-dialog';
import { DossiesDataTable } from '@/components/documents/arquivos/dossies-data-table';

const PAGE_LIMIT = 20;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function ArquivoDetailPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: arquivo, isLoading, isError } = useArquivo(id);
  const { data: departamentos } = useDepartments();
  const { hasPermission } = usePermissions();
  const canManageArquivo = hasPermission('ARQUIVOS_MANAGE');
  const canManageDossies = hasPermission('DOSSIES_MANAGE');

  const deleteArquivo = useDeleteArquivo();
  const encerrarArquivo = useEncerrarArquivo();
  const reabrirArquivo = useReabrirArquivo();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEncerrar, setShowEncerrar] = useState(false);
  const [showReabrir, setShowReabrir] = useState(false);

  const [dossieSearchInput, setDossieSearchInput] = useState('');
  const debouncedDossieSearch = useDebouncedValue(dossieSearchInput, 300);
  const [dossiePage, setDossiePage] = useState(1);
  const [showCreateDossie, setShowCreateDossie] = useState(false);
  const [editDossieTarget, setEditDossieTarget] = useState<DossieDto | null>(null);
  const [deleteDossieTarget, setDeleteDossieTarget] = useState<DossieDto | null>(null);

  const { data: dossiesData, isLoading: isLoadingDossies } = useDossies({
    arquivoId: id,
    search: debouncedDossieSearch || undefined,
    page: dossiePage,
    limit: PAGE_LIMIT,
  });
  const deleteDossie = useDeleteDossie();

  const backLink = (
    <button
      onClick={() => router.push('/documents/arquivos')}
      className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Arquivos
    </button>
  );

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
        <div className="mb-6">{backLink}</div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <Skeleton className="mb-4 h-7 w-64" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (isError || !arquivo) {
    return (
      <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
        <div className="mb-6">{backLink}</div>
        <p className="text-sm text-danger">Arquivo não encontrado.</p>
      </main>
    );
  }

  const departamentoNome = departamentos?.find((d) => d.id === arquivo.departamentoId)?.nome ?? '—';
  const extraDepartmentNames = arquivo.departamentoIds
    .map((depId) => departamentos?.find((d) => d.id === depId)?.nome)
    .filter((nome): nome is string => Boolean(nome));

  const dossies = dossiesData?.data ?? [];
  const dossiesTotal = dossiesData?.total ?? 0;

  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <Breadcrumb
        items={[
          { label: 'Arquivos', href: '/documents/arquivos' },
          { label: `${arquivo.codigo} — ${arquivo.nome}` },
        ]}
      />

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {arquivo.codigo} — {arquivo.nome}
            </h1>
            {arquivo.descricao && (
              <p className="mt-1 text-sm text-muted-foreground">{arquivo.descricao}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <ArquivoStatusBadge status={arquivo.status} />
            </div>
            {extraDepartmentNames.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Também visível para:{' '}
                <span className="text-muted-foreground">{extraDepartmentNames.join(', ')}</span>
              </p>
            )}
          </div>
          {(canManageArquivo) && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {arquivo.status === 'ABERTO' ? (
                <>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="cursor-pointer rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary transition-colors hover:border-primary hover:text-primary-hover"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setShowEncerrar(true)}
                    className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                  >
                    Encerrar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowReabrir(true)}
                  className="cursor-pointer rounded-lg border border-success/40 px-4 py-2 text-sm text-success transition-colors hover:border-success"
                >
                  Reabrir
                </button>
              )}
              <button
                onClick={() => setShowDelete(true)}
                className="cursor-pointer rounded-lg border border-danger/40 px-4 py-2 text-sm text-danger transition-colors hover:border-danger"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Departamento (dono)">{departamentoNome}</Field>
          <Field label="Localização física">{localizacaoArquivo(arquivo)}</Field>
          <Field label="Dossiês vinculados">{arquivo.dossiesCount}</Field>
          <Field label="Encerrado em">{formatDate(arquivo.dataEncerramento)}</Field>
          <Field label="Criado em">{formatDate(arquivo.createdAt)}</Field>
          <Field label="Atualizado em">{formatDate(arquivo.updatedAt)}</Field>
        </dl>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Dossiês deste arquivo
            </h2>
            <p className="text-sm text-muted-foreground">
              Clique num dossiê para abrir seus documentos no Explorador.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={dossieSearchInput}
              onChange={(v) => {
                setDossieSearchInput(v);
                setDossiePage(1);
              }}
              placeholder="Buscar dossiê…"
              className="w-full sm:w-56"
            />
            {canManageDossies && (
              <button
                onClick={() => setShowCreateDossie(true)}
                className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                + Vincular dossiê
              </button>
            )}
          </div>
        </div>

        <DossiesDataTable
          dossies={dossies}
          isLoading={isLoadingDossies}
          total={dossiesTotal}
          page={dossiePage}
          limit={PAGE_LIMIT}
          searchActive={Boolean(debouncedDossieSearch)}
          canManage={canManageDossies}
          onRowClick={(d) => router.push(`/documents?arquivo=${id}&dossie=${d.id}`)}
          onPageChange={setDossiePage}
          onEdit={setEditDossieTarget}
          onDelete={setDeleteDossieTarget}
        />
      </div>

      {showEdit && <EditArquivoDialog arquivo={arquivo} onClose={() => setShowEdit(false)} />}

      {showDelete && (
        <ConfirmDialog
          title="Remover arquivo?"
          description={`O arquivo "${arquivo.codigo} — ${arquivo.nome}" será removido. Isso só é possível se não houver dossiês vinculados a ele.`}
          confirmLabel="Remover"
          pendingLabel="Removendo…"
          tone="danger"
          isPending={deleteArquivo.isPending}
          onConfirm={() =>
            deleteArquivo.mutate(arquivo.id, {
              onSuccess: () => router.push('/documents/arquivos'),
              onSettled: () => setShowDelete(false),
            })
          }
          onCancel={() => setShowDelete(false)}
        />
      )}

      {showEncerrar && (
        <ConfirmDialog
          title="Encerrar arquivo?"
          description={`O arquivo "${arquivo.codigo} — ${arquivo.nome}" será encerrado. Não será mais possível editá-lo ou vincular novos dossiês até reabri-lo.`}
          confirmLabel="Encerrar"
          pendingLabel="Encerrando…"
          isPending={encerrarArquivo.isPending}
          onConfirm={() => encerrarArquivo.mutate(arquivo.id, { onSettled: () => setShowEncerrar(false) })}
          onCancel={() => setShowEncerrar(false)}
        />
      )}

      {showReabrir && (
        <ConfirmDialog
          title="Reabrir arquivo?"
          description={`O arquivo "${arquivo.codigo} — ${arquivo.nome}" voltará a aceitar edições e novos dossiês.`}
          confirmLabel="Reabrir"
          pendingLabel="Reabrindo…"
          isPending={reabrirArquivo.isPending}
          onConfirm={() => reabrirArquivo.mutate(arquivo.id, { onSettled: () => setShowReabrir(false) })}
          onCancel={() => setShowReabrir(false)}
        />
      )}

      {showCreateDossie && <CreateDossieDialog onClose={() => setShowCreateDossie(false)} />}
      {editDossieTarget && (
        <EditDossieDialog dossie={editDossieTarget} onClose={() => setEditDossieTarget(null)} />
      )}

      {deleteDossieTarget && (
        <ConfirmDialog
          title="Remover dossiê?"
          description={`O dossiê "${deleteDossieTarget.nome}" será removido permanentemente.`}
          confirmLabel="Remover"
          pendingLabel="Removendo…"
          tone="danger"
          isPending={deleteDossie.isPending}
          onConfirm={() =>
            deleteDossie.mutate(deleteDossieTarget.id, { onSettled: () => setDeleteDossieTarget(null) })
          }
          onCancel={() => setDeleteDossieTarget(null)}
        />
      )}
    </main>
  );
}
