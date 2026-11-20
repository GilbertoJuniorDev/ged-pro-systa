'use client';

import { useEffect, useMemo, useState } from 'react';
import { FolderTree } from 'lucide-react';
import type { DocumentSeriesDto } from '@/types';
import { useDocumentSeries, useDeleteDocumentSeries } from '@/hooks/use-document-series';
import { useDepartments } from '@/hooks/use-departments';
import { useAuth } from '@/hooks/use-auth';
import { isFullAccessRole } from '@/hooks/use-permissions';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-foreground font-semibold mb-1">Remover série?</p>
        <p className="text-muted-foreground text-sm mb-6">
          A série <span className="text-foreground font-medium">&quot;{documentSeries.codigo} — {documentSeries.nome}&quot;</span> será
          removida. A remoção falhará se houver documentos ou séries filhas vinculados a ela.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-danger hover:bg-danger/90 text-background rounded-lg transition-colors disabled:opacity-50"
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
    <tr className="border-b border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-border animate-pulse" style={{ width: i === 1 ? '60%' : '70%' }} />
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
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────

export function DocumentSeriesList() {
  const { user } = useAuth();
  const isAdmin = isFullAccessRole(user?.role);

  const [departamentoFiltro, setDepartamentoFiltro] = useState('');
  const { data: departamentos } = useDepartments(isAdmin);
  const {
    data: documentSeries,
    isLoading,
    isError,
  } = useDocumentSeries(departamentoFiltro || undefined);
  const deleteDocumentSeries = useDeleteDocumentSeries();
  const [editTarget, setEditTarget] = useState<DocumentSeriesDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentSeriesDto | null>(null);

  useEffect(() => {
    if (!isAdmin && user?.selectedDepartmentId) {
      setDepartamentoFiltro(user.selectedDepartmentId);
    }
  }, [isAdmin, user?.selectedDepartmentId]);

  const departamentoOptions = useMemo(
    () =>
      isAdmin
        ? [
            { value: '', label: 'Todos os departamentos' },
            ...(departamentos ?? []).map((d) => ({ value: d.id, label: d.nome })),
          ]
        : (user?.departamentos ?? [])
            .filter((d) => d.id === user?.selectedDepartmentId)
            .map((d) => ({ value: d.id, label: d.nome })),
    [isAdmin, departamentos, user?.departamentos, user?.selectedDepartmentId],
  );

  const departamentoNomeById = useMemo(
    () => new Map((departamentos ?? user?.departamentos ?? []).map((d) => [d.id, d.nome])),
    [departamentos, user?.departamentos],
  );

  const flatRows = useMemo(() => {
    if (!documentSeries) return [];
    return flattenTree(buildSeriesTree(documentSeries));
  }, [documentSeries]);

  if (isError) {
    return <p className="text-danger text-sm py-4">Erro ao carregar séries de classificação.</p>;
  }

  const total = documentSeries?.length ?? 0;
  const ativas = documentSeries?.filter((s) => s.isActive).length ?? 0;
  const inativas = total - ativas;

  return (
    <>
      <div className="mb-4 max-w-xs">
        <label className="block text-sm text-muted-foreground mb-1" htmlFor="departamento-filtro">
          Departamento
        </label>
        <Combobox
          value={departamentoFiltro}
          onValueChange={setDepartamentoFiltro}
          options={departamentoOptions}
          placeholder="Todos os departamentos"
          disabled={!isAdmin}
        />
      </div>

      {!isLoading && total > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          <StatTile label="Total" value={total} accent="text-foreground" />
          <StatTile label="Ativas" value={ativas} accent="text-success" />
          <StatTile label="Inativas" value={inativas} accent="text-muted-foreground" />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Departamento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : total === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FolderTree className="w-8 h-8" strokeWidth={1.5} />
                        <p>Nenhuma série cadastrada.</p>
                        <p className="text-xs text-muted-foreground">
                          Crie a primeira série de classificação para organizar os documentos.
                        </p>
                      </div>
                    </td>
                  </tr>
                )
                : flatRows.map(({ series, depth }) => (
                  <tr key={series.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-4 py-3 text-foreground font-mono text-xs">{series.codigo}</td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ paddingLeft: depth * 20 }}
                      >
                        {depth > 0 && <span className="text-muted-foreground">└─</span>}
                        {series.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {departamentoNomeById.get(series.departamentoId) ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          series.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-foreground/10 text-muted-foreground'
                        }`}
                      >
                        {series.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(series)}
                          className="px-3 py-1 text-xs text-primary hover:text-primary-hover border border-primary/40 hover:border-primary rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(series)}
                          className="px-3 py-1 text-xs text-danger border border-danger/40 hover:border-danger rounded-lg transition-colors"
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
