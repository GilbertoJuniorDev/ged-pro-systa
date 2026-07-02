'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from './user-menu';
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from './sidebar-nav-items';
import type { NavItem } from './sidebar-nav-items';
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
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly viewMode?: 'department' | 'admin' | null;
  readonly selectedDepartmentId?: string | null;
  readonly departamentos?: readonly { id: string; nome: string }[];
}

interface AccordionItemProps {
  readonly item: NavItem;
  readonly pathname: string;
  readonly pendingHref: string | null;
  readonly onLinkClick: (href: string) => void;
}

function AccordionItem({ item, pathname, pendingHref, onLinkClick }: AccordionItemProps) {
  const isParentActive =
    pathname === item.href ||
    (item.children != null &&
      item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/')));

  if (!item.children || item.children.length === 0) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const isPending = pendingHref === item.href;
    return (
      <Link
        href={item.href}
        onClick={() => onLinkClick(item.href)}
        className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ease-in-out ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        }`}
      >
        {isPending ? (
          <Spinner size="sm" className="mr-3 text-indigo-400" />
        ) : (
          <svg className="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {item.iconPaths.map((d, i) => (
              <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
            ))}
          </svg>
        )}
        {item.label}
      </Link>
    );
  }

  const isPending = pendingHref === item.href;

  return (
    <div>
      <Link
        href={item.href}
        onClick={() => onLinkClick(item.href)}
        className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ease-in-out ${
          isParentActive
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        }`}
      >
        {isPending ? (
          <Spinner size="sm" className="mr-3 text-indigo-400" />
        ) : (
          <svg className="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {item.iconPaths.map((d, i) => (
              <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
            ))}
          </svg>
        )}
        {item.label}
      </Link>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isParentActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-1 space-y-0.5 pb-1">
            {item.children.map((child) => {
              const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
              const isChildPending = pendingHref === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => onLinkClick(child.href)}
                  className={`flex items-center pl-9 pr-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ease-in-out ${
                    isChildActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  {isChildPending ? (
                    <Spinner size="sm" className="mr-2.5 text-indigo-400" />
                  ) : (
                    <svg className="w-4 h-4 mr-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      {child.iconPaths.map((d, i) => (
                        <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                      ))}
                    </svg>
                  )}
                  {child.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function matchesRequiredRole(requiredRole: NavItem['requiredRole'], role?: string): boolean {
  if (requiredRole == null) return true;
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return allowedRoles.some((allowedRole) => allowedRole === role);
}

export function Sidebar({
  user,
  isOpen,
  onClose,
  viewMode,
  selectedDepartmentId,
  departamentos,
}: SidebarProps) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pathname = usePathname();
  const { startNavigation } = useNavigation();
  const { hasModuleAccess } = usePermissions();
  const canSeeAdminNav = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => item.moduloSlug == null || hasModuleAccess(item.moduloSlug),
  );

  const visibleAdminNavItems = ADMIN_NAV_ITEMS.filter((item) =>
    matchesRequiredRole(item.requiredRole, user.role),
  ).map((item) => ({
    ...item,
    children: item.children?.filter((child) => matchesRequiredRole(child.requiredRole, user.role)),
  }));

  const currentDepartmentName = departamentos?.find((d) => d.id === selectedDepartmentId)?.nome;

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function handleLinkClick(href: string) {
    if (href !== pathname) {
      setPendingHref(href);
      startNavigation();
    }
    onClose();
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
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none">
          {viewMode !== 'admin' &&
            visibleNavItems.map((item) => {
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

          {canSeeAdminNav && (
            <>
              <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-600">
                Sistema
              </div>
              {visibleAdminNavItems.map((item) => (
                <AccordionItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  pendingHref={pendingHref}
                  onLinkClick={handleLinkClick}
                />
              ))}
            </>
          )}
        </nav>

        <div className="space-y-3 border-t border-slate-200 p-3 dark:border-slate-700/50">
          <div className="flex justify-end px-1">
            <ThemeToggle />
          </div>
          {(currentDepartmentName != null || viewMode === 'admin') && (
            <div className="flex items-center gap-1.5 px-2 text-[11px] text-slate-500 dark:text-slate-500">
              <svg
                className="h-3 w-3 shrink-0 opacity-70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {viewMode === 'admin' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M19 21H5m0 0H3m8-14h.01M11 11h.01M11 15h.01M7 11h.01M7 15h.01M15 11h.01M15 15h.01"
                  />
                )}
              </svg>
              <span className="truncate">
                {viewMode === 'admin' ? 'Visualização Admin' : currentDepartmentName}
              </span>
            </div>
          )}
          <UserMenu user={user} departamentos={departamentos} />
        </div>
      </aside>

      {isOpen && (
        <div
          id="sidebarOverlay"
          className="fixed inset-0 z-20 animate-fade-in bg-slate-900/30 backdrop-blur-sm md:hidden dark:bg-slate-950/60"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
}
