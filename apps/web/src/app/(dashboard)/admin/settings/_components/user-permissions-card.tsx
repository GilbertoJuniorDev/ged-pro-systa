import { NavLinkButton } from '@/components/ui/nav-link-button';

export function UserPermissionsCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-muted-foreground hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Permissões de Usuários</h3>
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">Gestão de Perfis</span>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Atribua funções, restrinja acessos e gerencie os privilégios individuais de cada usuário.</p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/users"
          className="block w-full rounded-lg bg-primary-soft px-4 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          Gerenciar Usuários
        </NavLinkButton>
      </div>
    </div>
  );
}
