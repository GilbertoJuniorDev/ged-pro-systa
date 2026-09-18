import Link from 'next/link';
import { Logo } from '@/components/branding/logo';

// Cabeçalho do portal público — tema claro explícito (sem `dark:`), independente do tema
// (dark-first) do resto do app. Cores vêm de --portal-color-* (ver portal/layout.tsx),
// totalmente separadas de --color-* (tema do sistema/dashboard).
export function PortalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/portal" className="flex items-center gap-3">
          <Logo scope="portal" variant="mark" />
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-slate-900">GED Pro</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--portal-color-primary)]">
              Portal Público
            </span>
          </div>
        </Link>

        <Link
          href="/login"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[var(--portal-color-primary)] hover:text-[var(--portal-color-primary)]"
        >
          Área restrita
        </Link>
      </div>
    </header>
  );
}
