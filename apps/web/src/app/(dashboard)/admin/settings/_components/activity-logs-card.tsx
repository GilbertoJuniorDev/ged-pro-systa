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
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-600 transition-all p-6 flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-100">Logs de Atividade</h3>
      </div>

      <div className="space-y-2 mb-4 min-h-[56px]">
        {isLoading && (
          <>
            <div className="h-7 bg-slate-800 rounded animate-pulse" />
            <div className="h-7 bg-slate-800 rounded animate-pulse" />
          </>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="text-[11px] bg-slate-800 p-2 rounded font-mono text-slate-500">
            Nenhum log registrado.
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="text-[11px] bg-slate-800 p-2 rounded font-mono text-slate-400 truncate"
          >
            [{formatTime(log.createdAt)}] {formatLabel(log.acao, log.entidade)}
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <NavLinkButton
          href="/admin/audit-logs"
          className="block w-full text-center px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          Ver Logs Completos
        </NavLinkButton>
      </div>
    </div>
  );
}
