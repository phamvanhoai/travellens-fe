export function AdminTableSkeleton({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-slate-100" aria-hidden="true">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <td key={columnIndex} className="p-3">
              {columnIndex === 1 ? (
                <div className="flex items-center gap-3">
                  <div className="size-10 shrink-0 animate-pulse rounded-md bg-slate-200" />
                  <div className="w-full max-w-36 space-y-2">
                    <div className="h-3.5 w-full animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ) : columnIndex === columns - 1 ? (
                <div className="flex gap-2">
                  <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-200" />
                  <div className="size-9 animate-pulse rounded-lg bg-slate-100" />
                </div>
              ) : (
                <div
                  className="h-3.5 animate-pulse rounded bg-slate-200"
                  style={{ width: `${56 + ((rowIndex + columnIndex) % 4) * 10}%`, minWidth: columnIndex === 0 ? 36 : 52 }}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
