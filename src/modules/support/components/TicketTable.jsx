import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import { formatDateTime } from '../utils/formatDate';
import { formatSupportDepartment, getTicketDisplayId } from '../utils/ticketHelpers';
import TicketStatusBadge from './TicketStatusBadge';

const TicketTable = ({ rows = [] }) => {
  const columns = [
    {
      key: 'id',
      label: 'Ticket ID',
      render: (value, row) => (
        <Link to={`/portal/support/ticket-details/${encodeURIComponent(value)}`} className="font-semibold text-brand-700 hover:text-brand-800">
          {getTicketDisplayId(row)}
        </Link>
      )
    },
    { key: 'title', label: 'Title' },
    { key: 'customer', label: 'Customer' },
    { key: 'category', label: 'Category' },
    {
      key: 'assignedDepartment',
      label: 'Queue',
      render: (value) => formatSupportDepartment(value)
    },
    { key: 'assignedTo', label: 'Assigned To' },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => <TicketStatusBadge value={value} />
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <TicketStatusBadge value={value} />
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} searchable pagination itemsPerPage={10} searchPlaceholder="Search ticket, customer, category, owner, priority, or status" />;
};

export default TicketTable;
