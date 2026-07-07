'use client';

import { useState } from 'react';
import type { DestinacaoFinal, DocumentSeriesDto } from '@/types';
import { useDepartments } from '@/hooks/use-departments';
import { useDocumentSeries } from '@/hooks/use-document-series';
import { Combobox } from '@/components/ui/combobox';
import { EditTemporalidadeDialog } from './edit-temporalidade-dialog';

const DESTINACAO_LABELS: Record<DestinacaoFinal, string> = {
  GUARDA_PERMANENTE: 'Guarda Permanente',
  ELIMINACAO: 'Eliminação',
};

// Código, Série, Prazo Corrente, Prazo Intermediário, Destinação Final, Base Legal, Ações.
const COLUMN_COUNT = 7;

function formatMeses(meses: number): string {
  return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800">
      {Array.from({ length: COLUMN_COUNT }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded bg-slate-800 animate-pulse"
            style={{ width: i === COLUMN_COUNT - 1 ? '60%' : '70%' }}
          />
        </td>
      ))}
    </tr>
  );
}

export function TemporalidadeList() {
  const [departamentoId, setDepartamentoId] = useState('');
  const { data: departamentos } = useDepartments();
  const {
    data: series,
    isLoading,
    isError,
  } = useDocumentSeries(departamentoId || undefined);
  const [editTarget, setEditTarget] = useState<DocumentSeriesDto | null>(null);

  const departmentOptions = [
    { value: '', label: 'Todos os departamentos' },
    ...(departamentos ?? []).map((d) => ({ value: d.id, label: d.nome })),
  ];

  const total = series?.length ?? 0;

  return (
    <>
      <div className="mb-4">
        <Combobox
          value={departamentoId}
          onValueChange={setDepartamentoId}
          options={departmentOptions}
          placeholder="Todos os departamentos"
          searchPlaceholder="Buscar departamento…"
          className="w-full sm:w-72"
        />
      </div>

      {isError ? (
        <p className="text-rose-400 text-sm py-4">Erro ao carregar séries documentais.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Série
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Prazo Corrente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Prazo Intermediário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Destinação Final
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Base Legal
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : total === 0
                  ? (
                    <tr>
                      <td colSpan={COLUMN_COUNT} className="px-4 py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p>Nenhuma série cadastrada.</p>
                          <p className="text-xs text-slate-600">
                            Cadastre séries em Classificação primeiro.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )
                  : series?.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium tabular-nums whitespace-nowrap">
                        {s.codigo}
                      </td>
                      <td className="px-4 py-3 text-slate-200">{s.nome}</td>
                      <td className="px-4 py-3 text-slate-300 tabular-nums whitespace-nowrap">
                        {formatMeses(s.prazoCorrenteMeses)}
                      </td>
                      <td className="px-4 py-3 text-slate-300 tabular-nums whitespace-nowrap">
                        {formatMeses(s.prazoIntermediarioMeses)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.destinacaoFinal === 'GUARDA_PERMANENTE'
                              ? 'bg-emerald-900/40 text-emerald-400'
                              : 'bg-rose-900/40 text-rose-400'
                          }`}
                        >
                          {DESTINACAO_LABELS[s.destinacaoFinal]}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-slate-400 max-w-xs truncate"
                        title={s.baseLegal ?? undefined}
                      >
                        {s.baseLegal ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditTarget(s)}
                          className="px-3 py-1 text-xs text-indigo-300 hover:text-indigo-100 border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors"
                        >
                          Editar Prazos
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {editTarget && (
        <EditTemporalidadeDialog documentSeries={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </>
  );
}
