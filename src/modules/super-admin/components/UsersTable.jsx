import DataTable from '../../../shared/components/DataTable';
import { USER_ROLE_LABELS } from '../constants/userRoles';
import { formatDate } from '../utils/formatDate';
import StatusBadge from './StatusBadge';

const UsersTable = ({ rows = [], onDelete, onStatusChange, busyUserId = '' }) => {
  const columns = [
    {
      key: 'displayId',
      label: 'User ID',
      width: 112,
      cellClassName: 'font-mono text-[11px] font-semibold tabular-nums text-slate-800',
      render: (value, row) => (
        <span className="inline-flex min-w-[88px] justify-start whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11px] tracking-[0.02em]">
          {value || row.id}
        </span>
      )
    },
    { key: 'name', label: 'Name', width: 154, cellClassName: 'text-[13px] font-semibold leading-5 text-slate-900' },
    { key: 'email', label: 'Email', width: 208, cellClassName: 'break-all text-[12.5px] leading-5 text-slate-600' },
    { key: 'role', label: 'Role', width: 92, cellClassName: 'text-[12px] font-medium uppercase tracking-[0.04em] text-slate-600', render: (value) => USER_ROLE_LABELS[value] || value },
    {
      key: 'company',
      label: 'Company / Team',
      width: 148,
      cellClassName: 'text-[12.5px] leading-5 text-slate-600',
      render: (value) => <span className="inline-flex min-w-0">{value || '-'}</span>
    },
    { key: 'status', label: 'Status', width: 94, cellClassName: 'text-[12px]', render: (value) => <StatusBadge value={value} /> },
    { key: 'lastActiveAt', label: 'Last Active', width: 98, cellClassName: 'text-[12px] text-slate-500', render: (value) => formatDate(value) },
    {
      key: 'actions',
      label: 'Actions',
      width: 196,
      render: (_, row) => (
        ['super_admin', 'admin', 'hr', 'support', 'student', 'dataentry', 'accounts', 'sales', 'company_admin', 'platform', 'audit', 'campus_connect', 'retired_employee'].includes(row.role) ? (
          <div className="grid min-w-0 grid-cols-2 gap-2">
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
                  className={`inline-flex min-h-8 w-full items-center justify-center rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold transition ${toneClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                  disabled={busyUserId === row.id || isSelected}
                  onClick={() => onStatusChange?.(row, status)}
                >
                  {status === 'active' ? 'Active' : status === 'blocked' ? 'Block' : 'Ban'}
                </button>
              );
            })}
            <button
              type="button"
              className="btn-danger col-span-2 inline-flex min-h-8 w-full items-center justify-center whitespace-nowrap px-3 py-1 text-[11px]"
              onClick={() => onDelete?.(row)}
            >
              Delete
            </button>
          </div>
        ) : 'Restricted'
      )
    }
  ];

  return <DataTable columns={columns} rows={rows} compact fitOnDesktop />;
};

export default UsersTable;
