'use client';

import { useAdminSystemVersion } from '@/hooks/use-system-version';
import { Skeleton } from '@/components/ui/skeleton';

export function ServiceVersionsCard() {
  const { data, isLoading } = useAdminSystemVersion();

  const rows = [
    { label: 'Versão da Aplicação', value: data ? `v${data.version}` : null },
    { label: 'Ambiente', value: data?.environment },
    { label: 'Node.js', value: data?.nodeVersion },
    { label: 'Banco de Dados', value: data?.dbVersion },
  ] as const;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center mb-6">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Versões dos Serviços</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Componentes do sistema</p>
        </div>
      </div>

      <dl className="space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 dark:border-slate-800">
            <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</dt>
            <dd className="text-sm font-semibold text-slate-950 dark:text-slate-100">
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span className="font-mono text-xs">{value ?? '—'}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
