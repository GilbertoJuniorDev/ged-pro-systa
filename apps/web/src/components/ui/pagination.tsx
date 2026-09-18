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
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
      <span className="tabular-nums">
        {total} {label} · Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
