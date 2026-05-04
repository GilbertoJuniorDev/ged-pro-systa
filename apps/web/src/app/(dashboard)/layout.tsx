import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';

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

  const user: SessionUser = {
    name: session.user?.name,
    email: session.user?.email,
    role: (session.user as unknown as { role?: string })?.role,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
