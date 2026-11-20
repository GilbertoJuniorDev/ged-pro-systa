import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border bg-surface">
        {children}
      </tr>
    </thead>
  );
}

export function DataTableTh({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function DataTableRow({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors hover:bg-foreground/5',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableTd({
  children,
  align = 'left',
  className,
}: {
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td className={cn('px-4 py-3', align === 'right' && 'text-right', className)}>{children}</td>
  );
}
