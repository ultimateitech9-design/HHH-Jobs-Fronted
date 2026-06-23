import DataTable from '../../../shared/components/DataTable';
import { USER_ROLE_LABELS } from '../constants/userRoles';
import { formatDateTime } from '../utils/formatDate';
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
    {
      key: 'contactNumber',
      label: 'Contact',
      width: 132,
      cellClassName: 'break-all text-[12px] font-semibold leading-5 text-slate-600',
      render: (value, row) => value || row.phone || row.mobile || '-'
    },
    { key: 'role', label: 'Role', width: 92, cellClassName: 'text-[12px] font-medium uppercase tracking-[0.04em] text-slate-600', render: (value) => USER_ROLE_LABELS[value] || value },
    {
      key: 'company',
      label: 'Company / Team',
      width: 148,
      cellClassName: 'text-[12.5px] leading-5 text-slate-600',
      render: (value, row) => (
        <span className="inline-flex min-w-0 flex-col gap-0.5">
          <span>{value || '-'}</span>
          {row.role === 'sales' && row.salesCode ? (
            <span className="font-mono text-[10.5px] font-semibold uppercase text-brand-600">{row.salesCode}</span>
          ) : null}
        </span>
      )
    },
    {
      key: 'assignedStates',
      label: 'State Scope',
      width: 156,
      cellClassName: 'text-[12px] leading-5 text-slate-600',
      render: (value) => {
        const states = Array.isArray(value) ? value : [];
        if (!states.length) return <span className="text-slate-400">All states</span>;
        return <span className="line-clamp-2">{states.join(', ')}</span>;
      }
    },
    { key: 'status', label: 'Status', width: 94, cellClassName: 'text-[12px]', render: (value) => <StatusBadge value={value} /> },
    {
      key: 'onboardingDate',
      label: 'Onboarding',
      width: 148,
      cellClassName: 'text-[12px] leading-5 text-slate-500',
      render: (value, row) => formatDateTime(value || row.createdAt)
    },
    { key: 'lastActiveAt', label: 'Last Active', width: 148, cellClassName: 'text-[12px] leading-5 text-slate-500', render: (value) => formatDateTime(value) },
    {
      key: 'actions',
      label: 'Actions',
      width: 196,
      wrap: false,
      render: (_, row) => (
        ['super_admin', 'admin', 'hr', 'support', 'student', 'dataentry', 'accounts', 'sales', 'company_admin', 'platform', 'audit', 'campus_connect', 'retired_employee'].includes(row.role) ? (
          <div className="flex min-w-[176px] flex-nowrap items-center justify-start gap-1">
            {['active', 'banned'].map((status) => {
              const isSelected = row.status === status;
              const toneClassName = status === 'banned'
                ? (isSelected ? 'bg-rose-100 text-rose-700 shadow-sm' : 'text-rose-600 hover:text-rose-700')
                : (isSelected ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800');
              return (
                <button
                  key={status}
                  type="button"
                  className={`inline-flex h-8 min-w-[52px] shrink-0 items-center justify-center rounded-full border border-slate-200 px-2.5 text-[11px] font-semibold transition ${toneClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                  disabled={busyUserId === row.id || isSelected}
                  onClick={() => onStatusChange?.(row, status)}
                >
                  {status === 'active' ? 'Active' : 'Ban'}
                </button>
              );
            })}
            <button
              type="button"
              className="inline-flex h-8 min-w-[64px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-rose-700/20 bg-gradient-to-r from-rose-600 to-red-700 px-3 text-[11px] font-bold text-white shadow-sm transition hover:shadow-md"
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
