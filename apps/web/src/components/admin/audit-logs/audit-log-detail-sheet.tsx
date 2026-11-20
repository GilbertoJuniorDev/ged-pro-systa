'use client';

import { useEffect } from 'react';
import type { AuditLogDto } from '@/types';

interface Props {
  log: AuditLogDto | null;
  onClose: () => void;
}

const ACTION_BADGE: Record<string, string> = {
  LOGIN: 'text-success border-success/30',
  LOGOUT: 'bg-foreground/10 text-muted-foreground border-border',
  CRIAR_USUARIO: 'bg-info/10 text-info border-info/30',
  ATUALIZAR_USUARIO: 'text-warning border-warning/30',
  DELETAR_USUARIO: 'bg-danger/10 text-danger border-danger/30',
  CREATE_PERMISSION: 'bg-info/10 text-info border-info/30',
  UPDATE_PERMISSION: 'text-warning border-warning/30',
  DELETE_PERMISSION: 'bg-danger/10 text-danger border-danger/30',
  ASSIGN_PERMISSION: 'bg-primary-soft text-primary border-primary/40',
  REVOKE_PERMISSION: 'bg-danger/10 text-danger border-danger/30',
};

function actionBadgeClass(acao: string): string {
  if (ACTION_BADGE[acao]) return ACTION_BADGE[acao];
  const lower = acao.toLowerCase();
  if (lower.includes('creat') || lower.includes('criar') || lower.includes('add')) {
    return 'bg-info/10 text-info border-info/30';
  }
  if (lower.includes('updat') || lower.includes('atualiz') || lower.includes('chang') || lower.includes('record')) {
    return 'text-warning border-warning/30';
  }
  if (lower.includes('delet') || lower.includes('remov') || lower.includes('revok') || lower.includes('cancel')) {
    return 'bg-danger/10 text-danger border-danger/30';
  }
  return 'bg-foreground/10 text-muted-foreground border-border';
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
        className={`fixed inset-0 z-40 bg-background/80 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do log"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-surface-elevated border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex flex-col gap-1.5">
            {log && (
              <span
                className={`inline-flex w-fit items-center rounded-md border px-2.5 py-0.5 font-mono text-xs font-medium ${actionBadgeClass(log.acao)}`}
              >
                {log.acao}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
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
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
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
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dados alterados
                    {changedCount > 0 && (
                      <span className="rounded ring-1 ring-inset ring-warning/40 px-1.5 py-0.5 text-[10px] normal-case text-warning">
                        {changedCount} campo{changedCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </h3>
                  {diff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum campo registrado.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {diff.map((item) => (
                        <DiffRow key={item.field} item={item} />
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <p className="text-sm italic text-muted-foreground">
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
      <dt className="w-36 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className={`break-all text-xs ${mono ? 'font-mono text-foreground' : 'text-muted-foreground'}`}>
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

function DiffRow({ item }: { readonly item: DiffItem }) {
  if (item.kind === 'unchanged') {
    return (
      <div className="flex gap-3 rounded-lg bg-foreground/5 px-3 py-1.5">
        <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">{item.field}</span>
        <span className="text-xs text-muted-foreground">{formatValue(item.after)}</span>
      </div>
    );
  }

  if (item.kind === 'added') {
    return (
      <div className="flex gap-3 rounded-lg border border-success/30 px-3 py-1.5">
        <span className="w-32 shrink-0 font-mono text-xs text-success">{item.field}</span>
        <span className="text-xs text-success">{formatValue(item.after)}</span>
        <span className="ml-auto shrink-0 rounded ring-1 ring-inset ring-success/40 px-1.5 py-0.5 text-[10px] text-success">
          adicionado
        </span>
      </div>
    );
  }

  if (item.kind === 'removed') {
    return (
      <div className="flex gap-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5">
        <span className="w-32 shrink-0 font-mono text-xs text-danger">{item.field}</span>
        <span className="text-xs text-danger line-through">{formatValue(item.before)}</span>
        <span className="ml-auto shrink-0 rounded bg-danger/10 px-1.5 py-0.5 text-[10px] text-danger">
          removido
        </span>
      </div>
    );
  }

  // kind === 'changed'
  return (
    <div className="space-y-1 rounded-lg border border-warning/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-warning">{item.field}</span>
        <span className="ml-auto shrink-0 rounded ring-1 ring-inset ring-warning/40 px-1.5 py-0.5 text-[10px] text-warning">
          alterado
        </span>
      </div>
      <div className="flex items-start gap-2 text-xs">
        <span className="mt-0.5 w-10 shrink-0 text-[10px] text-danger">antes</span>
        <span className="break-all text-danger line-through">{formatValue(item.before)}</span>
      </div>
      <div className="flex items-start gap-2 text-xs">
        <span className="mt-0.5 w-10 shrink-0 text-[10px] text-success">depois</span>
        <span className="break-all text-success">{formatValue(item.after)}</span>
      </div>
    </div>
  );
}
