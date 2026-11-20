'use client';

import { useState } from 'react';
import { DepartamentoList } from '@/components/admin/departamentos/departamento-list';
import { CreateDepartamentoDialog } from '@/components/admin/departamentos/create-departamento-dialog';

export function DepartamentosPageClient() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Departamentos</h2>
          <p className="text-muted-foreground">
            Defina os departamentos da empresa. Usuários vinculados a um departamento têm o
            acesso segmentado por esse setor.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium rounded-xl transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Departamento
        </button>
      </div>

      <DepartamentoList />

      {showCreate && <CreateDepartamentoDialog onClose={() => setShowCreate(false)} />}
    </main>
  );
}
