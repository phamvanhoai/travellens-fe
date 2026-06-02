import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  itemLabel = "items",
  onPageChange
}: {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}) {
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {firstItem}-{lastItem} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <PageButton
          disabled={currentPage === 1}
          label="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={17} />
        </PageButton>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
          <button
            type="button"
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={pageNumber === currentPage ? "grid size-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white" : "grid size-9 place-items-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-brand-600 hover:text-brand-600"}
          >
            {pageNumber}
          </button>
        ))}
        <PageButton
          disabled={currentPage === pageCount}
          label="Next page"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={17} />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  disabled,
  label,
  onClick
}: {
  children: React.ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={label}
    >
      {children}
    </button>
  );
}
