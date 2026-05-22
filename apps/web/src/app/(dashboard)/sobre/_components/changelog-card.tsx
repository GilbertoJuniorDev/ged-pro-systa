interface ChangelogEntry {
  readonly version: string;
  readonly date: string;
  readonly changes: readonly string[];
}

const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: '0.0.1',
    date: '2026-05-21',
    changes: [
      'Lançamento inicial do GED Pro',
      'Gerenciamento de documentos e categorias',
      'Autenticação com JWT e refresh token',
      'Controle de permissões por módulo e usuário',
      'Suporte a tema escuro e claro',
    ],
  },
] as const;

export function ChangelogCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-1 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center mb-6">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Notas de Versão</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Histórico de alterações</p>
        </div>
      </div>

      <div className="space-y-6">
        {CHANGELOG.map((entry) => (
          <div key={entry.version}>
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
                v{entry.version}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {new Date(entry.date).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
              </span>
            </div>
            <ul className="space-y-1.5 ml-1">
              {entry.changes.map((change) => (
                <li key={change} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
