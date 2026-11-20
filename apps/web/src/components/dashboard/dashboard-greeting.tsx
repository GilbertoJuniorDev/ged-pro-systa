'use client';

import { useSession } from 'next-auth/react';

export function DashboardGreeting() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? 'usuário';

  return (
    <>
      <h2 className="text-2xl font-bold text-foreground">
        Olá, {name}
      </h2>
      <p className="text-muted-foreground">Bem-vindo ao GED Pro.</p>
    </>
  );
}
