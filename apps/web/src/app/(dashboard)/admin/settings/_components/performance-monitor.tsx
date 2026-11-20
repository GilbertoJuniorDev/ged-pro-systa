'use client';

import { useSystemResources } from '@/hooks/use-system-version';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes } from '@/lib/utils';

function barColor(percent: number): string {
  if (percent > 85) return 'bg-danger';
  if (percent > 60) return 'bg-warning';
  return 'bg-success';
}

function textColor(percent: number): string {
  if (percent > 85) return 'text-danger';
  if (percent > 60) return 'text-warning';
  return 'text-success';
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
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-bold ${textColor(percent)}`}>{percent.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-foreground/10">
        <div
          className={`h-2 rounded-full ${barColor(percent)}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

function ResourceGaugeSkeleton({ label }: { readonly label: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">{label}</span>
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
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm md:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">Monitores de Desempenho</h3>
        </div>
        <span
          className={`text-xs font-bold flex items-center ${
            isOnline ? 'animate-pulse text-success' : 'text-danger'
          }`}
        >
          <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-success' : 'bg-danger'}`} />
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
                  <span className="text-muted-foreground">Disco</span>
                </div>
                <p className="text-xs text-muted-foreground">Indisponível neste ambiente</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
