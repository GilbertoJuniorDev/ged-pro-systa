'use client';

import { useAdminSystemVersion } from '@/hooks/use-system-version';
import { Skeleton } from '@/components/ui/skeleton';

function StatusBadge({ status }: { readonly status: 'online' | 'offline' | undefined }) {
  if (status === undefined) {
    return <Skeleton className="h-5 w-16" />;
  }

  const isOnline = status === 'online';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isOnline
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
          : 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
        aria-hidden="true"
      />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}

export function ServiceStatusCard() {
  const { data, isLoading } = useAdminSystemVersion();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center mb-6">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Status dos Serviços</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Saúde da infraestrutura</p>
        </div>
      </div>

      <dl className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
          <dt className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            API
          </dt>
          <dd><StatusBadge status={data ? 'online' : isLoading ? undefined : 'offline'} /></dd>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
          <dt className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            Banco de Dados
          </dt>
          <dd><StatusBadge status={isLoading ? undefined : data?.dbStatus} /></dd>
        </div>
        <div className="flex justify-between items-center py-2">
          <dt className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Redis (Cache)
          </dt>
          <dd><StatusBadge status={isLoading ? undefined : data?.redisStatus} /></dd>
        </div>
      </dl>
    </div>
  );
}
