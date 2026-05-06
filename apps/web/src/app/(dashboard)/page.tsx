import type { Metadata } from 'next';
import { auth } from '@/lib/auth';

export const metadata: Metadata = { title: 'Dashboard — GED Pro' };

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 h-4 w-1/2 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      <div className="h-8 w-1/4 animate-pulse rounded-md bg-slate-300 dark:bg-slate-700" />
    </div>
  );
}

function TableRowSkeleton({ widthClass }: { readonly widthClass: string }) {
  return (
    <div className="py-3 flex items-center justify-between">
      <div className={`h-4 rounded-md bg-slate-200 ${widthClass} animate-pulse dark:bg-slate-800`} />
      <div className="h-4 w-16 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

const TABLE_ROW_WIDTHS = ['w-1/3', 'w-1/2', 'w-1/4'] as const;

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">
          Olá, {session?.user?.name ?? 'usuário'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Bem-vindo ao GED Pro.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 75}ms` }}>
            <StatCardSkeleton />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="h-4 w-48 animate-pulse rounded-md bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="divide-y divide-slate-200 p-6 dark:divide-slate-800">
          {TABLE_ROW_WIDTHS.map((width, i) => (
            <TableRowSkeleton key={i} widthClass={width} />
          ))}
        </div>
      </div>
    </main>
  );
}
