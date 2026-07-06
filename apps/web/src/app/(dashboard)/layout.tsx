import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SessionUser {
  name?: string | null;
  email?: string | null;
  role?: string;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!session.user?.viewMode && !session.user?.selectedDepartmentId) {
    redirect('/selecionar-departamento');
  }

  const user: SessionUser = {
    name: session.user?.name,
    email: session.user?.email,
    role: (session.user as unknown as { role?: string })?.role,
  };

  return (
    <DashboardShell
      user={user}
      viewMode={session.user?.viewMode}
      selectedDepartmentId={session.user?.selectedDepartmentId}
      departamentos={session.user?.departamentos}
    >
      {children}
    </DashboardShell>
  );
}
