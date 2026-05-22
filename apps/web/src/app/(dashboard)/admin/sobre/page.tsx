import type { Metadata } from 'next';
import { ServiceStatusCard } from './_components/service-status-card';
import { ServiceVersionsCard } from './_components/service-versions-card';
import { DependenciesCard } from './_components/dependencies-card';

export const metadata: Metadata = {
  title: 'Versão do Sistema (Admin) — GED Pro',
};

export default function AdminSobrePage() {
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Versão do Sistema</h2>
        <p className="text-slate-600 dark:text-slate-400">Informações técnicas detalhadas sobre a infraestrutura e serviços.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ServiceStatusCard />
        <ServiceVersionsCard />
        <DependenciesCard />
      </div>
    </main>
  );
}
