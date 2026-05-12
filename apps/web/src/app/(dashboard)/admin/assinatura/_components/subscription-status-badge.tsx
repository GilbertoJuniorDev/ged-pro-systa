import type { SubscriptionStatus } from '@/types';

const META: Record<
  SubscriptionStatus,
  { label: string; cls: string }
> = {
  ACTIVE: {
    label: 'Ativa',
    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  TRIAL: {
    label: 'Em Teste',
    cls: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
  SUSPENDED: {
    label: 'Suspensa',
    cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  OVERDUE: {
    label: 'Vencida',
    cls: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  CANCELLED: {
    label: 'Cancelada',
    cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const meta = META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}
