import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateUserForm } from '../../../../components/admin/create-user-form';

export const metadata: Metadata = {
  title: 'Criar Usuário — GED Pro',
};

export default function AdminUsersPage() {
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/admin/settings"
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
          >
            ← Configurações Admin
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Criar Usuário</h2>
        <p className="text-slate-400">Adicione um novo usuário ao sistema com a função desejada.</p>
      </div>

      <div className="max-w-lg">
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm p-6">
          <CreateUserForm />
        </div>
      </div>
    </main>
  );
}

