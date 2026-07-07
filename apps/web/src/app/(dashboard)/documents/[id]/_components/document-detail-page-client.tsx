'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Confidencialidade, DocumentFase } from '@/types';
import { useDocument, useDeleteDocument, useDownloadDocument } from '@/hooks/use-documents';
import { useDepartments } from '@/hooks/use-departments';
import { useDocumentSeries } from '@/hooks/use-document-series';
import { useDossies } from '@/hooks/use-dossies';
import { formatBytes } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const CONFIDENCIALIDADE_BADGE: Record<Confidencialidade, string> = {
  PUBLICO: 'bg-slate-800 text-slate-400',
  INTERNO: 'bg-indigo-900/40 text-indigo-400',
  RESTRITO: 'bg-amber-900/40 text-amber-400',
  CONFIDENCIAL: 'bg-rose-900/40 text-rose-400',
};

const CONFIDENCIALIDADE_LABEL: Record<Confidencialidade, string> = {
  PUBLICO: 'Público',
  INTERNO: 'Interno',
  RESTRITO: 'Restrito',
  CONFIDENCIAL: 'Confidencial',
};

const FASE_LABEL: Record<DocumentFase, string> = {
  CORRENTE: 'Corrente',
  INTERMEDIARIO: 'Intermediário',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

interface DeleteConfirmProps {
  nome: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ nome, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-slate-100 font-semibold mb-1">Remover documento?</p>
        <p className="text-slate-400 text-sm mb-6">
          O documento <span className="text-slate-200 font-medium">&quot;{nome}&quot;</span> e o arquivo
          enviado serão removidos permanentemente.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Removendo…' : 'Remover'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</dt>
      <dd className="mt-1 text-sm text-slate-200">{children}</dd>
    </div>
  );
}

export function DocumentDetailPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: document, isLoading, isError } = useDocument(id);
  const { data: departamentos } = useDepartments();
  const { data: series } = useDocumentSeries(document?.departamentoId);
  const { data: dossies } = useDossies(document?.departamentoId);
  const downloadDocument = useDownloadDocument();
  const deleteDocument = useDeleteDocument();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const backLink = (
    <Link
      href="/documents"
      className="text-sm text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200"
    >
      ← Documentos
    </Link>
  );

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
        <div className="mb-6">{backLink}</div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <Skeleton className="h-7 w-64 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (isError || !document) {
    return (
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
        <div className="mb-6">{backLink}</div>
        <p className="text-rose-400 text-sm">Documento não encontrado.</p>
      </main>
    );
  }

  const departamentoNome = departamentos?.find((d) => d.id === document.departamentoId)?.nome ?? '—';
  const serieLabel = (() => {
    const serie = series?.find((s) => s.id === document.serieId);
    return serie ? `${serie.codigo} — ${serie.nome}` : '—';
  })();
  const dossieNome = document.dossieId
    ? (dossies?.find((d) => d.id === document.dossieId)?.nome ?? '—')
    : null;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-6">{backLink}</div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100">{document.nome}</h1>
            {document.descricao && <p className="mt-1 text-sm text-slate-400">{document.descricao}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCIALIDADE_BADGE[document.confidencialidade]}`}
              >
                {CONFIDENCIALIDADE_LABEL[document.confidencialidade]}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  document.fase === 'CORRENTE' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {FASE_LABEL[document.fase]}
              </span>
              {document.elegivelTransferencia && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400">
                  Elegível para transferência
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => downloadDocument.mutate({ id: document.id, filename: document.arquivoNome })}
              disabled={downloadDocument.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Baixar
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm text-rose-400 hover:text-rose-200 border border-rose-800 hover:border-rose-600 rounded-lg transition-colors"
            >
              Remover
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 border-t border-slate-800 pt-6">
          <Field label="Departamento">{departamentoNome}</Field>
          <Field label="Série">{serieLabel}</Field>
          <Field label="Dossiê">{dossieNome ?? <span className="italic text-slate-500">Avulso</span>}</Field>
          <Field label="Validade">{formatDate(document.validade)}</Field>
          <Field label="Em corrente desde">{formatDate(document.faseCorrenteDesde)}</Field>
          <Field label="Vencimento (corrente)">{formatDate(document.vencimentoCorrente)}</Field>
          {document.faseIntermediarioDesde && (
            <Field label="Em intermediário desde">{formatDate(document.faseIntermediarioDesde)}</Field>
          )}
          {document.vencimentoIntermediario && (
            <Field label="Vencimento (intermediário)">{formatDate(document.vencimentoIntermediario)}</Field>
          )}
          <Field label="Arquivo">{document.arquivoNome}</Field>
          <Field label="Tipo">{document.arquivoMimeType}</Field>
          <Field label="Tamanho">{formatBytes(document.arquivoTamanho)}</Field>
          <Field label="Criado em">{formatDate(document.createdAt)}</Field>
          <Field label="Atualizado em">{formatDate(document.updatedAt)}</Field>
        </dl>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirm
          nome={document.nome}
          isPending={deleteDocument.isPending}
          onConfirm={() => {
            deleteDocument.mutate(document.id, {
              onSuccess: () => router.push('/documents'),
              onSettled: () => setShowDeleteConfirm(false),
            });
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </main>
  );
}
