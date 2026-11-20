'use client';

import type { LucideIcon } from 'lucide-react';

/** Semantic tone of the KPI icon chip (ADR 0002 tokens — follows Paleta × Tema). */
export type StatCardTone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

interface StatCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly tone: StatCardTone;
  readonly hint?: string;
}

// The chip holds only a decorative icon (aria-hidden), so a /10 tint is fine here.
const TONE_CHIP: Record<StatCardTone, string> = {
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
};

/** KPI card following the `backup-card.tsx` shell: rounded-2xl surface, colored icon chip, bold value. */
export function StatCard({ title, value, icon: Icon, tone, hint }: StatCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-lg">
      <div className="mb-4 flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONE_CHIP[tone]}`}>
          <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {hint !== undefined && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
