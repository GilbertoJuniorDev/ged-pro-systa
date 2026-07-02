'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  readonly user: {
    readonly name?: string | null;
    readonly email?: string | null;
    readonly role?: string;
  };
  readonly departamentos?: readonly { id: string; nome: string }[];
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserMenu({ user, departamentos }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { update } = useSession();
  const router = useRouter();
  const canSwitchDepartment = (departamentos?.length ?? 0) > 0 || user.role === 'SUPER_ADMIN';

  async function handleSwitchDepartment() {
    setIsOpen(false);
    await update({ selectedDepartmentId: null, viewMode: null });
    router.push('/selecionar-departamento');
  }

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
          {getInitials(user.name)}
        </span>
        <div className="flex-1 text-left min-w-0">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">{user.name}</p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-2 origin-bottom animate-scale-in rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          {canSwitchDepartment && (
            <button
              role="menuitem"
              type="button"
              onClick={handleSwitchDepartment}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Trocar Departamento
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
