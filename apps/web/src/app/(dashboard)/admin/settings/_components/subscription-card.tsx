import { NavLinkButton } from '@/components/ui/nav-link-button';

export function SubscriptionCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-muted-foreground hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ring-success/40 text-success">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Assinatura</h3>
          <span className="rounded-full ring-1 ring-inset ring-success/40 px-2 py-0.5 text-xs font-medium text-success">
            Gestão de Licença
          </span>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Acompanhe status, datas e valores. Registre pagamentos, suspenda, reative ou cancele a assinatura.
      </p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/assinatura"
          className="block w-full rounded-lg ring-1 ring-inset ring-success/40 px-4 py-2 text-left text-sm font-medium text-success transition-colors hover:bg-success/20"
        >
          Gerenciar Assinatura
        </NavLinkButton>
      </div>
    </div>
  );
}
