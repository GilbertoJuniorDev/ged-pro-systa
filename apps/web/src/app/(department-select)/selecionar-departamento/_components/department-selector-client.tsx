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
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Fundo decorativo */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-600 opacity-10 mix-blend-multiply blur-3xl dark:opacity-20" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-blue-500 opacity-10 mix-blend-multiply blur-3xl dark:opacity-15" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-4xl animate-fade-in">
          {/* Logo */}
          <div className="mb-10 flex items-center justify-center">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-md">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">GED Pro</span>
          </div>

          {/* Cabeçalho */}
          <div className="mb-10 text-center">
            <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Olá, {firstName}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Selecione um departamento para continuar
            </p>
          </div>

          {/* Grid de departamentos ou estado vazio */}
          {departamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-300 bg-white/50 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <FolderX className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Nenhum departamento vinculado
                </h2>
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
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
                      'group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-8 text-center transition-all duration-200',
                      'hover:-translate-y-0.5 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-lg',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                      'active:scale-[0.98]',
                      'dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/60 dark:focus-visible:ring-offset-slate-950',
                      isBusy && !isThisPending && 'pointer-events-none opacity-50',
                      isThisPending && 'border-indigo-500 bg-indigo-50 dark:bg-slate-700/60',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-colors duration-200',
                        'group-hover:bg-indigo-600 group-hover:text-white',
                        'dark:bg-indigo-500/10 dark:text-indigo-400',
                        isThisPending && 'bg-indigo-600 text-white',
                      )}
                    >
                      {isThisPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </span>
                    <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
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
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-indigo-500 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-500 dark:hover:text-indigo-400"
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
