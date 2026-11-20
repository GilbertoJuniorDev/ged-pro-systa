'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Building2, FolderX, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Departamento {
  readonly id: string;
  readonly nome: string;
}

interface DepartmentSelectorClientProps {
  readonly departamentos: Departamento[];
  readonly role: string;
  readonly name: string;
}

export function DepartmentSelectorClient({
  departamentos,
  role,
  name,
}: DepartmentSelectorClientProps) {
  const router = useRouter();
  const { update } = useSession();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isAdminPending, setIsAdminPending] = useState(false);

  const isBusy = pendingId !== null || isAdminPending;
  const firstName = name?.trim().split(' ')[0] || 'usuário';

  async function handleSelectDepartment(departamento: Departamento) {
    if (isBusy) return;
    setPendingId(departamento.id);
    try {
      await update({ selectedDepartmentId: departamento.id, viewMode: 'department' });
      router.push('/');
    } catch {
      toast.error('Não foi possível selecionar o departamento. Tente novamente.');
      setPendingId(null);
    }
  }

  async function handleAdminAccess() {
    if (isBusy) return;
    setIsAdminPending(true);
    try {
      await update({ selectedDepartmentId: null, viewMode: 'admin' });
      router.push('/admin/settings');
    } catch {
      toast.error('Não foi possível entrar na visualização admin. Tente novamente.');
      setIsAdminPending(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      {/* Fundo decorativo */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary opacity-10 mix-blend-multiply blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-secondary opacity-10 mix-blend-multiply blur-3xl" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-4xl animate-fade-in">
          {/* Logo */}
          <div className="mb-10 flex items-center justify-center">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-md">
              <svg className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">GED Pro</span>
          </div>

          {/* Cabeçalho */}
          <div className="mb-10 text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
              Olá, {firstName}
            </h1>
            <p className="text-lg text-muted-foreground">
              Selecione um departamento para continuar
            </p>
          </div>

          {/* Grid de departamentos ou estado vazio */}
          {departamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background text-muted-foreground">
                <FolderX className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Nenhum departamento vinculado
                </h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Você ainda não está vinculado a nenhum departamento. Entre em contato com um
                  administrador para solicitar acesso.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {departamentos.map((departamento) => {
                const isThisPending = pendingId === departamento.id;
                return (
                  <button
                    key={departamento.id}
                    type="button"
                    onClick={() => handleSelectDepartment(departamento)}
                    disabled={isBusy}
                    aria-busy={isThisPending}
                    className={cn(
                      'group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface px-6 py-8 text-center transition-all duration-200',
                      'hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft hover:shadow-lg',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      'active:scale-[0.98]',
                      isBusy && !isThisPending && 'pointer-events-none opacity-50',
                      isThisPending && 'border-primary bg-primary-soft',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors duration-200',
                        'group-hover:bg-primary group-hover:text-primary-foreground',
                        isThisPending && 'bg-primary text-primary-foreground',
                      )}
                    >
                      {isThisPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </span>
                    <span className="text-base font-semibold text-foreground">
                      {departamento.nome}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Escape hatch — apenas SUPER_ADMIN */}
      {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
        <div className="relative z-10 flex justify-end px-6 pb-6 sm:px-10">
          <button
            type="button"
            onClick={handleAdminAccess}
            disabled={isBusy}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-50"
          >
            {isAdminPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            Visualização Admin
          </button>
        </div>
      )}
    </div>
  );
}
