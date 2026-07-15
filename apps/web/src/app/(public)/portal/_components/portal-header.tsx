import Link from 'next/link';

// Cabeçalho do portal público — tema claro explícito (sem `dark:`), independente do tema
// (dark-first) do resto do app. Ver apps/web/src/app/(auth)/login/_components/login-page-client.tsx
// para a marca original (ícone indigo + wordmark "GED Pro") que este componente adapta.
export function PortalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/portal" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-200">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-slate-900">GED Pro</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-600">
              Portal Público
            </span>
          </div>
        </Link>

        <Link
          href="/login"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
        >
          Área restrita
        </Link>
      </div>
    </header>
  );
}
