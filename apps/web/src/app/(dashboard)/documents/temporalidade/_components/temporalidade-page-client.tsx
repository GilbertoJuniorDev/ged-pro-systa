'use client';

import { TemporalidadeList } from '@/components/documents/temporalidade-list';

export function TemporalidadePageClient() {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Temporalidade</h2>
        <p className="text-muted-foreground">
          Defina os prazos de guarda corrente e intermediário de cada série documental e a
          destinação final (guarda permanente ou eliminação) aplicada ao término do prazo.
        </p>
      </div>

      <TemporalidadeList />
    </main>
  );
}
