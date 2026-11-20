interface Props {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  itemLabel: readonly [singular: string, plural: string];
}

export function Pagination({ total, page, limit, onPageChange, itemLabel }: Props) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const label = total === 1 ? itemLabel[0] : itemLabel[1];

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span className="tabular-nums">
        {total} {label} · Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="cursor-pointer rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="cursor-pointer rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
