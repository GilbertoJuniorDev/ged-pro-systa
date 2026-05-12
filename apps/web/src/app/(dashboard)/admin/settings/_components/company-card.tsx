import { NavLinkButton } from '@/components/ui/nav-link-button';

export function CompanyCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0V11m-7 10h-2m0 0V11m0 10H7m4-14h2m-2 4h2"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-950 dark:text-slate-100">Dados da Empresa</h3>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
            Pessoa Jurídica
          </span>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Configure o CNPJ, razão social e dados de contato da empresa proprietária desta instância.
      </p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/empresa"
          className="block w-full rounded-lg bg-teal-50 px-4 py-2 text-left text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/50"
        >
          Editar Empresa
        </NavLinkButton>
      </div>
    </div>
  );
}
