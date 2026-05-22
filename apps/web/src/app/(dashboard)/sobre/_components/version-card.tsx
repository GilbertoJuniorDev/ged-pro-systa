'use client';

import { useSystemVersion } from '@/hooks/use-system-version';
import { Skeleton } from '@/components/ui/skeleton';

export function VersionCard() {
  const { data, isLoading } = useSystemVersion();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center mb-6">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Sobre o Sistema</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Informações gerais</p>
        </div>
      </div>

      <dl className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
          <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">Sistema</dt>
          <dd className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            {isLoading ? <Skeleton className="h-4 w-20" /> : (data?.appName ?? 'GED Pro')}
          </dd>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
          <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">Versão</dt>
          <dd className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            {isLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
                v{data?.version ?? '0.0.1'}
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
          <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">Ambiente</dt>
          <dd className="text-sm font-semibold capitalize text-slate-950 dark:text-slate-100">
            {isLoading ? <Skeleton className="h-4 w-24" /> : (data?.environment ?? '—')}
          </dd>
        </div>
        <div className="flex justify-between items-center py-2">
          <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">Última atualização</dt>
          <dd className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              data?.buildDate
                ? new Date(data.buildDate).toLocaleDateString('pt-BR', { dateStyle: 'medium' })
                : '—'
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
