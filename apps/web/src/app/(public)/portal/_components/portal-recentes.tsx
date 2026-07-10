'use client';

import { Clock } from 'lucide-react';
import type { PublicDocumentDto } from '@/types';
import { usePublicRecentes } from '@/hooks/use-public-documents';
import { PortalDocumentCard, PortalDocumentCardSkeleton } from './portal-document-card';

interface PortalRecentesProps {
  readonly onDownload: (document: PublicDocumentDto) => void;
}

const RECENTES_LIMIT = 6;

export function PortalRecentes({ onDownload }: PortalRecentesProps) {
  const { data, isLoading } = usePublicRecentes(RECENTES_LIMIT);
  const documentos = data ?? [];

  if (!isLoading && documentos.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-5 flex items-center gap-2">
        <Clock className="h-5 w-5 text-indigo-600" strokeWidth={1.75} />
        <h2 className="text-xl font-semibold text-slate-900">Últimos postados</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <PortalDocumentCardSkeleton key={i} />)
          : documentos.map((doc) => (
              <PortalDocumentCard key={doc.id} document={doc} onDownload={onDownload} />
            ))}
      </div>
    </section>
  );
}
