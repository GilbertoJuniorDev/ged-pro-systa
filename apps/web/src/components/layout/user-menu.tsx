'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';

interface UserMenuProps {
  readonly user: {
    readonly name?: string | null;
    readonly email?: string | null;
    readonly role?: string;
  };
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

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-indigo-300 text-sm font-bold border border-indigo-700 shrink-0">
          {getInitials(user.name)}
        </span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
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
          className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-1 animate-scale-in origin-bottom"
        >
          <div className="px-3 py-2 border-b border-slate-700">
            <p className="text-sm font-medium text-slate-200">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <button
            role="menuitem"
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-lg transition-colors mt-1"
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
