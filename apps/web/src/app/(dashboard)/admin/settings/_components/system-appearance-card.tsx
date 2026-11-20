import { NavLinkButton } from '@/components/ui/nav-link-button';

export function SystemAppearanceCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-muted-foreground hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h14a2 2 0 012 2v12a4 4 0 01-4 4H7zm0 0h10M9 7h6M9 11h6M9 15h3"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Aparência do Sistema</h3>
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
            Cores e Logo
          </span>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Personalize a paleta de cores e o logo usados na área administrativa e na tela de login.
      </p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/aparencia-sistema"
          className="block w-full rounded-lg bg-primary-soft px-4 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          Editar Aparência
        </NavLinkButton>
      </div>
    </div>
  );
}
