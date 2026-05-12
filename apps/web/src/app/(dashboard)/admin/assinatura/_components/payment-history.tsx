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
    <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Histórico de Pagamentos
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : !payments?.length ? (
        <p className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum pagamento registrado ainda.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Data do Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Próx. Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Obs.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(p.paidAt)}
                  </td>
                  <td className="px-6 py-3 text-emerald-700 dark:text-emerald-400">
                    {BRL.format(Number(p.valor))}
                  </td>
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-300">
                    {formatDate(p.nextBillingDate)}
                  </td>
                  <td className="max-w-xs truncate px-6 py-3 text-slate-500 dark:text-slate-400">
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
