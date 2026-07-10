'use client';

import { useMemo, useState } from 'react';
import type { ComboboxOption } from '@/components/ui/combobox';
import { usePublicDocuments } from '@/hooks/use-public-documents';
import { PortalHero } from './portal-hero';
import { PortalDestaques } from './portal-destaques';
import { PortalRecentes } from './portal-recentes';
import { PortalSearchFilter } from './portal-search-filter';
import { PortalDocumentsGrid } from './portal-documents-grid';
import { CadastroDownloadModal } from './cadastro-download-modal';
import { usePortalDownload } from './use-portal-download';

const PAGE_LIMIT = 12;

// Orquestrador do portal: mantém o estado de busca/filtro/paginação e o resultado de
// usePublicDocuments aqui (em vez de dentro do grid) porque as opções de série do filtro
// são derivadas da mesma página de resultados já carregada — não existe um endpoint
// dedicado de "listar séries públicas", então reaproveitar os dados já buscados é a
// abordagem mais simples que ainda evita uma segunda chamada só para popular o filtro.
export function PortalPageClient() {
  const [search, setSearch] = useState('');
  const [serieId, setSerieId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = usePublicDocuments({
    search: search.trim() || undefined,
    serieId: serieId || undefined,
    page,
    limit: PAGE_LIMIT,
  });

  const { pendingDocument, requestDownload, closeModal } = usePortalDownload();

  const serieOptions = useMemo<ComboboxOption[]>(() => {
    const unique = new Map<string, string>();
    for (const doc of data?.data ?? []) {
      unique.set(doc.serie.id, `${doc.serie.codigo} — ${doc.serie.nome}`);
    }
    return [
      { value: '', label: 'Todas as séries' },
      ...Array.from(unique, ([value, label]) => ({ value, label })),
    ];
  }, [data?.data]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleSerieChange(value: string) {
    setSerieId(value);
    setPage(1);
  }

  return (
    <>
      <PortalHero />
      <PortalDestaques onDownload={requestDownload} />
      <PortalRecentes onDownload={requestDownload} />

      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <PortalSearchFilter
          search={search}
          onSearchChange={handleSearchChange}
          serieId={serieId}
          onSerieChange={handleSerieChange}
          serieOptions={serieOptions}
        />
      </section>

      <PortalDocumentsGrid
        documents={data?.data ?? []}
        total={data?.total ?? 0}
        page={data?.page ?? page}
        limit={data?.limit ?? PAGE_LIMIT}
        isLoading={isLoading}
        isError={isError}
        onPageChange={setPage}
        onDownload={requestDownload}
      />

      {pendingDocument && <CadastroDownloadModal document={pendingDocument} onClose={closeModal} />}
    </>
  );
}
