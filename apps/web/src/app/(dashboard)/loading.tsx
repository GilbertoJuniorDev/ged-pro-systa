import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export default function DashboardLoading() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <DashboardSkeleton />
    </main>
  );
}
