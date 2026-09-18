import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  suggestions?: readonly string[];
  action?: ReactNode;
}

export function EmptyState({ icon, title, suggestions, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500 dark:text-slate-500">
      {icon}
      <p>{title}</p>
      {suggestions && suggestions.length > 0 && (
        <ul className="text-xs text-slate-400 dark:text-slate-600">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      )}
      {action}
    </div>
  );
}
