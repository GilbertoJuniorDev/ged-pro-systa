'use client';

import { useState } from 'react';
import { DocumentSeriesList } from '@/components/documents/document-series-list';
import { CreateDocumentSeriesDialog } from '@/components/documents/create-document-series-dialog';

export function ClassificacaoPageClient() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Classificação</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Organize os documentos em séries de classificação hierárquicas. Cada série pode ter
            uma série &quot;pai&quot;, formando uma árvore de códigos usada para catalogar os
            documentos do departamento.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Série
        </button>
      </div>

      <DocumentSeriesList />

      {showCreate && <CreateDocumentSeriesDialog onClose={() => setShowCreate(false)} />}
    </main>
  );
}
