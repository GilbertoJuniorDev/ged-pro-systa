'use client';

import { useSubscriptionPayments } from '@/hooks/use-subscription';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString('pt-BR');
}

export function PaymentHistory() {
  const { data: payments, isLoading } = useSubscriptionPayments();

  return (
    <section className="max-w-3xl rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico de Pagamentos
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-foreground/5"
            />
          ))}
        </div>
      ) : !payments?.length ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          Nenhum pagamento registrado ainda.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Data do Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Próx. Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Obs.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-foreground/5"
                >
                  <td className="px-6 py-3 font-medium text-foreground">
                    {formatDate(p.paidAt)}
                  </td>
                  <td className="px-6 py-3 text-success">
                    {BRL.format(Number(p.valor))}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {formatDate(p.nextBillingDate)}
                  </td>
                  <td className="max-w-xs truncate px-6 py-3 text-muted-foreground">
                    {p.notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
