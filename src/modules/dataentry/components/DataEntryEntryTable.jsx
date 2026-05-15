import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatDateTime } from '../services/dataentryApi';

const DataEntryEntryTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Entry ID' },
    { key: 'type', label: 'Type' },
    { key: 'title', label: 'Title' },
    { key: 'companyName', label: 'Company' },
    { key: 'location', label: 'Location' },
    { key: 'assignedTo', label: 'Assigned To' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'draft'} />
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value, row) => (
        <div className="student-job-actions">
          <Link to={`/portal/dataentry/add-job?entryId=${row.id}`} className="btn-link">Edit</Link>
          <Link to={`/portal/dataentry/add-job?entryId=${row.id}`} className="btn-link">Images</Link>
        </div>
      )
    }
  ];

  return <DataTable columns={columns} rows={rows} />;
};

export default DataEntryEntryTable;
