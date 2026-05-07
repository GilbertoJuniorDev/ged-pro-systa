'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { MobileTopBar } from './mobile-top-bar';
import { NavigationProgress } from './navigation-progress';

interface DashboardShellProps {
  readonly user: {
    readonly name?: string | null;
    readonly email?: string | null;
    readonly role?: string;
  };
  readonly children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <NavigationProgress />
      <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex h-screen min-w-0 flex-1 flex-col animate-fade-in">
        <MobileTopBar onToggle={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
