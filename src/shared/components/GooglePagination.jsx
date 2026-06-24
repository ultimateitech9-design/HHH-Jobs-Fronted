const buildPageWindow = (page, totalPages, maxVisiblePages) => {
  const visibleCount = Math.max(3, Number(maxVisiblePages) || 7);
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(total, Math.max(1, Number(page) || 1));

  if (total <= visibleCount) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const sideCount = Math.floor(visibleCount / 2);
  let start = Math.max(1, current - sideCount);
  let end = start + visibleCount - 1;

  if (end > total) {
    end = total;
    start = total - visibleCount + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const GooglePagination = ({
  page = 1,
  totalPages = 1,
  onChange,
  className = '',
  maxVisiblePages = 7,
  previousLabel = 'Previous',
  nextLabel = 'Next'
}) => {
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(total, Math.max(1, Number(page) || 1));

  if (total <= 1) return null;

  const pages = buildPageWindow(current, total, maxVisiblePages);

  const changePage = (nextPage) => {
    const target = Math.min(total, Math.max(1, Number(nextPage) || 1));
    if (target !== current && typeof onChange === 'function') {
      onChange(target);
    }
  };

  return (
    <nav
      className={`flex w-full justify-center ${className}`.trim()}
      aria-label="Pagination"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm sm:gap-2">
        {current > 1 ? (
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md px-2 font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/25 sm:px-3"
            onClick={() => changePage(current - 1)}
          >
            {previousLabel}
          </button>
        ) : null}

        {pages.map((pageNumber) => {
          const isActive = pageNumber === current;

          return (
            <button
              key={pageNumber}
              type="button"
              className={[
                'inline-flex h-9 min-w-8 items-center justify-center px-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/25',
                isActive
                  ? 'border-b-2 border-amber-500 text-slate-950'
                  : 'rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700'
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Page ${pageNumber}`}
              onClick={() => changePage(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}

        {current < total ? (
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md px-2 font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/25 sm:px-3"
            onClick={() => changePage(current + 1)}
          >
            {nextLabel}
          </button>
        ) : null}
      </div>
    </nav>
  );
};

export default GooglePagination;
