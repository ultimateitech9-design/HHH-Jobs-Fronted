import DataTable from '../../../shared/components/DataTable';
import { formatDate } from '../utils/formatDate';
import StatusBadge from './StatusBadge';

const ApplicationsTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Application ID' },
    { key: 'candidate', label: 'Candidate' },
    { key: 'jobTitle', label: 'Job' },
    { key: 'company', label: 'Company' },
    { key: 'score', label: 'Score' },
    { key: 'stage', label: 'Stage', render: (value) => <StatusBadge value={value} /> },
    { key: 'createdAt', label: 'Created', render: (value) => formatDate(value) }
  ];

  return <DataTable columns={columns} rows={rows} compact fitOnDesktop />;
};

export default ApplicationsTable;
