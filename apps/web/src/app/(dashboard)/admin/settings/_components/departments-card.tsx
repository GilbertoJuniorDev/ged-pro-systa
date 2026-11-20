import { NavLinkButton } from '@/components/ui/nav-link-button';

export function DepartmentsCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-muted-foreground hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 text-info">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Departamentos</h3>
          <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">Organização</span>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Cadastre os departamentos da empresa e organize os usuários por setor.</p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/departamentos"
          className="block w-full rounded-lg bg-info/10 px-4 py-2 text-left text-sm font-medium text-info transition-colors hover:bg-info/20"
        >
          Gerenciar Departamentos
        </NavLinkButton>
      </div>
    </div>
  );
}
