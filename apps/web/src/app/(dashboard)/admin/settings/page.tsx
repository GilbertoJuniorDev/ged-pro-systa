import type { Metadata } from 'next';
import { GoogleDriveCard } from './_components/google-drive-card';
import { BackupCard } from './_components/backup-card';
import { ActivityLogsCard } from './_components/activity-logs-card';
import { ModulesCard } from './_components/modules-card';
import { UserPermissionsCard } from './_components/user-permissions-card';
import { PerformanceMonitor } from './_components/performance-monitor';

export const metadata: Metadata = {
  title: 'Configurações Admin — GED Pro',
};

export default function AdminSettingsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Configurações Administrativas</h2>
        <p className="text-slate-400">Gerencie a infraestrutura, integrações e segurança do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GoogleDriveCard />
        <BackupCard />
        <ActivityLogsCard />
        <ModulesCard />
        <UserPermissionsCard />
        <PerformanceMonitor />
      </div>
    </main>
  );
}

