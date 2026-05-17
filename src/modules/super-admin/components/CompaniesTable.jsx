import DataTable from '../../../shared/components/DataTable';
import { formatDate } from '../utils/formatDate';
import StatusBadge from './StatusBadge';

const CompaniesTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Company ID' },
    { key: 'name', label: 'Company' },
    { key: 'plan', label: 'Plan' },
    { key: 'industry', label: 'Industry' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'applications', label: 'Applications' },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge value={value} /> },
    { key: 'renewedAt', label: 'Renewed', render: (value) => formatDate(value) }
  ];

  return <DataTable columns={columns} rows={rows} compact fitOnDesktop />;
};

export default CompaniesTable;
