'use client';

import { Spinner } from '@/components/ui/spinner';
import { useSubscription } from '@/hooks/use-subscription';
import { useCompany } from '@/hooks/use-company';
import { SubscriptionStatusBadge } from '@/app/(dashboard)/admin/assinatura/_components/subscription-status-badge';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString('pt-BR');
}

function formatMoney(v: string): string {
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return BRL.format(n);
}

export function UserSubscriptionPageClient() {
  const { data: subscription, isLoading: loadingSub } = useSubscription();
  const { data: company, isLoading: loadingCompany } = useCompany();

  if (loadingSub || loadingCompany) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Minha Assinatura</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Visualize o status e os detalhes da assinatura desta instância.
        </p>
      </div>

      {!subscription ? (
        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-700 dark:text-slate-300">
            Nenhuma assinatura cadastrada. Contate o administrador do sistema.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          {company && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Empresa
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoRow label="Razão Social" value={company.razaoSocial} />
                <InfoRow label="CNPJ" value={formatCnpj(company.cnpj)} />
                {company.nomeFantasia && (
                  <InfoRow label="Nome Fantasia" value={company.nomeFantasia} />
                )}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Detalhes da Assinatura
              </h3>
              <SubscriptionStatusBadge status={subscription.status} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {subscription.planName && (
                <InfoRow label="Plano" value={subscription.planName} />
              )}
              <InfoRow label="Valor" value={formatMoney(subscription.valor)} />
              <InfoRow label="Início" value={formatDate(subscription.startDate)} />
              {subscription.endDate && (
                <InfoRow label="Fim" value={formatDate(subscription.endDate)} />
              )}
              <InfoRow
                label="Próximo Vencimento"
                value={formatDate(subscription.nextBillingDate)}
              />
              <InfoRow
                label="Último Pagamento"
                value={formatDate(subscription.lastPaymentDate)}
              />
            </div>

            {subscription.notes && (
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Observações
                </p>
                <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                  {subscription.notes}
                </p>
              </div>
            )}
          </section>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Para alterações na sua assinatura, contate o administrador do sistema.
          </p>
        </div>
      )}
    </main>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}

function formatCnpj(raw: string): string {
  if (raw.length !== 14) return raw;
  return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
