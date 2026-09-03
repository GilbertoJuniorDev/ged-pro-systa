interface Props {
  columns: number;
  rows?: number;
}

export function TableSkeletonRows({ columns, rows = 3 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-200 dark:border-slate-800">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div
                className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
                style={{ width: c === 0 ? '70%' : '50%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
