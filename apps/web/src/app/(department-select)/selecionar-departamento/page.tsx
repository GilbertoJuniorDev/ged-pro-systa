import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DepartmentSelectorClient } from './_components/department-selector-client';

export const metadata: Metadata = {
  title: 'Selecionar Departamento — GED Pro',
};

export default async function SelecionarDepartamentoPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <DepartmentSelectorClient
      departamentos={session.user.departamentos ?? []}
      role={session.user.role ?? ''}
      name={session.user.name ?? ''}
    />
  );
}
