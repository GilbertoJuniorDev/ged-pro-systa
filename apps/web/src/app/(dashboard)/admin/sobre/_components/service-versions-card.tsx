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
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center mb-6">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Versões dos Serviços</h3>
          <p className="text-sm text-muted-foreground">Componentes do sistema</p>
        </div>
      </div>

      <dl className="space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold text-foreground">
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
