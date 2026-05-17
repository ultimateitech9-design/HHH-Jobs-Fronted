import DataTable from '../../../shared/components/DataTable';
import { formatDate } from '../utils/formatDate';
import StatusBadge from './StatusBadge';

const JobsTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Job ID' },
    { key: 'title', label: 'Title' },
    { key: 'company', label: 'Company' },
    { key: 'location', label: 'Location' },
    { key: 'applications', label: 'Applications' },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge value={value} /> },
    { key: 'approvalStatus', label: 'Approval', render: (value) => <StatusBadge value={value} /> },
    { key: 'createdAt', label: 'Created', render: (value) => formatDate(value) }
  ];

  return <DataTable columns={columns} rows={rows} compact fitOnDesktop />;
};

export default JobsTable;
