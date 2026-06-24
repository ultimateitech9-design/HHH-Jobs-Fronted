import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import GooglePagination from './GooglePagination';
import rankedSearch from '../utils/rankedSearch';

const DISPLAY_ID_LENGTH = 11;

const isIdColumn = (column = {}) => {
  const key = String(column.key || '').toLowerCase();
  const label = String(column.label || '').toLowerCase();

  return key === 'id'
    || key === 'displayid'
    || key.endsWith('_id')
    || /(^|\s)id($|\s)/.test(label);
};

const formatDisplayId = (value) => {
  const text = String(value || '');
  if (text.length <= DISPLAY_ID_LENGTH) return text;
  return text.slice(0, DISPLAY_ID_LENGTH);
};

const DataTable = ({
  columns = [],
  rows = [],
  compact = false,
  fitOnDesktop = false,
  searchable = false,
  pagination = false,
  itemsPerPage = 10,
  searchPlaceholder = 'Search...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const normalizedSearchTerm = useMemo(() => String(searchTerm || '').trim(), [searchTerm]);
  const deferredSearchTerm = useDeferredValue(normalizedSearchTerm);

  const searchKeys = useMemo(
    () => columns
      .filter((column) => column.key !== 'actions' && column.key !== 'id')
      .map((column) => column.key),
    [columns]
  );

  const filteredRows = useMemo(() => {
    if (!searchable || !deferredSearchTerm) return rows;

    return rankedSearch(rows, deferredSearchTerm, searchKeys);
  }, [rows, deferredSearchTerm, searchable, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    if (!pagination) return filteredRows;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage, pagination, itemsPerPage]);

  const displayRows = pagination ? paginatedRows : filteredRows;

  const explicitTableWidth = columns.reduce((total, column) => (
    total + (typeof column.width === 'number' ? column.width : 0)
  ), 0);
  const tableMinWidth = `${explicitTableWidth || Math.max(760, columns.length * 150)}px`;
  const desktopTableStyle = fitOnDesktop ? { tableLayout: 'fixed' } : { minWidth: tableMinWidth };
  const desktopTableClassName = 'table-fixed';
  
  // Professional tight spacing and fonts
  const headerCellClassName = compact
    ? 'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-sans'
    : 'px-4 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-slate-500 font-sans';
  const bodyCellClassName = compact
    ? 'px-3 py-2.5 align-middle text-[13px] leading-relaxed text-slate-700 font-sans'
    : 'px-4 py-3 align-middle text-[14px] leading-relaxed text-slate-700 font-sans';
  
  const mobileCardClassName = compact
    ? 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm font-sans transition-all hover:shadow-md'
    : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm font-sans transition-all hover:shadow-md';
  const mobileLabelClassName = compact
    ? 'block text-[11px] font-semibold uppercase tracking-wider text-slate-400'
    : 'block text-[12px] font-bold uppercase tracking-wider text-slate-400';
  const mobileValueClassName = compact
    ? 'mt-1.5 min-w-0 break-words text-[13px] font-medium leading-relaxed text-slate-800 [overflow-wrap:anywhere]'
    : 'mt-1.5 min-w-0 break-words text-[14px] font-medium leading-relaxed text-slate-800 [overflow-wrap:anywhere]';

  const getRowKey = (row, index) => row.id || row.key || index;
  
  const getColumnWidth = (column) => {
    if (typeof column.width === 'number') return `${column.width}px`;
    return column.width || undefined;
  };

  const getCellContentClassName = (column) => {
    const wrappingClassName = column.wrap === false
      ? 'overflow-hidden truncate whitespace-nowrap'
      : 'break-words [overflow-wrap:anywhere]';

    return `min-w-0 ${wrappingClassName} ${column.cellClassName || ''}`.trim();
  };
  
  const renderCellValue = (column, row) => {
    const value = typeof column.render === 'function'
      ? column.render(row[column.key], row)
      : row[column.key];

    if (value === null || value === undefined || value === '') return '-';

    if (column.truncateId !== false && isIdColumn(column) && ['string', 'number'].includes(typeof value)) {
      const fullValue = String(value);
      const displayValue = formatDisplayId(fullValue);

      return (
        <span title={fullValue} aria-label={fullValue}>
          {displayValue}
        </span>
      );
    }

    return value;
  };

  return (
    <div className="w-full max-w-full space-y-4 font-sans">
      
      {/* Smart Search Bar */}
      {searchable && (
        <div className="mb-4 flex flex-col gap-3 rounded-[1.15rem] border border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-[14px] font-medium text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="text-[13px] text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-800">{filteredRows.length}</span> results
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-[1.25rem] border border-slate-200/90 bg-white shadow-[0_16px_34px_rgba(15,23,42,0.06)] lg:block">
        <div className="max-w-full overflow-x-auto">
          <table className={`w-full divide-y divide-slate-200 ${desktopTableClassName}`} style={desktopTableStyle}>
            <colgroup>
              {columns.map((column) => (
                <col key={`${column.key}-col`} style={getColumnWidth(column) ? { width: getColumnWidth(column) } : undefined} />
              ))}
            </colgroup>
            <thead className="bg-slate-50/80">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left ${headerCellClassName} ${column.stickyRight ? 'sticky right-0 z-20 bg-slate-50 shadow-[-10px_0_18px_rgba(15,23,42,0.06)]' : ''}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-[14px] text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiSearch className="text-slate-300" size={24} />
                      <span>No records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                displayRows.map((row, index) => (
                  <tr key={getRowKey(row, index)} className="group transition-colors hover:bg-slate-50/60">
                    {columns.map((column) => (
                      <td
                        key={`${column.key}-${getRowKey(row, index)}`}
                        className={`${bodyCellClassName} ${column.stickyRight ? 'sticky right-0 z-10 bg-white shadow-[-10px_0_18px_rgba(15,23,42,0.06)] group-hover:bg-slate-50' : ''}`}
                      >
                        <div className={getCellContentClassName(column)}>
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

      {/* Mobile View */}
      <div className="grid gap-3 lg:hidden">
        {displayRows.length === 0 ? (
          <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-[14px] text-slate-500 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-2">
              <FiSearch className="text-slate-300" size={24} />
              <span>No records found.</span>
            </div>
          </div>
        ) : (
          displayRows.map((row, index) => (
            <article key={getRowKey(row, index)} className={mobileCardClassName}>
              <div className="grid gap-2.5">
                {columns.map((column) => (
                  <div key={`${column.key}-${getRowKey(row, index)}-card`} className={column.key === 'actions' ? 'border-t border-slate-100 pt-3 mt-1' : ''}>
                    <span className={mobileLabelClassName}>{column.label}</span>
                    <div className={`${mobileValueClassName} ${column.wrap === false ? 'whitespace-nowrap' : 'break-words [overflow-wrap:anywhere]'} ${column.cellClassName || ''}`.trim()}>
                      {renderCellValue(column, row)}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && totalPages > 1 && (
        <GooglePagination
          page={currentPage}
          totalPages={totalPages}
          onChange={setCurrentPage}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default DataTable;
