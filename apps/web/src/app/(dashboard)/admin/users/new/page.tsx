import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateUserForm } from '../../../../../components/admin/create-user-form';

export const metadata: Metadata = {
  title: 'Novo Usuário — GED Pro',
};

export default function AdminUserNewPage() {
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/admin/users"
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
          >
            ← Gerenciar Usuários
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Novo Usuário</h2>
        <p className="text-slate-400">Preencha os dados para adicionar um novo usuário ao sistema.</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm p-6">
        <CreateUserForm />
      </div>
    </main>
  );
}
