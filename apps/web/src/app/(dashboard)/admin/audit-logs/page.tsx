import type { Metadata } from 'next';
import { AuditLogTable } from '@/components/admin/audit-logs/audit-log-table';

export const metadata: Metadata = {
  title: 'Audit Logs — GED Pro',
};

export default function AdminAuditLogsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Audit Logs</h2>
        <p className="text-slate-400">Rastreie todas as ações realizadas no sistema.</p>
      </div>
      <AuditLogTable />
    </main>
  );
}
