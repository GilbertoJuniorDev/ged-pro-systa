'use client';

import { useState } from 'react';
import { PermissaoList } from '@/components/admin/permissoes/permissao-list';
import { CreatePermissaoDialog } from '@/components/admin/permissoes/create-permissao-dialog';

export function PermissoesPageClient() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Permissões</h2>
          <p className="text-muted-foreground">Gerencie as permissões granulares do sistema.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium rounded-xl transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Permissão
        </button>
      </div>

      <PermissaoList />

      {showCreate && <CreatePermissaoDialog onClose={() => setShowCreate(false)} />}
    </main>
  );
}
