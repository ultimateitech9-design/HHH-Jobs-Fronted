const DataTable = ({ columns, rows }) => {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:px-5 sm:py-4 sm:text-xs sm:tracking-[0.22em]"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500 sm:px-5 sm:py-10">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id || row.key || index} className="transition-colors hover:bg-slate-50/80">
                  {columns.map((column) => (
                    <td key={`${column.key}-${row.id || index}`} className="px-4 py-3 text-sm text-slate-700 sm:px-5 sm:py-4">
                      {typeof column.render === 'function'
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
