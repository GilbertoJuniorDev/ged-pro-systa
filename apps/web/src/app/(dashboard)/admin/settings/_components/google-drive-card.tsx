export function GoogleDriveCard() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-600 transition-all p-6 flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-blue-900/40 text-blue-400 rounded-xl flex items-center justify-center mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-100">Google Drive</h3>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full">Sincronizado</span>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-6">Ajuste as credenciais do Client ID e o mapeamento das pastas de upload.</p>
      <div className="mt-auto">
        <button
          type="button"
          className="w-full text-left px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
        >
          Configurar Integração
        </button>
      </div>
    </div>
  );
}
