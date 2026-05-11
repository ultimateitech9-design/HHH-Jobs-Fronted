const DataTable = ({ columns = [], rows = [] }) => {
  const explicitTableWidth = columns.reduce((total, column) => (
    total + (typeof column.width === 'number' ? column.width : 0)
  ), 0);
  const tableMinWidth = `${explicitTableWidth || Math.max(760, columns.length * 150)}px`;
  const getRowKey = (row, index) => row.id || row.key || index;
  const getColumnWidth = (column) => {
    if (typeof column.width === 'number') return `${column.width}px`;
    return column.width || undefined;
  };
  const renderCellValue = (column, row) => {
    const value = typeof column.render === 'function'
      ? column.render(row[column.key], row)
      : row[column.key];

    return value === null || value === undefined || value === '' ? '-' : value;
  };

  return (
    <div className="w-full max-w-full">
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-slate-200" style={{ minWidth: tableMinWidth }}>
            <colgroup>
              {columns.map((column) => (
                <col key={`${column.key}-col`} style={getColumnWidth(column) ? { width: getColumnWidth(column) } : undefined} />
              ))}
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-normal text-slate-500 ${column.stickyRight ? 'sticky right-0 z-20 bg-slate-50 shadow-[-10px_0_18px_rgba(15,23,42,0.08)]' : ''}`}
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
                  <tr key={getRowKey(row, index)} className="group transition-colors hover:bg-slate-50/80">
                    {columns.map((column) => (
                      <td
                        key={`${column.key}-${getRowKey(row, index)}`}
                        className={`px-4 py-3 align-middle text-sm text-slate-700 ${column.stickyRight ? 'sticky right-0 z-10 bg-white shadow-[-10px_0_18px_rgba(15,23,42,0.08)] group-hover:bg-slate-50' : ''}`}
                      >
                        <div className={`min-w-0 break-words [overflow-wrap:anywhere] ${column.cellClassName || ''}`}>
                          {renderCellValue(column, row)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 lg:hidden">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            No records found.
          </div>
        ) : (
          rows.map((row, index) => (
            <article key={getRowKey(row, index)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid gap-2">
                {columns.map((column) => (
                  <div key={`${column.key}-${getRowKey(row, index)}-card`} className={column.key === 'actions' ? 'border-t border-slate-100 pt-2' : ''}>
                    <span className="block text-[11px] font-bold uppercase text-slate-400">{column.label}</span>
                    <div className={`mt-1 min-w-0 break-words text-sm font-semibold text-slate-800 [overflow-wrap:anywhere] ${column.cellClassName || ''}`}>
                      {renderCellValue(column, row)}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default DataTable;
