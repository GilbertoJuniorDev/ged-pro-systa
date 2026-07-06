'use client';

import { useEffect } from 'react';
import type { AuditLogDto } from '@/types';

interface Props {
  log: AuditLogDto | null;
  onClose: () => void;
}

const ACTION_BADGE: Record<string, string> = {
  LOGIN: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  LOGOUT: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  CRIAR_USUARIO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  ATUALIZAR_USUARIO: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DELETAR_USUARIO: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  CREATE_PERMISSION: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  UPDATE_PERMISSION: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DELETE_PERMISSION: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  ASSIGN_PERMISSION: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  REVOKE_PERMISSION: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

function actionBadgeClass(acao: string): string {
  if (ACTION_BADGE[acao]) return ACTION_BADGE[acao];
  const lower = acao.toLowerCase();
  if (lower.includes('creat') || lower.includes('criar') || lower.includes('add')) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }
  if (lower.includes('updat') || lower.includes('atualiz') || lower.includes('chang') || lower.includes('record')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  if (lower.includes('delet') || lower.includes('remov') || lower.includes('revok') || lower.includes('cancel')) {
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }
  return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

type DiffKind = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffItem {
  readonly field: string;
  readonly before: unknown;
  readonly after: unknown;
  readonly kind: DiffKind;
}

function buildDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): DiffItem[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return Array.from(keys).map((field) => {
    const bVal = before?.[field];
    const aVal = after?.[field];
    let kind: DiffKind;
    if (before === null) {
      kind = 'added';
    } else if (after === null) {
      kind = 'removed';
    } else if (!(field in (before ?? {}))) {
      kind = 'added';
    } else if (!(field in (after ?? {}))) {
      kind = 'removed';
    } else if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      kind = 'changed';
    } else {
      kind = 'unchanged';
    }
    return { field, before: bVal, after: aVal, kind } satisfies DiffItem;
  });
}

export function AuditLogDetailSheet({ log, onClose }: Props) {
  const isOpen = log !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const diff = log !== null ? buildDiff(log.dadosAnteriores, log.dadosNovos) : [];
  const hasDiff = diff.length > 0;
  const changedCount = diff.filter((d) => d.kind !== 'unchanged').length;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do log"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-slate-950 border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            {log && (
              <span
                className={`inline-flex w-fit items-center rounded-md border px-2.5 py-0.5 font-mono text-xs font-medium ${actionBadgeClass(log.acao)}`}
              >
                {log.acao}
              </span>
            )}
            <p className="text-xs text-slate-500">
              {log
                ? new Date(log.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {log && (
            <>
              {/* Metadados */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Metadados
                </h3>
                <dl className="space-y-2.5">
                  <MetaRow label="ID do log" value={log.id} mono />
                  <MetaRow label="Entidade" value={log.entidade} />
                  <MetaRow label="ID da entidade" value={log.entidadeId} mono />
                  <MetaRow label="Usuário (ID)" value={log.usuarioId} mono />
                  <MetaRow label="IP cliente" value={log.ipCliente} mono />
                  <MetaRow label="User-Agent" value={log.userAgent} />
                </dl>
              </section>

              {/* Diff */}
              {hasDiff ? (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Dados alterados
                    {changedCount > 0 && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] normal-case text-amber-400">
                        {changedCount} campo{changedCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </h3>
                  {diff.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum campo registrado.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {diff.map((item) => (
                        <DiffRow key={item.field} item={item} />
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <p className="text-sm italic text-slate-500">
                  Nenhum dado de alteração registrado para esta ação.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function MetaRow({
  label,
  value,
  mono = false,
}: {
  readonly label: string;
  readonly value: string | null | undefined;
  readonly mono?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <dt className="w-36 shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className={`break-all text-xs ${mono ? 'font-mono text-slate-300' : 'text-slate-400'}`}>
        {value ?? <span className="text-slate-600">—</span>}
      </dd>
    </div>
  );
}

function DiffRow({ item }: { readonly item: DiffItem }) {
  if (item.kind === 'unchanged') {
    return (
      <div className="flex gap-3 rounded-lg bg-slate-900/50 px-3 py-1.5">
        <span className="w-32 shrink-0 font-mono text-xs text-slate-500">{item.field}</span>
        <span className="text-xs text-slate-500">{formatValue(item.after)}</span>
      </div>
    );
  }

  if (item.kind === 'added') {
    return (
      <div className="flex gap-3 rounded-lg border border-emerald-900/30 bg-emerald-950/40 px-3 py-1.5">
        <span className="w-32 shrink-0 font-mono text-xs text-emerald-400">{item.field}</span>
        <span className="text-xs text-emerald-300">{formatValue(item.after)}</span>
        <span className="ml-auto shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
          adicionado
        </span>
      </div>
    );
  }

  if (item.kind === 'removed') {
    return (
      <div className="flex gap-3 rounded-lg border border-rose-900/30 bg-rose-950/40 px-3 py-1.5">
        <span className="w-32 shrink-0 font-mono text-xs text-rose-400">{item.field}</span>
        <span className="text-xs text-rose-400 line-through">{formatValue(item.before)}</span>
        <span className="ml-auto shrink-0 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-400">
          removido
        </span>
      </div>
    );
  }

  // kind === 'changed'
  return (
    <div className="space-y-1 rounded-lg border border-amber-900/20 bg-amber-950/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-amber-400">{item.field}</span>
        <span className="ml-auto shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
          alterado
        </span>
      </div>
      <div className="flex items-start gap-2 text-xs">
        <span className="mt-0.5 w-10 shrink-0 text-[10px] text-rose-500">antes</span>
        <span className="break-all text-rose-400 line-through">{formatValue(item.before)}</span>
      </div>
      <div className="flex items-start gap-2 text-xs">
        <span className="mt-0.5 w-10 shrink-0 text-[10px] text-emerald-500">depois</span>
        <span className="break-all text-emerald-300">{formatValue(item.after)}</span>
      </div>
    </div>
  );
}
