import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateUserForm } from '../../../../../components/admin/create-user-form';

export const metadata: Metadata = {
  title: 'Novo Usuário — GED Pro',
};

export default function AdminUserNewPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/admin/users"
            className="text-sm text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Gerenciar Usuários
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Novo Usuário</h2>
        <p className="text-slate-600 dark:text-slate-400">Preencha os dados para adicionar um novo usuário ao sistema.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CreateUserForm />
      </div>
    </main>
  );
}
