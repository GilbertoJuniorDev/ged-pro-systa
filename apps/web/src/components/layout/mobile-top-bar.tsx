'use client';

import { ThemeToggle } from './theme-toggle';

interface MobileTopBarProps {
  readonly onToggle: () => void;
}

export function MobileTopBar({ onToggle }: MobileTopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Abrir menu"
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span className="text-lg font-bold tracking-tight text-indigo-600 dark:text-indigo-400">GED Pro</span>

      <ThemeToggle />
    </header>
  );
}
