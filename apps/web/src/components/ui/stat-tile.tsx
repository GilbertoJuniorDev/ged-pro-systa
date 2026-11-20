interface Props {
  label: string;
  value: number;
  accent: string;
}

export function StatTile({ label, value, accent }: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}
