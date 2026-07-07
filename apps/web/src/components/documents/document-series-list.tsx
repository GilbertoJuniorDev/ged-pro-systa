'use client';

import { useMemo, useState } from 'react';
import { FolderTree } from 'lucide-react';
import type { DocumentSeriesDto } from '@/types';
import { useDocumentSeries, useDeleteDocumentSeries } from '@/hooks/use-document-series';
import { useDepartments } from '@/hooks/use-departments';
import { Combobox } from '@/components/ui/combobox';
import { EditDocumentSeriesDialog } from './edit-document-series-dialog';

// ─── Hierarquia client-side ────────────────────────────────────────────────
// A API não expõe um endpoint em árvore — recebemos a lista plana e
// agrupamos por seriePaiId aqui, renderizando raízes e descendentes indentados.

interface SeriesTreeNode {
  readonly series: DocumentSeriesDto;
  readonly children: SeriesTreeNode[];
}

function buildSeriesTree(list: DocumentSeriesDto[]): SeriesTreeNode[] {
  const idsPresentes = new Set(list.map((s) => s.id));
  const filhosPorPai = new Map<string, DocumentSeriesDto[]>();
  const raizes: DocumentSeriesDto[] = [];

  for (const serie of list) {
    if (serie.seriePaiId && idsPresentes.has(serie.seriePaiId)) {
      const irmaos = filhosPorPai.get(serie.seriePaiId) ?? [];
      irmaos.push(serie);
      filhosPorPai.set(serie.seriePaiId, irmaos);
    } else {
      raizes.push(serie);
    }
  }

  function toNode(serie: DocumentSeriesDto): SeriesTreeNode {
    const filhos = (filhosPorPai.get(serie.id) ?? [])
      .slice()
      .sort((a, b) => a.codigo.localeCompare(b.codigo))
      .map(toNode);
    return { series: serie, children: filhos };
  }

  return raizes
    .slice()
    .sort((a, b) => a.codigo.localeCompare(b.codigo))
    .map(toNode);
}

interface FlatRow {
  readonly series: DocumentSeriesDto;
  readonly depth: number;
}

function flattenTree(nodes: SeriesTreeNode[], depth = 0): FlatRow[] {
  return nodes.flatMap((node) => [
    { series: node.series, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

// ─── Subcomponentes ─────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  documentSeries: DocumentSeriesDto;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ documentSeries, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-slate-100 font-semibold mb-1">Remover série?</p>
        <p className="text-slate-400 text-sm mb-6">
          A série <span className="text-slate-200 font-medium">&quot;{documentSeries.codigo} — {documentSeries.nome}&quot;</span> será
          removida. A remoção falhará se houver documentos ou séries filhas vinculados a ela.
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
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-800 animate-pulse" style={{ width: i === 1 ? '60%' : '70%' }} />
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

export function DocumentSeriesList() {
  const [departamentoFiltro, setDepartamentoFiltro] = useState('');
  const { data: departamentos } = useDepartments();
  const {
    data: documentSeries,
    isLoading,
    isError,
  } = useDocumentSeries(departamentoFiltro || undefined);
  const deleteDocumentSeries = useDeleteDocumentSeries();
  const [editTarget, setEditTarget] = useState<DocumentSeriesDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentSeriesDto | null>(null);

  const departamentoOptions = useMemo(
    () => [
      { value: '', label: 'Todos os departamentos' },
      ...(departamentos ?? []).map((d) => ({ value: d.id, label: d.nome })),
    ],
    [departamentos],
  );

  const departamentoNomeById = useMemo(
    () => new Map((departamentos ?? []).map((d) => [d.id, d.nome])),
    [departamentos],
  );

  const flatRows = useMemo(() => {
    if (!documentSeries) return [];
    return flattenTree(buildSeriesTree(documentSeries));
  }, [documentSeries]);

  if (isError) {
    return <p className="text-rose-400 text-sm py-4">Erro ao carregar séries de classificação.</p>;
  }

  const total = documentSeries?.length ?? 0;
  const ativas = documentSeries?.filter((s) => s.isActive).length ?? 0;
  const inativas = total - ativas;

  return (
    <>
      <div className="mb-4 max-w-xs">
        <label className="block text-sm text-slate-400 mb-1" htmlFor="departamento-filtro">
          Departamento
        </label>
        <Combobox
          value={departamentoFiltro}
          onValueChange={setDepartamentoFiltro}
          options={departamentoOptions}
          placeholder="Todos os departamentos"
        />
      </div>

      {!isLoading && total > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          <StatTile label="Total" value={total} accent="text-slate-100" />
          <StatTile label="Ativas" value={ativas} accent="text-emerald-400" />
          <StatTile label="Inativas" value={inativas} accent="text-slate-500" />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Departamento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : total === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <FolderTree className="w-8 h-8" strokeWidth={1.5} />
                        <p>Nenhuma série cadastrada.</p>
                        <p className="text-xs text-slate-600">
                          Crie a primeira série de classificação para organizar os documentos.
                        </p>
                      </div>
                    </td>
                  </tr>
                )
                : flatRows.map(({ series, depth }) => (
                  <tr key={series.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{series.codigo}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ paddingLeft: depth * 20 }}
                      >
                        {depth > 0 && <span className="text-slate-600">└─</span>}
                        {series.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {departamentoNomeById.get(series.departamentoId) ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          series.isActive
                            ? 'bg-emerald-900/40 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {series.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(series)}
                          className="px-3 py-1 text-xs text-indigo-300 hover:text-indigo-100 border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(series)}
                          className="px-3 py-1 text-xs text-rose-400 hover:text-rose-200 border border-rose-800 hover:border-rose-600 rounded-lg transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditDocumentSeriesDialog documentSeries={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {deleteTarget && (
        <DeleteConfirm
          documentSeries={deleteTarget}
          isPending={deleteDocumentSeries.isPending}
          onConfirm={() => {
            deleteDocumentSeries.mutate(deleteTarget.id, {
              onSettled: () => setDeleteTarget(null),
            });
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
