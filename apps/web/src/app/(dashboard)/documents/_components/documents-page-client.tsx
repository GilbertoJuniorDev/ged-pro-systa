'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useExplorerParams } from '@/hooks/use-explorer-params';
import { DocumentsExplorer } from '@/components/documents/explorer/documents-explorer';
import { CreateArquivoDialog } from '@/components/documents/create-arquivo-dialog';
import { CreateDossieDialog } from '@/components/documents/create-dossie-dialog';

export function DocumentsPageClient() {
  const { params } = useExplorerParams();
  const [showCreateArquivo, setShowCreateArquivo] = useState(false);
  const [showCreateDossie, setShowCreateDossie] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Documentos</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Explore arquivos, dossiês e documentos em um só lugar.
          </p>
        </div>
        {params.view === 'arquivos' ? (
          <button
            onClick={() => setShowCreateArquivo(true)}
            className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Novo Arquivo
          </button>
        ) : params.view === 'dossies' ? (
          <button
            onClick={() => setShowCreateDossie(true)}
            className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Novo Dossiê
          </button>
        ) : (
          <Link
            href="/documents/upload"
            className="flex items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Upload
          </Link>
        )}
      </div>

      <DocumentsExplorer />

      {showCreateArquivo && <CreateArquivoDialog onClose={() => setShowCreateArquivo(false)} />}
      {showCreateDossie && <CreateDossieDialog onClose={() => setShowCreateDossie(false)} />}
    </main>
  );
}
