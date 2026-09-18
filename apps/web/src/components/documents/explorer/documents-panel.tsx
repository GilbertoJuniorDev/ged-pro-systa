'use client';

import type { Confidencialidade, DocumentFase } from '@/types';
import { useDocuments } from '@/hooks/use-documents';
import { useDepartmentFilter } from '@/hooks/use-department-filter';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Pagination } from '@/components/ui/pagination';
import { DocumentsTable } from './documents-table';

const PAGE_LIMIT = 20;

const FASE_OPTIONS: ComboboxOption[] = [
  { value: '', label: 'Todas as fases' },
  { value: 'CORRENTE', label: 'Corrente' },
  { value: 'INTERMEDIARIO', label: 'Intermediário' },
];

const CONFIDENCIALIDADE_OPTIONS: ComboboxOption[] = [
  { value: '', label: 'Todas as confidencialidades' },
  { value: 'PUBLICO', label: 'Público' },
  { value: 'RESTRITO', label: 'Restrito' },
  { value: 'CONFIDENCIAL', label: 'Confidencial' },
];

export function DocumentsPanel() {
  const { params, setParams } = useExplorerParams();
  const { isAdmin, options: departmentOptions, nomeById } = useDepartmentFilter(
    params.depto,
    (v) => setParams({ depto: v, page: undefined }),
  );

  const { data, isLoading, isError } = useDocuments({
    departamentoId: params.depto || undefined,
    fase: (params.fase || undefined) as DocumentFase | undefined,
    confidencialidade: (params.conf || undefined) as Confidencialidade | undefined,
    search: params.q || undefined,
    page: params.page,
    limit: PAGE_LIMIT,
  });

  if (isError) {
    return <p className="py-4 text-sm text-rose-500 dark:text-rose-400">Erro ao carregar documentos.</p>;
  }

  const documentos = data?.data ?? [];
  const total = data?.total ?? 0;
  const filtersActive = Boolean(params.q) || Boolean(params.depto) || Boolean(params.fase) || Boolean(params.conf);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Combobox
            value={params.depto}
            onValueChange={(v) => setParams({ depto: v, page: undefined })}
            options={departmentOptions}
            placeholder="Todos os departamentos"
            disabled={!isAdmin}
          />
        </div>
        <div className="w-48">
          <Combobox
            value={params.fase}
            onValueChange={(v) => setParams({ fase: v, page: undefined })}
            options={FASE_OPTIONS}
            placeholder="Todas as fases"
          />
        </div>
        <div className="w-56">
          <Combobox
            value={params.conf}
            onValueChange={(v) => setParams({ conf: v, page: undefined })}
            options={CONFIDENCIALIDADE_OPTIONS}
            placeholder="Todas as confidencialidades"
          />
        </div>
      </div>

      <DocumentsTable
        documents={documentos}
        isLoading={isLoading}
        departamentoNomeById={nomeById}
        emptyTitle={
          filtersActive
            ? 'Nenhum documento encontrado com os filtros atuais.'
            : 'Nenhum documento encontrado.'
        }
        emptySuggestions={
          filtersActive
            ? ['Verifique a ortografia', 'Remova algum filtro']
            : ['Faça o upload do primeiro documento para começar.']
        }
      />

      <Pagination
        total={total}
        page={params.page}
        limit={PAGE_LIMIT}
        onPageChange={(p) => setParams({ page: p })}
        itemLabel={['documento', 'documentos']}
      />
    </>
  );
}
