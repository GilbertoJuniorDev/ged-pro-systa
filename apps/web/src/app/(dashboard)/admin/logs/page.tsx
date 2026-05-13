import type { Metadata } from 'next';
import { ErrorLogTable } from '@/components/admin/error-logs/error-log-table';

export const metadata: Metadata = {
  title: 'Logs de Erro — GED Pro',
};

export default function AdminErrorLogsPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">
          Logs de Erro
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Erros do backend (API) e do frontend (web) capturados nos últimos 30
          dias.
        </p>
      </div>
      <ErrorLogTable />
    </main>
  );
}
