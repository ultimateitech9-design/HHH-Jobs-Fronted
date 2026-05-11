import DataTable from '../../../shared/components/DataTable';
import { USER_ROLE_LABELS } from '../constants/userRoles';
import { formatDateTime } from '../utils/formatDate';
import StatusBadge from './StatusBadge';

const UsersTable = ({ rows = [], onDelete }) => {
  const columns = [
    { key: 'id', label: 'User ID', width: 105, cellClassName: 'font-semibold text-slate-900' },
    { key: 'name', label: 'Name', width: 135, cellClassName: 'font-semibold text-slate-900' },
    { key: 'email', label: 'Email', width: 250, cellClassName: 'break-all text-slate-600' },
    { key: 'role', label: 'Role', width: 125, render: (value) => USER_ROLE_LABELS[value] || value },
    { key: 'company', label: 'Company', width: 190, cellClassName: 'text-slate-600' },
    { key: 'status', label: 'Status', width: 105, render: (value) => <StatusBadge value={value} /> },
    { key: 'lastActiveAt', label: 'Last Active', width: 120, render: (value) => formatDateTime(value) },
    {
      key: 'actions',
      label: 'Actions',
      width: 90,
      stickyRight: true,
      render: (_, row) => (
        ['super_admin', 'admin', 'hr', 'support', 'student', 'dataentry', 'accounts', 'sales', 'company_admin'].includes(row.role) ? (
          <div className="flex min-w-0 justify-start">
            <button
              type="button"
              className="btn-danger inline-flex min-h-10 w-full min-w-[92px] items-center justify-center whitespace-nowrap px-4 py-2 text-sm sm:w-auto"
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
