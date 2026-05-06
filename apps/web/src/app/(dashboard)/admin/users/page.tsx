import type { Metadata } from 'next';
import { UserList } from '../../../../components/admin/user-list';

export const metadata: Metadata = {
  title: 'Gerenciar Usuários — GED Pro',
};

export default function AdminUsersPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Gerenciar Usuários</h2>
        <p className="text-slate-600 dark:text-slate-400">Edite, ative/desative e remova usuários do sistema.</p>
      </div>

      <UserList />
    </main>
  );
}

