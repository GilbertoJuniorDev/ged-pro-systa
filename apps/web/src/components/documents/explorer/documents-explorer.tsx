'use client';

import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { useArquivo } from '@/hooks/use-arquivos';
import { useDossie } from '@/hooks/use-dossies';
import { SearchInput } from '@/components/ui/search-input';
import { ExplorerTabs } from './explorer-tabs';
import { ExplorerBreadcrumb } from './explorer-breadcrumb';
import { ArquivosPanel } from './arquivos-panel';
import { ArquivoDossiesPanel } from './arquivo-dossies-panel';
import { DossiesPanel } from './dossies-panel';
import { DossieDocumentsPanel } from './dossie-documents-panel';
import { DocumentsPanel } from './documents-panel';
import { AvulsosPanel } from './avulsos-panel';

export function DocumentsExplorer() {
  const { params, mode, setParams } = useExplorerParams();
  const [searchInput, setSearchInput] = useState(params.q);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // URL search term changed elsewhere (tab switch, browser back) — resync the input.
  useEffect(() => {
    setSearchInput(params.q);
  }, [params.q]);

  useEffect(() => {
    if (debouncedSearch !== params.q) {
      setParams({ q: debouncedSearch, page: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data: arquivo } = useArquivo(params.arquivo);
  const { data: dossie } = useDossie(params.dossie);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ExplorerTabs active={params.view} />
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Buscar por nome, código…"
          className="w-full sm:max-w-xs"
        />
      </div>

      {mode !== 'view' && <ExplorerBreadcrumb arquivo={arquivo} dossie={dossie} />}

      {mode === 'dossie-drill' && params.dossie ? (
        <DossieDocumentsPanel dossieId={params.dossie} />
      ) : mode === 'arquivo-drill' && params.arquivo ? (
        <ArquivoDossiesPanel arquivoId={params.arquivo} />
      ) : params.view === 'dossies' ? (
        <DossiesPanel />
      ) : params.view === 'documentos' ? (
        <DocumentsPanel />
      ) : params.view === 'avulsos' ? (
        <AvulsosPanel />
      ) : (
        <ArquivosPanel />
      )}
    </div>
  );
}
