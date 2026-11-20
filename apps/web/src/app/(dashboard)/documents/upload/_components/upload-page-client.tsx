'use client';

import Link from 'next/link';
import { UploadDocumentForm } from '@/components/documents/upload-document-form';

export function UploadPageClient() {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/documents"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Acervo
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Protocolar Documento</h1>
        <p className="text-muted-foreground">
          Protocole um novo documento e classifique-o por departamento, série e dossiê.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
        <UploadDocumentForm />
      </div>
    </main>
  );
}
