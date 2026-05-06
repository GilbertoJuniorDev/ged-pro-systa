export function GoogleDriveCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-950 dark:text-slate-100">Google Drive</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Sincronizado</span>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">Ajuste as credenciais do Client ID e o mapeamento das pastas de upload.</p>
      <div className="mt-auto">
        <button
          type="button"
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Configurar Integração
        </button>
      </div>
    </div>
  );
}
