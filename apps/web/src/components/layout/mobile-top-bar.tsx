'use client';

import { ThemeToggle } from './theme-toggle';

interface MobileTopBarProps {
  readonly onToggle: () => void;
}

export function MobileTopBar({ onToggle }: MobileTopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Abrir menu"
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span className="text-lg font-bold tracking-tight text-primary">GED Pro</span>

      <ThemeToggle />
    </header>
  );
}
