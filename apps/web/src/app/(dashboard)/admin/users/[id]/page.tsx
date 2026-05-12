import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import type { UserDto } from '@/types';
import { UserDetailClient } from './_components/user-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Usuário ${id} — GED Pro` };
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  let user: UserDto;
  try {
    user = await apiClient.get<UserDto>(`/users/${id}`, {
      token: (session?.user as unknown as { accessToken?: string })?.accessToken,
    });
  } catch {
    notFound();
  }

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Gerenciar Usuários
        </Link>
        <div className="mt-3 flex items-center gap-4">
          <div aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-base font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-600/20 dark:text-indigo-300 dark:ring-indigo-600/30">
            {user.name
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-100">{user.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      </div>

      <UserDetailClient user={user} />
    </main>
  );
}
