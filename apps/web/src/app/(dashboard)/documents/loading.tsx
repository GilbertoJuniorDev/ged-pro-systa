import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsLoading() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
        <div className="divide-y divide-slate-800">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
