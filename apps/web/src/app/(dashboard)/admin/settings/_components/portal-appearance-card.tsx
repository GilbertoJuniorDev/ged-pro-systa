import { NavLinkButton } from '@/components/ui/nav-link-button';

export function PortalAppearanceCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c1.657 0 3-4.03 3-9s-1.343-9-3-9-3 4.03-3 9 1.343 9 3 9zM3 12h18"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-950 dark:text-slate-100">Aparência do Portal</h3>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
            Portal Público
          </span>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Personalize cores, logo e textos do portal público de documentos — independente do
        tema do sistema.
      </p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/aparencia-portal"
          className="block w-full rounded-lg bg-sky-50 px-4 py-2 text-left text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
        >
          Editar Portal
        </NavLinkButton>
      </div>
    </div>
  );
}
