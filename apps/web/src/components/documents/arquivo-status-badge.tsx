import type { ArquivoStatus } from '@/types';

const META: Record<ArquivoStatus, { label: string; cls: string }> = {
  ABERTO: {
    label: 'Aberto',
    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  FECHADO: {
    label: 'Fechado',
    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
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
