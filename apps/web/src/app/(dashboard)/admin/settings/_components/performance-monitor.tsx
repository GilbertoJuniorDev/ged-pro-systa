export function PerformanceMonitor() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm p-6 md:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-rose-900/40 text-rose-400 rounded-xl flex items-center justify-center mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-100 text-lg">Monitores de Desempenho</h3>
        </div>
        <span className="animate-pulse text-xs font-bold text-emerald-400 flex items-center">
          <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
          SISTEMA ONLINE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">CPU</span>
            <span className="font-bold text-indigo-400">12%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '12%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">RAM</span>
            <span className="font-bold text-emerald-400">35%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '35%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Disco</span>
            <span className="font-bold text-rose-400">82%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div className="bg-rose-500 h-2 rounded-full" style={{ width: '82%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
