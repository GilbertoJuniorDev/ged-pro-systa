'use client';

import { NavLinkButton } from '@/components/ui/nav-link-button';
import { useErrorLogs } from '@/hooks/use-error-logs';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function ErrorLogsCard() {
  const { data, isLoading } = useErrorLogs({ limit: 2, page: 1 });
  const logs = data?.data ?? [];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
      <div className="mb-4 flex items-center">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M4.062 19h15.876a2 2 0 001.732-3l-7.937-13.5a2 2 0 00-3.464 0L2.33 16a2 2 0 001.732 3z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-slate-950 dark:text-slate-100">
          Logs de Erro
        </h3>
      </div>

      <div className="mb-4 min-h-[56px] space-y-2">
        {isLoading && (
          <>
            <div className="h-7 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-7 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="rounded bg-slate-100 p-2 font-mono text-[11px] text-slate-500 dark:bg-slate-800">
            Nenhum erro registrado.
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="truncate rounded bg-slate-100 p-2 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            title={log.message}
          >
            [{formatTime(log.createdAt)}] {log.level.toUpperCase()} ·{' '}
            {truncate(log.message, 60)}
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <NavLinkButton
          href="/admin/logs"
          className="block w-full rounded-lg px-4 py-2 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Ver Logs de Erro
        </NavLinkButton>
      </div>
    </div>
  );
}
