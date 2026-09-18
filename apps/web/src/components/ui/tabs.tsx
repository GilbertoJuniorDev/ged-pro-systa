import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface TabItem {
  readonly value: string;
  readonly label: string;
  readonly href: string;
}

interface Props {
  items: readonly TabItem[];
  active: string;
  className?: string;
}

export function Tabs({ items, active, className }: Props) {
  return (
    <div
      role="tablist"
      className={cn('flex gap-1 border-b border-slate-200 dark:border-slate-700', className)}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <Link
            key={item.value}
            href={item.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'relative -mb-px cursor-pointer px-3 py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
              isActive
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
