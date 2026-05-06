'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from './user-menu';
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from './sidebar-nav-items';
import { useNavigation } from '@/providers/navigation-provider';
import { usePermissions } from '@/hooks/use-permissions';
import { Spinner } from '@/components/ui/spinner';
import { ThemeToggle } from './theme-toggle';

interface SidebarProps {
  readonly user: {
    readonly name?: string | null;
    readonly email?: string | null;
    readonly role?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pathname = usePathname();
  const { startNavigation } = useNavigation();
  const { hasModuleAccess } = usePermissions();
  const isAdmin = user.role === 'ADMIN';

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => item.moduloSlug == null || hasModuleAccess(item.moduloSlug),
  );

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function handleLinkClick(href: string) {
    if (href !== pathname) {
      setPendingHref(href);
      startNavigation();
    }
    setIsOpen(false);
  }

  return (
    <>
      <aside
        className={`w-64 border-r border-slate-200 bg-white flex flex-col transition-transform duration-300 absolute z-30 h-full md:relative md:translate-x-0 dark:border-slate-700 dark:bg-slate-900 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700">
          <span className="text-xl font-bold text-indigo-600 tracking-tight dark:text-indigo-400">GED Pro</span>
          <button
            type="button"
            className="text-slate-500 transition-colors hover:text-slate-900 md:hidden dark:hover:text-slate-300"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const isPendingItem = pendingHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleLinkClick(item.href)}
                className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ease-in-out ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                {isPendingItem ? (
                  <Spinner size="sm" className="mr-3 text-indigo-400" />
                ) : (
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {item.iconPaths.map((d, i) => (
                      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                    ))}
                  </svg>
                )}
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-600">
                Sistema
              </div>
              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const isPendingItem = pendingHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleLinkClick(item.href)}
                    className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ease-in-out ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    {isPendingItem ? (
                      <Spinner size="sm" className="mr-3 text-indigo-400" />
                    ) : (
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        {item.iconPaths.map((d, i) => (
                          <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                        ))}
                      </svg>
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="space-y-3 border-t border-slate-200 p-3 dark:border-slate-700/50">
          <div className="flex justify-end px-1">
            <ThemeToggle />
          </div>
          <UserMenu user={user} />
        </div>
      </aside>

      {isOpen && (
        <div
          id="sidebarOverlay"
          className="fixed inset-0 z-20 animate-fade-in bg-slate-900/30 backdrop-blur-sm md:hidden dark:bg-slate-950/60"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        className="fixed left-4 top-4 z-10 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:text-slate-950 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
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
