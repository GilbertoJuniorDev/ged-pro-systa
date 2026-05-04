import { Skeleton } from '@/components/ui/skeleton';

export default function UsersLoading() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 items-start">
        {/* Form skeleton */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 space-y-5">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-3.5 w-56 mb-5" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-10 w-full rounded-lg mt-2" />
        </div>

        {/* Table skeleton */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-44 mb-1.5" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </div>
          <div className="divide-y divide-slate-800/60">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
                <Skeleton className="h-5 w-14 rounded-full hidden md:block" />
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
