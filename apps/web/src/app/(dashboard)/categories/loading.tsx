import { Skeleton } from '@/components/ui/skeleton';

export default function CategoriesLoading() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-slate-900 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
