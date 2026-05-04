import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-52 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-slate-900 p-6 rounded-xl border border-slate-700">
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-8 w-1/4" />
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="p-6 divide-y divide-slate-800">
          {[0, 1, 2].map((i) => (
            <div key={i} className="py-3 flex items-center justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
