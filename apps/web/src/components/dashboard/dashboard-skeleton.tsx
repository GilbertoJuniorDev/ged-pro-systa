'use client';

import { Skeleton } from '@/components/ui/skeleton';

const STAT_CARD_KEYS = [0, 1, 2, 3] as const;
const CHART_CARD_KEYS = [0, 1, 2, 3] as const;

/**
 * Full-page dashboard loading skeleton (KPI row + chart grid shapes). Pure
 * presentational — reusable both as a route-level `loading.tsx` and as the
 * `isLoading` branch inside the client component that fetches the dashboard data.
 */
export function DashboardSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARD_KEYS.map((i) => (
          <div
            key={i}
            className="animate-slide-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
            <Skeleton className="mb-2 h-4 w-2/3" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {CHART_CARD_KEYS.map((i) => (
          <div
            key={i}
            className="animate-slide-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            style={{ animationDelay: `${(i + STAT_CARD_KEYS.length) * 75}ms` }}
          >
            <Skeleton className="mb-4 h-4 w-40" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
