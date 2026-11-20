import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  suggestions?: readonly string[];
  action?: ReactNode;
}

export function EmptyState({ icon, title, suggestions, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
      {icon}
      <p>{title}</p>
      {suggestions && suggestions.length > 0 && (
        <ul className="text-xs text-muted-foreground">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      )}
      {action}
    </div>
  );
}
