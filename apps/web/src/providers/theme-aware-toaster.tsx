'use client';

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

export function ThemeAwareToaster() {
  const { resolvedTheme } = useTheme();
  const toasterTheme = resolvedTheme === 'light' ? 'light' : 'dark';

  return <Toaster theme={toasterTheme} richColors position="top-right" />;
}
