import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateUserForm } from '../../../../components/admin/create-user-form';
import { UserList } from '../../../../components/admin/user-list';

export const metadata: Metadata = {
  title: 'Gerenciar Usuários — GED Pro',
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
        <h2 className="text-2xl font-bold text-slate-100">Gerenciar Usuários</h2>
        <p className="text-slate-400">Crie, edite, ative/desative e remova usuários do sistema.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 items-start">
        {/* Coluna esquerda — formulário de criação */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-100 mb-1">Criar Usuário</h3>
          <p className="text-xs text-slate-400 mb-5">Adicione um novo usuário ao sistema com a função desejada.</p>
          <CreateUserForm />
        </div>

        {/* Coluna direita — listagem de usuários */}
        <UserList />
      </div>
    </main>
  );
}

