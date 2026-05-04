import { Skeleton } from '@/components/ui/skeleton';

export default function UsersLoading() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-slate-800/30">
              <tr>
                {[0, 1, 2, 3].map((i) => (
                  <th key={i} className="text-left p-4">
                    <Skeleton className="h-4 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[0, 1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-44" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
