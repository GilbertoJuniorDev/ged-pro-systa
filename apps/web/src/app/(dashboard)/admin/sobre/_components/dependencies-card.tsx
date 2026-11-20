'use client';

import { useAdminSystemVersion } from '@/hooks/use-system-version';
import { Skeleton } from '@/components/ui/skeleton';

export function DependenciesCard() {
  const { data, isLoading } = useAdminSystemVersion();

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center mb-6">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Dependências Principais</h3>
          <p className="text-sm text-muted-foreground">Bibliotecas e licenças</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background">
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Pacote</th>
              <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Versão</th>
              <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Licença</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-2.5 text-center"><Skeleton className="h-4 w-14 mx-auto" /></td>
                    <td className="px-4 py-2.5 text-right"><Skeleton className="h-4 w-10 ml-auto" /></td>
                  </tr>
                ))
              : data?.dependencies.map((dep) => (
                  <tr key={dep.name} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{dep.name}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-xs text-muted-foreground">{dep.version}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {dep.license}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
