import { NavLinkButton } from '@/components/ui/nav-link-button';

export function ModulesCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-muted-foreground hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Permissões de Módulos</h3>
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">Controle de Acesso</span>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Defina quais módulos do sistema estão ativos e configure o nível de acesso por perfil.</p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/modulos"
          className="block w-full rounded-lg bg-primary-soft px-4 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          Gerenciar Módulos
        </NavLinkButton>
      </div>
    </div>
  );
}
