import type { ArquivoStatus } from '@/types';

const META: Record<ArquivoStatus, { label: string; cls: string }> = {
  ABERTO: {
    label: 'Aberto',
    cls: 'ring-1 ring-inset ring-success/40 text-success',
  },
  FECHADO: {
    label: 'Fechado',
    cls: 'bg-foreground/5 text-muted-foreground',
  },
};

export function ArquivoStatusBadge({ status }: { status: ArquivoStatus }) {
  const meta = META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}
