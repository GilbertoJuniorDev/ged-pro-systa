import { NavLinkButton } from '@/components/ui/nav-link-button';

export function PortalAppearanceCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-muted-foreground hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 text-info">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c1.657 0 3-4.03 3-9s-1.343-9-3-9-3 4.03-3 9 1.343 9 3 9zM3 12h18"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Aparência do Portal</h3>
          <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
            Portal Público
          </span>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Personalize cores, logo e textos do portal público de documentos — independente do
        tema do sistema.
      </p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/aparencia-portal"
          className="block w-full rounded-lg bg-info/10 px-4 py-2 text-left text-sm font-medium text-info transition-colors hover:bg-info/20"
        >
          Editar Portal
        </NavLinkButton>
      </div>
    </div>
  );
}
