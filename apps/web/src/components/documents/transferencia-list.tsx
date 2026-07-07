'use client';

import { useMemo, useState } from 'react';
import type { DocumentDto } from '@/types';
import { useDocuments, useTransferDocument } from '@/hooks/use-documents';
import { useDepartments } from '@/hooks/use-departments';
import { useDocumentSeries } from '@/hooks/use-document-series';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';

const PAGE_LIMIT = 20;
const TABLE_COLUMN_COUNT = 7;

// ─── Subcomponentes ─────────────────────────────────────────────────────────

interface TransferConfirmProps {
  document: DocumentDto;
  serieLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function TransferConfirm({ document, serieLabel, onConfirm, onCancel, isPending }: TransferConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-slate-100 font-semibold mb-1">Transferir documento?</p>
        <p className="text-slate-400 text-sm mb-4">
          O documento <span className="text-slate-200 font-medium">&quot;{document.nome}&quot;</span> será
          movido da fase Corrente para Intermediário. Esta ação registra a data de transferência e
          não pode ser desfeita por aqui.
        </p>
        <dl className="mb-6 space-y-1.5 text-sm rounded-lg bg-slate-800/60 px-3 py-2.5">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Série</dt>
            <dd className="text-slate-300 text-right">{serieLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Vencimento</dt>
            <dd className="text-slate-300 text-right">
              {new Date(document.vencimentoCorrente).toLocaleDateString('pt-BR')}
            </dd>
          </div>
        </dl>
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
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Transferindo…' : 'Transferir'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800">
      {Array.from({ length: TABLE_COLUMN_COUNT }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded bg-slate-800 animate-pulse"
            style={{ width: i === TABLE_COLUMN_COUNT - 1 ? '40%' : '70%' }}
          />
        </td>
      ))}
    </tr>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  accent: string;
}

function StatTile({ label, value, accent }: StatTileProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────

export function TransferenciaList() {
  const [departamentoId, setDepartamentoId] = useState('');
  const [serieId, setSerieId] = useState('');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [page, setPage] = useState(1);
  const [transferTarget, setTransferTarget] = useState<DocumentDto | null>(null);

  const { data: departamentos } = useDepartments();
  const { data: series } = useDocumentSeries(departamentoId || undefined);
  const { data, isLoading, isError } = useDocuments({
    fase: 'CORRENTE',
    departamentoId: departamentoId || undefined,
    serieId: serieId || undefined,
    page,
    limit: PAGE_LIMIT,
  });
  const transferDocument = useTransferDocument();

  const departamentoOptions: ComboboxOption[] = useMemo(
    () => [
      { value: '', label: 'Todos os departamentos' },
      ...(departamentos?.map((d) => ({ value: d.id, label: d.nome })) ?? []),
    ],
    [departamentos],
  );

  const serieOptions: ComboboxOption[] = useMemo(
    () => [
      { value: '', label: 'Todas as séries' },
      ...(series?.map((s) => ({ value: s.id, label: `${s.codigo} — ${s.nome}` })) ?? []),
    ],
    [series],
  );

  function resolveSerieLabel(id: string): string {
    const serie = series?.find((s) => s.id === id);
    return serie ? `${serie.codigo} — ${serie.nome}` : '—';
  }

  function resolveDepartamentoNome(id: string): string {
    return departamentos?.find((d) => d.id === id)?.nome ?? '—';
  }

  if (isError) {
    return <p className="text-rose-400 text-sm py-4">Erro ao carregar documentos.</p>;
  }

  const documentos = data?.data ?? [];
  const filteredDocumentos = onlyEligible
    ? documentos.filter((d) => d.elegivelTransferencia)
    : documentos;

  const emCorrenteCount = documentos.length;
  const elegiveisCount = documentos.filter((d) => d.elegivelTransferencia).length;

  const total = data?.total ?? 0;
  const limit = data?.limit ?? PAGE_LIMIT;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
  const currentPage = data?.page ?? page;

  const filtersActive = Boolean(departamentoId) || Boolean(serieId) || onlyEligible;

  return (
    <>
      {!isLoading && emCorrenteCount > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          <StatTile label="Em Corrente" value={emCorrenteCount} accent="text-slate-100" />
          <StatTile label="Elegíveis para Transferência" value={elegiveisCount} accent="text-emerald-400" />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <label className="block text-sm text-slate-400 mb-1">Departamento</label>
          <Combobox
            value={departamentoId}
            onValueChange={(value) => {
              setDepartamentoId(value);
              setSerieId('');
              setPage(1);
            }}
            options={departamentoOptions}
            placeholder="Todos os departamentos"
          />
        </div>
        <div className="w-64">
          <label className="block text-sm text-slate-400 mb-1">Série</label>
          <Combobox
            value={serieId}
            onValueChange={(value) => {
              setSerieId(value);
              setPage(1);
            }}
            options={serieOptions}
            placeholder="Todas as séries"
          />
        </div>
        <label className="flex items-center gap-2 pb-2.5 cursor-pointer select-none">
          <Checkbox
            checked={onlyEligible}
            onChange={(e) => {
              setOnlyEligible(e.target.checked);
            }}
          />
          <span className="text-sm text-slate-300">Mostrar apenas elegíveis</span>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Série</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Departamento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Em Corrente Desde</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Vencimento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filteredDocumentos.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMN_COUNT} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h4m-7 5h10a2 2 0 002-2V7.828a2 2 0 00-.586-1.414l-3.828-3.828A2 2 0 0012.172 2H6a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <p>
                      {filtersActive
                        ? 'Nenhum documento elegível encontrado com os filtros atuais.'
                        : 'Nenhum documento na fase corrente.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocumentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-200 font-medium">{doc.nome}</td>
                  <td className="px-4 py-3 text-slate-400">{resolveSerieLabel(doc.serieId)}</td>
                  <td className="px-4 py-3 text-slate-400">{resolveDepartamentoNome(doc.departamentoId)}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(doc.faseCorrenteDesde).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(doc.vencimentoCorrente).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        doc.elegivelTransferencia
                          ? 'bg-emerald-900/40 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {doc.elegivelTransferencia ? 'Elegível' : 'Aguardando prazo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setTransferTarget(doc)}
                      className="px-3 py-1.5 text-xs text-indigo-300 hover:text-indigo-100 border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors"
                    >
                      Transferir
                    </button>
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

      {transferTarget && (
        <TransferConfirm
          document={transferTarget}
          serieLabel={resolveSerieLabel(transferTarget.serieId)}
          isPending={transferDocument.isPending}
          onConfirm={() => {
            transferDocument.mutate(transferTarget.id, {
              onSettled: () => setTransferTarget(null),
            });
          }}
          onCancel={() => setTransferTarget(null)}
        />
      )}
    </>
  );
}
