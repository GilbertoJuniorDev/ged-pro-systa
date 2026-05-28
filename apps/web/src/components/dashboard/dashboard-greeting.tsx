'use client';

import { useSession } from 'next-auth/react';

export function DashboardGreeting() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? 'usuário';

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">
        Olá, {name}
      </h2>
      <p className="text-slate-600 dark:text-slate-400">Bem-vindo ao GED Pro.</p>
    </>
  );
}
