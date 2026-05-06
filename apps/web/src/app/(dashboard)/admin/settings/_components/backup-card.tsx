export function BackupCard() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-600 transition-all p-6 flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-amber-900/40 text-amber-400 rounded-xl flex items-center justify-center mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-100">Serviço de Backup</h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Automático Ativo</span>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-6">Gerencie rotinas de segurança e realize backups manuais instantâneos.</p>
      <div className="mt-auto">
        <button
          type="button"
          className="w-full text-left px-4 py-2 text-sm font-medium text-indigo-400 bg-indigo-900/30 hover:bg-indigo-900/50 rounded-lg transition-colors"
        >
          Executar Backup Agora
        </button>
      </div>
    </div>
  );
}
