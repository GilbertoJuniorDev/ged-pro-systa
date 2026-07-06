import { NavLinkButton } from '@/components/ui/nav-link-button';

export function DepartmentsCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-950 dark:text-slate-100">Departamentos</h3>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">Organização</span>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">Cadastre os departamentos da empresa e organize os usuários por setor.</p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/departamentos"
          className="block w-full rounded-lg bg-sky-50 px-4 py-2 text-left text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
        >
          Gerenciar Departamentos
        </NavLinkButton>
      </div>
    </div>
  );
}
