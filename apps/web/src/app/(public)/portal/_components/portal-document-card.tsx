import { FileText, Lock } from 'lucide-react';
import type { PublicDocumentDto } from '@/types';
import { formatBytes } from '@/lib/utils';

interface PortalDocumentCardProps {
  readonly document: PublicDocumentDto;
  readonly onDownload: (document: PublicDocumentDto) => void;
}

export function PortalDocumentCard({ document, onDownload }: PortalDocumentCardProps) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
          <FileText className="h-5 w-5 text-indigo-600" strokeWidth={1.75} />
        </div>
        {document.exigeCadastro && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Lock className="h-3 w-3" />
            Cadastro
          </span>
        )}
      </div>

      <div className="mb-3 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{document.nome}</h3>
        {document.descricao && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{document.descricao}</p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
          {document.serie.codigo}
        </span>
        <span>{formatBytes(document.arquivoTamanho)}</span>
      </div>

      <button
        type="button"
        onClick={() => onDownload(document)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        Baixar
      </button>
    </article>
  );
}

export function PortalDocumentCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 h-10 w-10 rounded-xl bg-slate-100" />
      <div className="mb-2 h-4 w-2/3 rounded bg-slate-200" />
      <div className="mb-4 h-3 w-full rounded bg-slate-100" />
      <div className="h-9 w-full rounded-lg bg-slate-100" />
    </div>
  );
}
