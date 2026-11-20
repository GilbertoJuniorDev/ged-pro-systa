export function BackupCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-muted-foreground hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ring-warning/40 text-warning">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Serviço de Backup</h3>
          <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-muted-foreground">Automático Ativo</span>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Gerencie rotinas de segurança e realize backups manuais instantâneos.</p>
      <div className="mt-auto">
        <button
          type="button"
          className="w-full rounded-lg bg-primary-soft px-4 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          Executar Backup Agora
        </button>
      </div>
    </div>
  );
}
