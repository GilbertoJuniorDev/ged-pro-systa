import { NavLinkButton } from '@/components/ui/nav-link-button';

export function SystemAppearanceCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h14a2 2 0 012 2v12a4 4 0 01-4 4H7zm0 0h10M9 7h6M9 11h6M9 15h3"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-950 dark:text-slate-100">Aparência do Sistema</h3>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            Cores e Logo
          </span>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Personalize a paleta de cores e o logo usados na área administrativa e na tela de login.
      </p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/aparencia-sistema"
          className="block w-full rounded-lg bg-indigo-50 px-4 py-2 text-left text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
        >
          Editar Aparência
        </NavLinkButton>
      </div>
    </div>
  );
}
