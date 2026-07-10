'use client';

import { FileStack } from 'lucide-react';
import type { PublicDocumentDto } from '@/types';
import { PortalDocumentCard, PortalDocumentCardSkeleton } from './portal-document-card';

interface PortalDocumentsGridProps {
  readonly documents: readonly PublicDocumentDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onDownload: (document: PublicDocumentDto) => void;
}

export function PortalDocumentsGrid({
  documents,
  total,
  page,
  limit,
  isLoading,
  isError,
  onPageChange,
  onDownload,
}: PortalDocumentsGridProps) {
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  if (isError) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Erro ao carregar documentos. Tente novamente em instantes.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <h2 className="mb-5 text-xl font-semibold text-slate-900">
        {isLoading
          ? 'Documentos'
          : `${total} documento${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
      </h2>

      {!isLoading && documents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          <FileStack className="h-8 w-8" strokeWidth={1.5} />
          <p>Nenhum documento encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <PortalDocumentCardSkeleton key={i} />)
            : documents.map((doc) => (
                <PortalDocumentCard key={doc.id} document={doc} onDownload={onDownload} />
              ))}
        </div>
      )}

      {total > 0 && (
        <div className="mt-8 flex items-center justify-between text-sm text-slate-600">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
