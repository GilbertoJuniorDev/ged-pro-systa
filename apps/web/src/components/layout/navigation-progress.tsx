'use client';

import { useNavigation } from '@/providers/navigation-provider';

export function NavigationProgress() {
  const { isNavigating } = useNavigation();

  if (!isNavigating) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-primary-soft"
      aria-hidden="true"
    >
      <div className="h-full bg-primary animate-progress-bar" />
    </div>
  );
}
