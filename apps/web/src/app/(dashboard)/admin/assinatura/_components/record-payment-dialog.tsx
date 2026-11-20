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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-xl"
      >
        <h3 className="mb-4 text-lg font-bold text-foreground">
          Registrar Pagamento
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Data do pagamento *
            </span>
            <DatePicker
              value={paidAt || undefined}
              onChange={(v) => setPaidAt(v)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
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
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-foreground/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={recordPayment.isPending}
            className="rounded-xl bg-success px-4 py-2 text-sm font-medium text-background hover:bg-success/90 disabled:opacity-60"
          >
            {recordPayment.isPending ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
