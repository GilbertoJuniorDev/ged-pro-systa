'use client';

import { useState } from 'react';
import type { SubscriptionDto } from '@/types';
import { useRecordPayment } from '@/hooks/use-subscription';
import { DatePicker } from '@/components/ui/date-picker';

interface Props {
  readonly subscription: SubscriptionDto;
  readonly onClose: () => void;
}

export function RecordPaymentDialog({ subscription, onClose }: Props) {
  const recordPayment = useRecordPayment();
  const today = new Date().toISOString().slice(0, 10);

  const [paidAt, setPaidAt] = useState<string>(today);
  const [nextBillingDate, setNextBillingDate] = useState<string>(
    subscription.nextBillingDate ?? '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPayment.mutate(
      {
        paidAt,
        nextBillingDate: nextBillingDate || null,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-slate-100">
          Registrar Pagamento
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Data do pagamento *
            </span>
            <DatePicker
              value={paidAt || undefined}
              onChange={(v) => setPaidAt(v)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Próximo vencimento
            </span>
            <DatePicker
              value={nextBillingDate || undefined}
              onChange={(v) => setNextBillingDate(v)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={recordPayment.isPending}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {recordPayment.isPending ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
