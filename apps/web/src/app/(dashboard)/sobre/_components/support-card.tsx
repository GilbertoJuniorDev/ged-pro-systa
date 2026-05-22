export function SupportCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center mb-6">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Suporte</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Entre em contato</p>
        </div>
      </div>

      <dl className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
          <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">E-mail</dt>
          <dd className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            suporte@gedpro.com.br
          </dd>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
          <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">Horário</dt>
          <dd className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            Seg–Sex, 08h–18h
          </dd>
        </div>
        <div className="flex justify-between items-center py-2">
          <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">Documentação</dt>
          <dd className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            docs.gedpro.com.br
          </dd>
        </div>
      </dl>
    </div>
  );
}
