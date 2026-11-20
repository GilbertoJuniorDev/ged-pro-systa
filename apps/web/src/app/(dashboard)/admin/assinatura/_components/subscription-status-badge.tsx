import type { SubscriptionStatus } from '@/types';

const META: Record<
  SubscriptionStatus,
  { label: string; cls: string }
> = {
  ACTIVE: {
    label: 'Ativa',
    cls: 'ring-1 ring-inset ring-success/40 text-success',
  },
  TRIAL: {
    label: 'Em Teste',
    cls: 'bg-info/10 text-info',
  },
  SUSPENDED: {
    label: 'Suspensa',
    cls: 'ring-1 ring-inset ring-warning/40 text-warning',
  },
  OVERDUE: {
    label: 'Vencida',
    cls: 'ring-1 ring-inset ring-warning/40 text-warning',
  },
  CANCELLED: {
    label: 'Cancelada',
    cls: 'bg-danger/10 text-danger',
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
