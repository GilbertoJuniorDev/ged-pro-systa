import type { ReactNode } from 'react';
import { PortalHeader } from './_components/portal-header';
import { PortalFooter } from './_components/portal-footer';

// Chrome próprio do portal público — NÃO usa DashboardShell nem checagem de auth (a rota é
// liberada em middleware.ts para visitantes anônimos e usuários logados). Tema claro
// explícito (bg-slate-50/bg-white, sem `dark:`) para não herdar o dark-first do resto do app.
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <PortalHeader />
      <main className="flex-1">{children}</main>
      <PortalFooter />
    </div>
  );
}
