import type { Metadata } from 'next';
import { VersionCard } from './_components/version-card';
import { SupportCard } from './_components/support-card';
import { ChangelogCard } from './_components/changelog-card';

export const metadata: Metadata = {
  title: 'Sobre o Sistema — GED Pro',
};

export default function SobrePage() {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Sobre o Sistema</h2>
        <p className="text-muted-foreground">Versão, suporte e histórico de atualizações do GED Pro.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <VersionCard />
        <SupportCard />
        <ChangelogCard />
      </div>
    </main>
  );
}
