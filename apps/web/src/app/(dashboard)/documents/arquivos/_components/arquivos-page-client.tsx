'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ArrowUpRight } from 'lucide-react';
import type { ArquivoDto, ArquivoStatus } from '@/types';
import {
  useArquivos,
  useDeleteArquivo,
  useEncerrarArquivo,
  useReabrirArquivo,
} from '@/hooks/use-arquivos';
import { useDepartmentFilter } from '@/hooks/use-department-filter';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePermissions } from '@/hooks/use-permissions';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { SearchInput } from '@/components/ui/search-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArquivosDataTable } from '@/components/documents/arquivos/arquivos-data-table';
import { CreateArquivoDialog } from '@/components/documents/create-arquivo-dialog';
import { EditArquivoDialog } from '@/components/documents/edit-arquivo-dialog';

const PAGE_LIMIT = 20;

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: '', label: 'Todos os status' },
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'FECHADO', label: 'Fechado' },
];

function buildAnoOptions(): ComboboxOption[] {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  return [
    { value: '', label: 'Todos os anos' },
    ...years.map((y) => ({ value: String(y), label: String(y) })),
  ];
}

const ANO_OPTIONS = buildAnoOptions();

export function ArquivosPageClient() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('ARQUIVOS_MANAGE');

  const [departamentoId, setDepartamentoId] = useState('');
  const [status, setStatus] = useState('');
  const [ano, setAno] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const { isAdmin, options: departmentOptions, nomeById } = useDepartmentFilter(
    departamentoId,
    (v) => {
      setDepartamentoId(v);
      setPage(1);
    },
  );

  const { data, isLoading, isError } = useArquivos({
    departamentoId: departamentoId || undefined,
    status: (status || undefined) as ArquivoStatus | undefined,
    ano: ano ? Number(ano) : undefined,
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_LIMIT,
  });

  const deleteArquivo = useDeleteArquivo();
  const encerrarArquivo = useEncerrarArquivo();
  const reabrirArquivo = useReabrirArquivo();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<ArquivoDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArquivoDto | null>(null);
  const [encerrarTarget, setEncerrarTarget] = useState<ArquivoDto | null>(null);
  const [reabrirTarget, setReabrirTarget] = useState<ArquivoDto | null>(null);

  const arquivos = data?.data ?? [];
  const total = data?.total ?? 0;
  const filtersActive =
    Boolean(debouncedSearch) || Boolean(status) || Boolean(departamentoId) || Boolean(ano);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Arquivos</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Crie e gerencie os arquivos de guarda física/lógica. Para navegar entre arquivo,
            dossiês e documentos, use o Explorador.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/documents?view=arquivos"
            className="flex items-center gap-1.5 self-start rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100 sm:self-auto"
          >
            Abrir no Explorador
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Novo Arquivo
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <SearchInput
          value={searchInput}
          onChange={(v) => {
            setSearchInput(v);
            setPage(1);
          }}
          placeholder="Buscar por nome, código…"
          className="w-full sm:max-w-xs"
        />
        <div className="max-w-xs">
          <Combobox
            value={departamentoId}
            onValueChange={(v) => {
              setDepartamentoId(v);
              setPage(1);
            }}
            options={departmentOptions}
            placeholder="Todos os departamentos"
            disabled={!isAdmin}
          />
        </div>
        <div className="max-w-xs">
          <Combobox
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="Todos os status"
          />
        </div>
        <div className="max-w-xs">
          <Combobox
            value={ano}
            onValueChange={(v) => {
              setAno(v);
              setPage(1);
            }}
            options={ANO_OPTIONS}
            placeholder="Todos os anos"
          />
        </div>
      </div>

      {isError ? (
        <p className="py-4 text-sm text-rose-500 dark:text-rose-400">Erro ao carregar arquivos.</p>
      ) : (
        <ArquivosDataTable
          arquivos={arquivos}
          isLoading={isLoading}
          total={total}
          page={page}
          limit={PAGE_LIMIT}
          filtersActive={filtersActive}
          nomeById={nomeById}
          canManage={canManage}
          onRowClick={(a) => router.push(`/documents/arquivos/${a.id}`)}
          onPageChange={setPage}
          onEdit={setEditTarget}
          onEncerrar={setEncerrarTarget}
          onReabrir={setReabrirTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {showCreate && <CreateArquivoDialog onClose={() => setShowCreate(false)} />}
      {editTarget && <EditArquivoDialog arquivo={editTarget} onClose={() => setEditTarget(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          title="Remover arquivo?"
          description={`O arquivo "${deleteTarget.codigo} — ${deleteTarget.nome}" será removido. Isso só é possível se não houver dossiês vinculados a ele.`}
          confirmLabel="Remover"
          pendingLabel="Removendo…"
          tone="danger"
          isPending={deleteArquivo.isPending}
          onConfirm={() => deleteArquivo.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {encerrarTarget && (
        <ConfirmDialog
          title="Encerrar arquivo?"
          description={`O arquivo "${encerrarTarget.codigo} — ${encerrarTarget.nome}" será encerrado. Não será mais possível editá-lo ou vincular novos dossiês até reabri-lo.`}
          confirmLabel="Encerrar"
          pendingLabel="Encerrando…"
          isPending={encerrarArquivo.isPending}
          onConfirm={() => encerrarArquivo.mutate(encerrarTarget.id, { onSettled: () => setEncerrarTarget(null) })}
          onCancel={() => setEncerrarTarget(null)}
        />
      )}

      {reabrirTarget && (
        <ConfirmDialog
          title="Reabrir arquivo?"
          description={`O arquivo "${reabrirTarget.codigo} — ${reabrirTarget.nome}" voltará a aceitar edições e novos dossiês.`}
          confirmLabel="Reabrir"
          pendingLabel="Reabrindo…"
          isPending={reabrirArquivo.isPending}
          onConfirm={() => reabrirArquivo.mutate(reabrirTarget.id, { onSettled: () => setReabrirTarget(null) })}
          onCancel={() => setReabrirTarget(null)}
        />
      )}
    </main>
  );
}
