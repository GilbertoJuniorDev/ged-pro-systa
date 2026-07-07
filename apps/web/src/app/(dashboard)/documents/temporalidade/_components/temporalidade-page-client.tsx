'use client';

import { TemporalidadeList } from '@/components/documents/temporalidade-list';

export function TemporalidadePageClient() {
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Temporalidade</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Defina os prazos de guarda corrente e intermediário de cada série documental e a
          destinação final (guarda permanente ou eliminação) aplicada ao término do prazo.
        </p>
      </div>

      <TemporalidadeList />
    </main>
  );
}
