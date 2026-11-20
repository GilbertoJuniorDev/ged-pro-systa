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
      <main className="flex flex-1 items-center justify-center bg-background">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assinatura</h2>
          <p className="text-muted-foreground">
            Gerencie a assinatura desta instância (status, datas, valor e pagamentos).
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-3">
            <SubscriptionStatusBadge status={data.status} />
            <button
              type="button"
              onClick={() => setShowPayment(true)}
              className="rounded-xl bg-success px-4 py-2 text-sm font-medium text-background hover:bg-success/90"
            >
              Registrar pagamento
            </button>
          </div>
        )}
      </div>

      {!data && (
        <div className="mb-6 rounded-lg border border-warning/30 px-4 py-3 text-sm text-warning">
          Nenhuma assinatura cadastrada. Preencha os dados abaixo para criar.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
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
            <span className="text-xs font-medium text-muted-foreground">Início *</span>
            <DatePicker
              value={form.startDate || undefined}
              onChange={(v) => update('startDate', v)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Fim</span>
            <DatePicker
              value={form.endDate || undefined}
              onChange={(v) => update('endDate', v)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Próximo vencimento</span>
            <DatePicker
              value={form.nextBillingDate || undefined}
              onChange={(v) => update('nextBillingDate', v)}
            />
          </div>
          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Observações</span>
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
                  className="rounded-xl border border-warning/30 px-4 py-2 text-sm font-medium text-warning hover:bg-warning/20 disabled:opacity-60"
                >
                  Suspender
                </button>
              )}
              {data.status !== SUBSCRIPTION_STATUS.ACTIVE && (
                <button
                  type="button"
                  disabled={reactivate.isPending}
                  onClick={() => reactivate.mutate()}
                  className="rounded-xl border border-success/30 px-4 py-2 text-sm font-medium text-success hover:bg-success/20 disabled:opacity-60"
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
                  className="rounded-xl border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/20 disabled:opacity-60"
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
            className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
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
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
