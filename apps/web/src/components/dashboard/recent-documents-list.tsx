'use client';

import Link from 'next/link';
import { FileStack } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Confidencialidade, DocumentDto, DocumentFase } from '@/types';

interface RecentDocumentsListProps {
  readonly documents: readonly DocumentDto[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

const CONFIDENCIALIDADE_BADGE: Record<Confidencialidade, string> = {
  PUBLICO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  RESTRITO: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  CONFIDENCIAL: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
};

const CONFIDENCIALIDADE_LABEL: Record<Confidencialidade, string> = {
  PUBLICO: 'Público',
  RESTRITO: 'Restrito',
  CONFIDENCIAL: 'Confidencial',
};

const FASE_BADGE: Record<DocumentFase, string> = {
  CORRENTE: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  INTERMEDIARIO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const FASE_LABEL: Record<DocumentFase, string> = {
  CORRENTE: 'Corrente',
  INTERMEDIARIO: 'Intermediário',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

/** Presentational — loading/error/data are owned by the caller (`useDocuments({ limit: 5 })`). */
export function RecentDocumentsList({ documents, isLoading, isError }: RecentDocumentsListProps) {
  if (isError) {
    return <p className="text-rose-400 text-sm">Erro ao carregar documentos recentes.</p>;
  }

  if (isLoading) {
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-slate-500 dark:text-slate-500">
        <FileStack className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-sm">Nenhum documento recente.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href={`/documents/${doc.id}`}
          className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-indigo-600 dark:hover:text-indigo-300"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900 dark:text-slate-200">{doc.nome}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">{formatDate(doc.createdAt)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${FASE_BADGE[doc.fase]}`}>
              {FASE_LABEL[doc.fase]}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCIALIDADE_BADGE[doc.confidencialidade]}`}
            >
              {CONFIDENCIALIDADE_LABEL[doc.confidencialidade]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
