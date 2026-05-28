'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextValue {
  readonly isNavigating: boolean;
  readonly startNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  isNavigating: false,
  startNavigation: () => undefined,
});

interface NavigationProviderProps {
  readonly children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  function startNavigation() {
    setIsNavigating(true);
  }

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  return useContext(NavigationContext);
}
