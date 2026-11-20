'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkTheme = resolvedTheme !== 'light';
  const nextTheme = isDarkTheme ? 'light' : 'dark';
  const label = isDarkTheme ? 'Ativar tema claro' : 'Ativar tema escuro';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      disabled={!mounted}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-70"
      aria-label={mounted ? label : 'Carregando tema'}
      title={mounted ? label : 'Carregando tema'}
    >
      {isDarkTheme ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
