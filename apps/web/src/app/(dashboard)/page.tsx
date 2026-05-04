import type { Metadata } from 'next';
import { auth } from '@/lib/auth';

export const metadata: Metadata = { title: 'Dashboard — GED Pro' };

function StatCardSkeleton() {
  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-sm">
      <div className="h-4 bg-slate-800 rounded-md w-1/2 mb-4 animate-pulse" />
      <div className="h-8 bg-slate-700 rounded-md w-1/4 animate-pulse" />
    </div>
  );
}

function TableRowSkeleton({ widthClass }: { readonly widthClass: string }) {
  return (
    <div className="py-3 flex items-center justify-between">
      <div className={`h-4 bg-slate-800 rounded-md ${widthClass} animate-pulse`} />
      <div className="h-4 bg-slate-800 rounded-md w-16 animate-pulse" />
    </div>
  );
}

const TABLE_ROW_WIDTHS = ['w-1/3', 'w-1/2', 'w-1/4'] as const;

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">
          Olá, {session?.user?.name ?? 'usuário'}
        </h2>
        <p className="text-slate-400">Bem-vindo ao GED Pro.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 75}ms` }}>
            <StatCardSkeleton />
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-800/50">
          <div className="h-4 bg-slate-700 rounded-md w-48 animate-pulse" />
        </div>
        <div className="p-6 divide-y divide-slate-800">
          {TABLE_ROW_WIDTHS.map((width, i) => (
            <TableRowSkeleton key={i} widthClass={width} />
          ))}
        </div>
      </div>
    </main>
  );
}
