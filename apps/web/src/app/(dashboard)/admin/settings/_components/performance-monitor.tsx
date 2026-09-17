'use client';

import { useSystemResources } from '@/hooks/use-system-version';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes } from '@/lib/utils';

function barColor(percent: number): string {
  if (percent > 85) return 'bg-rose-500';
  if (percent > 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function textColor(percent: number): string {
  if (percent > 85) return 'text-rose-400';
  if (percent > 60) return 'text-amber-400';
  return 'text-emerald-400';
}

function ResourceGauge({
  label,
  percent,
  caption,
}: {
  readonly label: string;
  readonly percent: number;
  readonly caption?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className={`font-bold ${textColor(percent)}`}>{percent.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-2 rounded-full ${barColor(percent)}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {caption && <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{caption}</p>}
    </div>
  );
}

function ResourceGaugeSkeleton({ label }: { readonly label: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function PerformanceMonitor() {
  const { data, isLoading, isError } = useSystemResources();

  const isOnline = !isError && (isLoading || !!data);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">Monitores de Desempenho</h3>
        </div>
        <span
          className={`text-xs font-bold flex items-center ${
            isOnline ? 'animate-pulse text-emerald-400' : 'text-rose-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          {isOnline ? 'SISTEMA ONLINE' : 'SISTEMA OFFLINE'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {isLoading || !data ? (
          <>
            <ResourceGaugeSkeleton label="CPU" />
            <ResourceGaugeSkeleton label="RAM" />
            <ResourceGaugeSkeleton label="Disco" />
          </>
        ) : (
          <>
            <ResourceGauge label="CPU" percent={data.cpu.usagePercent} caption={`${data.cpu.cores} núcleos`} />
            <ResourceGauge
              label="RAM"
              percent={data.memory.usagePercent}
              caption={`${formatBytes(data.memory.usedBytes)} / ${formatBytes(data.memory.totalBytes)}`}
            />
            {data.disk.available && data.disk.usagePercent !== null ? (
              <ResourceGauge
                label="Disco"
                percent={data.disk.usagePercent}
                caption={`${formatBytes(data.disk.usedBytes ?? 0)} / ${formatBytes(data.disk.totalBytes ?? 0)}`}
              />
            ) : (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Disco</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">Indisponível neste ambiente</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
