'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { useArquivo } from '@/hooks/use-arquivos';
import { useDossie } from '@/hooks/use-dossies';
import { DocumentsExplorer } from '@/components/documents/explorer/documents-explorer';
import { EXPLORER_VIEW_LABELS } from '@/components/documents/explorer/explorer-tabs';
import { CreateArquivoDialog } from '@/components/documents/create-arquivo-dialog';
import { CreateDossieDialog } from '@/components/documents/create-dossie-dialog';

export function DocumentsPageClient() {
  const { params, mode } = useExplorerParams();
  const [showCreateArquivo, setShowCreateArquivo] = useState(false);
  const [showCreateDossie, setShowCreateDossie] = useState(false);
  // Mesmas queries do DocumentsExplorer — o React Query compartilha o cache.
  const { data: arquivo } = useArquivo(params.arquivo);
  const { data: dossie } = useDossie(params.dossie);

  const selectionTitle =
    mode === 'dossie-drill' && dossie
      ? dossie.nome
      : mode === 'arquivo-drill' && arquivo
        ? `${arquivo.codigo} — ${arquivo.nome}`
        : EXPLORER_VIEW_LABELS[params.view];

  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Acervo
          </p>
          <h2 className="truncate text-2xl font-bold text-foreground">{selectionTitle}</h2>
          <p className="text-muted-foreground">
            Explore arquivos, dossiês e documentos em um só lugar.
          </p>
        </div>
        {params.view === 'arquivos' ? (
          <button
            onClick={() => setShowCreateArquivo(true)}
            className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Novo Arquivo
          </button>
        ) : params.view === 'dossies' ? (
          <button
            onClick={() => setShowCreateDossie(true)}
            className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Novo Dossiê
          </button>
        ) : (
          <Link
            href="/documents/upload"
            className="flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Protocolar
          </Link>
        )}
      </div>

      <DocumentsExplorer />

      {showCreateArquivo && <CreateArquivoDialog onClose={() => setShowCreateArquivo(false)} />}
      {showCreateDossie && <CreateDossieDialog onClose={() => setShowCreateDossie(false)} />}
    </main>
  );
}
