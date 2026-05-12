'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useNavigation } from '@/providers/navigation-provider';
import { Spinner } from '@/components/ui/spinner';

interface NavLinkButtonProps {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function NavLinkButton({ href, children, className = '' }: NavLinkButtonProps) {
  const pathname = usePathname();
  const { startNavigation } = useNavigation();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(false);
  }, [pathname]);

  function handleClick() {
    if (href !== pathname) {
      setIsPending(true);
      startNavigation();
    }
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {isPending ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" />
          {children}
        </span>
      ) : (
        children
      )}
    </Link>
  );
}
