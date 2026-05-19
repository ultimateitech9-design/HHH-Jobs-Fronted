import DataTable from '../../../shared/components/DataTable';
import TicketStatusBadge from './TicketStatusBadge';
import { formatDateTime } from '../utils/formatDate';

const ComplaintTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Complaint ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'customer', label: 'Customer' },
    { key: 'owner', label: 'Owner' },
    {
      key: 'severity',
      label: 'Severity',
      render: (value) => <TicketStatusBadge value={value} />
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <TicketStatusBadge value={value} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} searchable pagination itemsPerPage={10} searchPlaceholder="Search complaint, customer, owner, severity, or status" />;
};

export default ComplaintTable;
