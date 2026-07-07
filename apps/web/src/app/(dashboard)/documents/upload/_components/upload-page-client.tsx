'use client';

import Link from 'next/link';
import { UploadDocumentForm } from '@/components/documents/upload-document-form';

export function UploadPageClient() {
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/documents"
            className="text-sm text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Documentos
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Upload de Documento</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Envie um novo documento e classifique-o por departamento, série e dossiê.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <UploadDocumentForm />
      </div>
    </main>
  );
}
