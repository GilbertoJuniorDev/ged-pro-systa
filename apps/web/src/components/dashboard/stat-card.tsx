'use client';

import type { LucideIcon } from 'lucide-react';

export type StatCardAccent = 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';

interface StatCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly accent: StatCardAccent;
  readonly hint?: string;
}

const ACCENT_CHIP: Record<StatCardAccent, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
};

/** KPI card following the `backup-card.tsx` shell: rounded-2xl surface, colored icon chip, bold value. */
export function StatCard({ title, value, icon: Icon, accent, hint }: StatCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${ACCENT_CHIP[accent]}`}>
          <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
      </div>
      <p className="text-3xl font-bold text-slate-950 dark:text-slate-100">{value}</p>
      {hint !== undefined && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}
