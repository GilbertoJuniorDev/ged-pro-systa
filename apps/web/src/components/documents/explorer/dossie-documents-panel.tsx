'use client';

import { useDocuments } from '@/hooks/use-documents';
import { useDepartments } from '@/hooks/use-departments';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { Pagination } from '@/components/ui/pagination';
import { DocumentsTable } from './documents-table';

const PAGE_LIMIT = 20;

export function DossieDocumentsPanel({ dossieId }: { dossieId: string }) {
  const { params, setParams } = useExplorerParams();
  const { data: departamentos } = useDepartments();

  const { data, isLoading, isError } = useDocuments({
    dossieId,
    search: params.q || undefined,
    page: params.page,
    limit: PAGE_LIMIT,
  });

  function nomeById(departamentoId: string): string {
    return departamentos?.find((d) => d.id === departamentoId)?.nome ?? '—';
  }

  if (isError) {
    return <p className="py-4 text-sm text-rose-500 dark:text-rose-400">Erro ao carregar documentos.</p>;
  }

  const documentos = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <DocumentsTable
        documents={documentos}
        isLoading={isLoading}
        departamentoNomeById={nomeById}
        showDossieColumn={false}
        emptyTitle={
          params.q
            ? 'Nenhum documento encontrado com os filtros atuais.'
            : 'Nenhum documento neste dossiê.'
        }
        emptySuggestions={params.q ? undefined : ['Envie um documento e vincule-o a este dossiê.']}
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
