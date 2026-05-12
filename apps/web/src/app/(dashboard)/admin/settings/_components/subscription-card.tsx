import { NavLinkButton } from '@/components/ui/nav-link-button';

export function SubscriptionCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-950 dark:text-slate-100">Assinatura</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Gestão de Licença
          </span>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Acompanhe status, datas e valores. Registre pagamentos, suspenda, reative ou cancele a assinatura.
      </p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/assinatura"
          className="block w-full rounded-lg bg-emerald-50 px-4 py-2 text-left text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
        >
          Gerenciar Assinatura
        </NavLinkButton>
      </div>
    </div>
  );
}
