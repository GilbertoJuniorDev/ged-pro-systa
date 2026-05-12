'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { SUBSCRIPTION_STATUS } from '@/types';
import type { SubscriptionStatus } from '@/types';
import {
  useCancelSubscription,
  useReactivateSubscription,
  useSubscription,
  useSuspendSubscription,
  useUpsertSubscription,
} from '@/hooks/use-subscription';
import { SubscriptionStatusBadge } from './subscription-status-badge';
import { RecordPaymentDialog } from './record-payment-dialog';
import { PaymentHistory } from './payment-history';
import { DatePicker } from '@/components/ui/date-picker';
import { Combobox } from '@/components/ui/combobox';

interface FormState {
  status: SubscriptionStatus;
  planName: string;
  valor: string;
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  notes: string;
}

const TODAY = () => new Date().toISOString().slice(0, 10);

const EMPTY: FormState = {
  status: SUBSCRIPTION_STATUS.ACTIVE,
  planName: '',
  valor: '0.00',
  startDate: TODAY(),
  endDate: '',
  nextBillingDate: '',
  notes: '',
};

const STATUS_OPTIONS: ReadonlyArray<{ value: SubscriptionStatus; label: string }> = [
  { value: SUBSCRIPTION_STATUS.ACTIVE, label: 'Ativa' },
  { value: SUBSCRIPTION_STATUS.TRIAL, label: 'Em Teste' },
  { value: SUBSCRIPTION_STATUS.SUSPENDED, label: 'Suspensa' },
  { value: SUBSCRIPTION_STATUS.OVERDUE, label: 'Vencida' },
  { value: SUBSCRIPTION_STATUS.CANCELLED, label: 'Cancelada' },
];

export function SubscriptionAdminPageClient() {
  const { data, isLoading } = useSubscription();
  const upsert = useUpsertSubscription();
  const suspend = useSuspendSubscription();
  const reactivate = useReactivateSubscription();
  const cancel = useCancelSubscription();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        status: data.status,
        planName: data.planName ?? '',
        valor: data.valor,
        startDate: data.startDate.slice(0, 10),
        endDate: data.endDate ? data.endDate.slice(0, 10) : '',
        nextBillingDate: data.nextBillingDate ? data.nextBillingDate.slice(0, 10) : '',
        notes: data.notes ?? '',
      });
    }
  }, [data]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate({
      status: form.status,
      planName: form.planName || null,
      valor: form.valor,
      startDate: form.startDate,
      endDate: form.endDate || null,
      nextBillingDate: form.nextBillingDate || null,
      notes: form.notes || null,
    });
  };

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Assinatura</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie a assinatura desta instância (status, datas, valor e pagamentos).
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-3">
            <SubscriptionStatusBadge status={data.status} />
            <button
              type="button"
              onClick={() => setShowPayment(true)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Registrar pagamento
            </button>
          </div>
        )}
      </div>

      {!data && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          Nenhuma assinatura cadastrada. Preencha os dados abaixo para criar.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Status</span>
            <Combobox
              value={form.status}
              onValueChange={(v) => update('status', v as SubscriptionStatus)}
              options={STATUS_OPTIONS}
            />
          </div>
          <Field label="Plano (texto livre)">
            <input
              value={form.planName}
              onChange={(e) => update('planName', e.target.value)}
              className={inputCls}
              placeholder="Ex: Plano Pro Anual"
            />
          </Field>
          <Field label="Valor (R$) *">
            <input
              required
              inputMode="decimal"
              value={form.valor}
              onChange={(e) => update('valor', e.target.value)}
              className={inputCls}
              placeholder="0.00"
            />
          </Field>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Início *</span>
            <DatePicker
              value={form.startDate || undefined}
              onChange={(v) => update('startDate', v)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Fim</span>
            <DatePicker
              value={form.endDate || undefined}
              onChange={(v) => update('endDate', v)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Próximo vencimento</span>
            <DatePicker
              value={form.nextBillingDate || undefined}
              onChange={(v) => update('nextBillingDate', v)}
            />
          </div>
          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Observações</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className={inputCls}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {data ? (
            <div className="flex flex-wrap gap-2">
              {data.status !== SUBSCRIPTION_STATUS.SUSPENDED && (
                <button
                  type="button"
                  disabled={suspend.isPending}
                  onClick={() => suspend.mutate()}
                  className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60 dark:border-amber-700/60 dark:text-amber-300 dark:hover:bg-amber-900/20"
                >
                  Suspender
                </button>
              )}
              {data.status !== SUBSCRIPTION_STATUS.ACTIVE && (
                <button
                  type="button"
                  disabled={reactivate.isPending}
                  onClick={() => reactivate.mutate()}
                  className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-700/60 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                >
                  Reativar
                </button>
              )}
              {data.status !== SUBSCRIPTION_STATUS.CANCELLED && (
                <button
                  type="button"
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (confirm('Confirma o cancelamento da assinatura?')) cancel.mutate();
                  }}
                  className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-900/20"
                >
                  Cancelar
                </button>
              )}
            </div>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={upsert.isPending}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {upsert.isPending ? 'Salvando...' : data ? 'Salvar alterações' : 'Criar assinatura'}
          </button>
        </div>
      </form>

      {data && showPayment && (
        <RecordPaymentDialog subscription={data} onClose={() => setShowPayment(false)} />
      )}

      {data && (
        <div className="mt-6">
          <PaymentHistory />
        </div>
      )}
    </main>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
