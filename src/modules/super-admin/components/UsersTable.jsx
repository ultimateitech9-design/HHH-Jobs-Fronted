import DataTable from '../../../shared/components/DataTable';
import { USER_ROLE_LABELS } from '../constants/userRoles';
import { formatDateTime } from '../utils/formatDate';
import StatusBadge from './StatusBadge';

const UsersTable = ({ rows = [], onDelete }) => {
  const columns = [
    { key: 'id', label: 'User ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (value) => USER_ROLE_LABELS[value] || value },
    { key: 'company', label: 'Company' },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge value={value} /> },
    { key: 'lastActiveAt', label: 'Last Active', render: (value) => formatDateTime(value) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        ['super_admin', 'admin', 'hr', 'support', 'student', 'dataentry', 'accounts', 'sales', 'company_admin'].includes(row.role) ? (
          <div className="flex min-w-[108px] justify-center sm:justify-start">
            <button
              type="button"
              className="btn-danger inline-flex min-w-[92px] items-center justify-center whitespace-nowrap px-4 py-2 text-sm"
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
