'use client';

import { Star } from 'lucide-react';
import type { PublicDocumentDto } from '@/types';
import { usePublicDestaques } from '@/hooks/use-public-documents';
import { PortalDocumentCard, PortalDocumentCardSkeleton } from './portal-document-card';

interface PortalDestaquesProps {
  readonly onDownload: (document: PublicDocumentDto) => void;
}

export function PortalDestaques({ onDownload }: PortalDestaquesProps) {
  const { data, isLoading } = usePublicDestaques();
  const documentos = data ?? [];

  if (!isLoading && documentos.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-5 flex items-center gap-2">
        <Star className="h-5 w-5 text-amber-500" fill="currentColor" strokeWidth={0} />
        <h2 className="text-xl font-semibold text-slate-900">Destaques</h2>
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
