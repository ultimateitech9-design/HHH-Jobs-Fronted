import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import { formatDateTime } from '../utils/formatDate';
import { formatSupportDepartment, getTicketDisplayId } from '../utils/ticketHelpers';
import TicketStatusBadge from './TicketStatusBadge';

const formatCompactDateTime = (value) => {
  const formatted = formatDateTime(value);
  if (formatted === '-') return formatted;
  return formatted.replace(/\s202\d,?/, ',');
};

const TicketTable = ({ rows = [] }) => {
  const columns = [
    {
      key: 'id',
      label: 'Ticket ID',
      width: 104,
      wrap: false,
      render: (value, row) => (
        <Link to={`/portal/support/ticket-details/${encodeURIComponent(value)}`} className="font-semibold text-brand-700 hover:text-brand-800">
          {getTicketDisplayId(row)}
        </Link>
      )
    },
    {
      key: 'title',
      label: 'Title',
      width: 160,
      render: (value) => <span className="line-clamp-2 text-[13px] leading-snug">{value || '-'}</span>
    },
    {
      key: 'customer',
      label: 'Customer',
      width: 128,
      render: (value) => <span className="line-clamp-1 text-[13px]">{value || '-'}</span>
    },
    {
      key: 'category',
      label: 'Category',
      width: 110,
      render: (value) => <span className="line-clamp-1 text-[13px]">{value || '-'}</span>
    },
    {
      key: 'assignedDepartment',
      label: 'Queue',
      width: 90,
      render: (value) => formatSupportDepartment(value)
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      width: 118,
      render: (value) => <span className="line-clamp-1 text-[13px]">{value || '-'}</span>
    },
    {
      key: 'priority',
      label: 'Priority',
      width: 90,
      wrap: false,
      render: (value) => <TicketStatusBadge value={value} />
    },
    {
      key: 'status',
      label: 'Status',
      width: 90,
      wrap: false,
      render: (value) => <TicketStatusBadge value={value} />
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      width: 106,
      render: (value) => <span className="line-clamp-1 text-[12px]">{formatCompactDateTime(value)}</span>
    }
  ];

  return (
    <div className="[&_.status-pill]:px-2 [&_.status-pill]:py-0.5 [&_.status-pill]:text-[10px] [&_.status-pill]:leading-4">
      <DataTable columns={columns} rows={rows} compact fitOnDesktop searchable pagination itemsPerPage={10} searchPlaceholder="Search ticket, customer, category, owner, priority, or status" />
    </div>
  );
};

export default TicketTable;
