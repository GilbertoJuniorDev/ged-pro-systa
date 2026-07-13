'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileStack } from 'lucide-react';
import type { Confidencialidade, DocumentDto, DocumentFase } from '@/types';
import { useDeleteDocument, useDocuments, useDownloadDocument } from '@/hooks/use-documents';
import { useDepartments } from '@/hooks/use-departments';
import { useDossies } from '@/hooks/use-dossies';
import { formatBytes } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';

const PAGE_LIMIT = 20;

const FASE_OPTIONS = [
  { value: '', label: 'Todas as fases' },
  { value: 'CORRENTE', label: 'Corrente' },
  { value: 'INTERMEDIARIO', label: 'Intermediário' },
];

const CONFIDENCIALIDADE_OPTIONS = [
  { value: '', label: 'Todas as confidencialidades' },
  { value: 'PUBLICO', label: 'Público' },
  { value: 'RESTRITO', label: 'Restrito' },
  { value: 'CONFIDENCIAL', label: 'Confidencial' },
];

const CONFIDENCIALIDADE_BADGE: Record<Confidencialidade, string> = {
  PUBLICO: 'bg-slate-800 text-slate-400',
  RESTRITO: 'bg-amber-900/40 text-amber-400',
  CONFIDENCIAL: 'bg-rose-900/40 text-rose-400',
};

const CONFIDENCIALIDADE_LABEL: Record<Confidencialidade, string> = {
  PUBLICO: 'Público',
  RESTRITO: 'Restrito',
  CONFIDENCIAL: 'Confidencial',
};

const FASE_LABEL: Record<DocumentFase, string> = {
  CORRENTE: 'Corrente',
  INTERMEDIARIO: 'Intermediário',
};

interface DeleteConfirmProps {
  document: DocumentDto;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ document, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-slate-100 font-semibold mb-1">Remover documento?</p>
        <p className="text-slate-400 text-sm mb-6">
          O documento <span className="text-slate-200 font-medium">&quot;{document.nome}&quot;</span> e o
          arquivo enviado serão removidos permanentemente.
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

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-800 animate-pulse" style={{ width: i === 0 ? '80%' : '60%' }} />
        </td>
      ))}
    </tr>
  );
}

export function DocumentList() {
  const [departamentoId, setDepartamentoId] = useState('');
  const [dossieId, setDossieId] = useState('');
  const [fase, setFase] = useState('');
  const [confidencialidade, setConfidencialidade] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DocumentDto | null>(null);

  const { data: departamentos } = useDepartments();
  const { data: dossies } = useDossies(departamentoId || undefined);
  const { data, isLoading, isError } = useDocuments({
    departamentoId: departamentoId || undefined,
    dossieId: dossieId || undefined,
    fase: (fase || undefined) as DocumentFase | undefined,
    confidencialidade: (confidencialidade || undefined) as Confidencialidade | undefined,
    page,
    limit: PAGE_LIMIT,
  });
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  const departamentoOptions = useMemo(
    () => [
      { value: '', label: 'Todos os departamentos' },
      ...(departamentos ?? []).map((d) => ({ value: d.id, label: d.nome })),
    ],
    [departamentos],
  );

  const dossieOptions = useMemo(
    () => [
      { value: '', label: 'Todos os dossiês' },
      ...(dossies ?? []).map((d) => ({ value: d.id, label: d.nome })),
    ],
    [dossies],
  );

  const departamentoNomeById = useMemo(
    () => new Map((departamentos ?? []).map((d) => [d.id, d.nome])),
    [departamentos],
  );

  const dossieNomeById = useMemo(() => new Map((dossies ?? []).map((d) => [d.id, d.nome])), [dossies]);

  if (isError) {
    return <p className="text-rose-400 text-sm py-4">Erro ao carregar documentos.</p>;
  }

  const documentos = data?.data ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? PAGE_LIMIT;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
  const currentPage = data?.page ?? page;
  const filtersActive = Boolean(departamentoId) || Boolean(dossieId) || Boolean(fase) || Boolean(confidencialidade);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <label className="block text-sm text-slate-400 mb-1">Departamento</label>
          <Combobox
            value={departamentoId}
            onValueChange={(value) => {
              setDepartamentoId(value);
              setDossieId('');
              setPage(1);
            }}
            options={departamentoOptions}
            placeholder="Todos os departamentos"
          />
        </div>
        <div className="w-56">
          <label className="block text-sm text-slate-400 mb-1">Dossiê</label>
          <Combobox
            value={dossieId}
            onValueChange={(value) => {
              setDossieId(value);
              setPage(1);
            }}
            options={dossieOptions}
            placeholder="Todos os dossiês"
          />
        </div>
        <div className="w-48">
          <label className="block text-sm text-slate-400 mb-1">Fase</label>
          <Combobox
            value={fase}
            onValueChange={(value) => {
              setFase(value);
              setPage(1);
            }}
            options={FASE_OPTIONS}
            placeholder="Todas as fases"
          />
        </div>
        <div className="w-56">
          <label className="block text-sm text-slate-400 mb-1">Confidencialidade</label>
          <Combobox
            value={confidencialidade}
            onValueChange={(value) => {
              setConfidencialidade(value);
              setPage(1);
            }}
            options={CONFIDENCIALIDADE_OPTIONS}
            placeholder="Todas as confidencialidades"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Departamento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Dossiê</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Confidencialidade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fase</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Tamanho</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : documentos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <FileStack className="w-8 h-8" strokeWidth={1.5} />
                    <p>
                      {filtersActive
                        ? 'Nenhum documento encontrado com os filtros atuais.'
                        : 'Nenhum documento encontrado.'}
                    </p>
                    <p className="text-xs text-slate-600">
                      Faça o upload do primeiro documento para começar.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-medium text-slate-200 hover:text-indigo-300 transition-colors"
                    >
                      {doc.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {departamentoNomeById.get(doc.departamentoId) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {doc.dossieId ? (dossieNomeById.get(doc.dossieId) ?? '—') : <span className="italic text-slate-600">Avulso</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCIALIDADE_BADGE[doc.confidencialidade]}`}
                    >
                      {CONFIDENCIALIDADE_LABEL[doc.confidencialidade]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        doc.fase === 'CORRENTE' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {FASE_LABEL[doc.fase]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 tabular-nums">
                    {formatBytes(doc.arquivoTamanho)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => downloadDocument.mutate({ id: doc.id, filename: doc.arquivoNome })}
                        disabled={downloadDocument.isPending}
                        className="px-3 py-1 text-xs text-indigo-300 hover:text-indigo-100 border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Baixar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(doc)}
                        className="px-3 py-1 text-xs text-rose-400 hover:text-rose-200 border border-rose-800 hover:border-rose-600 rounded-lg transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>
            {total} documento{total !== 1 ? 's' : ''} · Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirm
          document={deleteTarget}
          isPending={deleteDocument.isPending}
          onConfirm={() => {
            deleteDocument.mutate(deleteTarget.id, {
              onSettled: () => setDeleteTarget(null),
            });
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
