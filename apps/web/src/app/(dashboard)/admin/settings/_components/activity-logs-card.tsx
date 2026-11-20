'use client';

import { NavLinkButton } from '@/components/ui/nav-link-button';
import { useAuditLogs } from '@/hooks/use-audit-logs';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLabel(acao: string, entidade: string | null): string {
  const label = entidade ? `${acao} — ${entidade}` : acao;
  return label.length > 45 ? `${label.slice(0, 42)}…` : label;
}

export function ActivityLogsCard() {
  const { data, isLoading } = useAuditLogs({ limit: 2, page: 1 });
  const logs = data?.data ?? [];

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-muted-foreground hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/5 text-muted-foreground">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="font-bold text-foreground">Logs de Atividade</h3>
      </div>

      <div className="space-y-2 mb-4 min-h-[56px]">
        {isLoading && (
          <>
            <div className="h-7 animate-pulse rounded bg-foreground/10" />
            <div className="h-7 animate-pulse rounded bg-foreground/10" />
          </>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="rounded bg-foreground/5 p-2 font-mono text-[11px] text-muted-foreground">
            Nenhum log registrado.
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="truncate rounded bg-foreground/5 p-2 font-mono text-[11px] text-muted-foreground"
          >
            [{formatTime(log.createdAt)}] {formatLabel(log.acao, log.entidade)}
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <NavLinkButton
          href="/admin/audit-logs"
          className="block w-full rounded-lg px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5"
        >
          Ver Logs Completos
        </NavLinkButton>
      </div>
    </div>
  );
}
