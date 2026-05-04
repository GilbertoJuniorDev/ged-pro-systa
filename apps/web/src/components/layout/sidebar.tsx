'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from './user-menu';
import { NAV_ITEMS } from './sidebar-nav-items';

interface SidebarProps {
  readonly user: {
    readonly name?: string | null;
    readonly email?: string | null;
    readonly role?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathname = usePathname();

  return (
    <>
      <aside
        className={`bg-slate-900 dark:bg-slate-900 w-64 border-r border-slate-700 flex flex-col transition-transform duration-300 absolute z-30 h-full md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700">
          <span className="text-xl font-bold text-indigo-400 tracking-tight">GED Systa</span>
          <button
            type="button"
            className="md:hidden text-slate-500 hover:text-slate-300 transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-900/40 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700/50 p-3">
          <UserMenu user={user} />
        </div>
      </aside>

      {isOpen && (
        <div
          id="sidebarOverlay"
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        className="fixed top-4 left-4 z-10 md:hidden p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}
