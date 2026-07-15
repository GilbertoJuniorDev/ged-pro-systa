'use client';

import { useMemo, useState } from 'react';
import type { ComboboxOption } from '@/components/ui/combobox';
import { usePublicDocuments, usePublicSeries } from '@/hooks/use-public-documents';
import { PortalHero } from './portal-hero';
import { PortalDestaques } from './portal-destaques';
import { PortalRecentes } from './portal-recentes';
import { PortalSearchFilter } from './portal-search-filter';
import { PortalDocumentsGrid } from './portal-documents-grid';
import { CadastroDownloadModal } from './cadastro-download-modal';
import { usePortalDownload } from './use-portal-download';

const PAGE_LIMIT = 12;

// Orquestrador do portal: mantém o estado de busca/filtro/paginação e o resultado de
// usePublicDocuments aqui (em vez de dentro do grid). As opções do filtro de série vêm de
// usePublicSeries() (GET /public/documents/series) — a lista completa de séries com pelo
// menos um documento público, independente da página/filtro atualmente carregado — e não
// são mais derivadas da página de resultados corrente (o que escondia séries fora da
// página atual e fazia a própria lista de opções encolher ao aplicar um filtro).
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

  const { data: seriesData } = usePublicSeries();

  const { pendingDocument, requestDownload, closeModal } = usePortalDownload();

  const serieOptions = useMemo<ComboboxOption[]>(() => {
    return [
      { value: '', label: 'Todas as séries' },
      ...(seriesData ?? []).map((serie) => ({
        value: serie.id,
        label: `${serie.codigo} — ${serie.nome}`,
      })),
    ];
  }, [seriesData]);

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
