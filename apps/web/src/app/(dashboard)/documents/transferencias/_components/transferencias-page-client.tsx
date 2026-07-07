'use client';

import { TransferenciaList } from '@/components/documents/transferencia-list';

export function TransferenciasPageClient() {
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Transferências</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Documentos na fase Corrente aguardando transferência para a fase Intermediária. A
          transferência registra a data de mudança de fase e pode ser feita manualmente antes do
          prazo, quando necessário.
        </p>
      </div>

      <TransferenciaList />
    </main>
  );
}
