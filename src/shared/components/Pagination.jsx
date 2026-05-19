const Pagination = ({ page, totalPages, onChange, className = '' }) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 pt-2 ${className}`.trim()}>
      <span className="text-xs font-semibold text-slate-500">
        Page <span className="text-slate-800">{page}</span> of <span className="text-slate-800">{totalPages}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
