export function PerformanceMonitor() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Monitores de Desempenho</h3>
        </div>
        <span className="animate-pulse text-xs font-bold text-emerald-400 flex items-center">
          <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
          SISTEMA ONLINE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">CPU</span>
            <span className="font-bold text-indigo-400">12%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '12%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">RAM</span>
            <span className="font-bold text-emerald-400">35%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '35%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">Disco</span>
            <span className="font-bold text-rose-400">82%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="bg-rose-500 h-2 rounded-full" style={{ width: '82%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
