import DataTable from '../../../shared/components/DataTable';
import { USER_ROLE_LABELS } from '../constants/userRoles';
import { formatDateTime } from '../utils/formatDate';
import StatusBadge from './StatusBadge';

const UsersTable = ({ rows = [], onDelete, onStatusChange, busyUserId = '' }) => {
  const columns = [
    {
      key: 'displayId',
      label: 'User ID',
      width: 138,
      cellClassName: 'font-mono text-[12px] font-semibold tabular-nums text-slate-900',
      render: (value, row) => (
        <span className="inline-flex min-w-[104px] justify-start whitespace-nowrap rounded-md bg-slate-50 px-2 py-1">
          {value || row.id}
        </span>
      )
    },
    { key: 'name', label: 'Name', width: 135, cellClassName: 'font-semibold text-slate-900' },
    { key: 'email', label: 'Email', width: 250, cellClassName: 'break-all text-slate-600' },
    { key: 'role', label: 'Role', width: 125, render: (value) => USER_ROLE_LABELS[value] || value },
    {
      key: 'company',
      label: 'Company / Team',
      width: 220,
      cellClassName: 'text-slate-600',
      render: (value) => <span className="inline-flex min-w-[160px]">{value || '-'}</span>
    },
    { key: 'status', label: 'Status', width: 105, render: (value) => <StatusBadge value={value} /> },
    { key: 'lastActiveAt', label: 'Last Active', width: 120, render: (value) => formatDateTime(value) },
    {
      key: 'actions',
      label: 'Actions',
      width: 268,
      stickyRight: true,
      render: (_, row) => (
        ['super_admin', 'admin', 'hr', 'support', 'student', 'dataentry', 'accounts', 'sales', 'company_admin', 'platform', 'audit', 'campus_connect', 'retired_employee'].includes(row.role) ? (
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-2">
            {['active', 'blocked', 'banned'].map((status) => {
              const isSelected = row.status === status;
              const toneClassName = status === 'banned'
                ? (isSelected ? 'bg-rose-100 text-rose-700 shadow-sm' : 'text-rose-600 hover:text-rose-700')
                : status === 'blocked'
                  ? (isSelected ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-amber-700 hover:text-amber-800')
                  : (isSelected ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800');
              return (
                <button
                  key={status}
                  type="button"
                  className={`inline-flex min-h-9 min-w-[68px] items-center justify-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold transition ${toneClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                  disabled={busyUserId === row.id || isSelected}
                  onClick={() => onStatusChange?.(row, status)}
                >
                  {status === 'active' ? 'Active' : status === 'blocked' ? 'Block' : 'Ban'}
                </button>
              );
            })}
            <button
              type="button"
              className="btn-danger inline-flex min-h-9 min-w-[78px] items-center justify-center whitespace-nowrap px-3 py-1.5 text-xs"
              onClick={() => onDelete?.(row)}
            >
              Delete
            </button>
          </div>
        ) : 'Restricted'
      )
    }
  ];

  return <DataTable columns={columns} rows={rows} />;
};

export default UsersTable;
