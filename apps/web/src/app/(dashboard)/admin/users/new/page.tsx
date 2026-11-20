import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateUserForm } from '../../../../../components/admin/create-user-form';

export const metadata: Metadata = {
  title: 'Novo Usuário — GED Pro',
};

export default function AdminUserNewPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/admin/users"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Gerenciar Usuários
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Novo Usuário</h1>
        <p className="text-muted-foreground">Preencha os dados para adicionar um novo usuário ao sistema.</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <CreateUserForm />
      </div>
    </main>
  );
}
