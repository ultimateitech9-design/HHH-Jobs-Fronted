import DataTable from '../../../shared/components/DataTable';
import { formatDate } from '../utils/formatDate';
import StatusBadge from './StatusBadge';

const CampusesTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Campus ID', width: 148, cellClassName: 'font-mono text-[11px] text-slate-700' },
    { key: 'name', label: 'Campus', width: 220, cellClassName: 'font-semibold text-slate-900' },
    {
      key: 'location',
      label: 'Location',
      width: 150,
      render: (_, row) => [row.city, row.state].filter(Boolean).join(', ') || '-'
    },
    { key: 'affiliation', label: 'Affiliation', width: 140 },
    { key: 'totalPool', label: 'Talent Pool', width: 105 },
    { key: 'placedStudents', label: 'Placed', width: 90 },
    { key: 'connectedCompanies', label: 'Connected', width: 104 },
    { key: 'activeDrives', label: 'Live Drives', width: 96 },
    { key: 'status', label: 'Status', width: 100, render: (value) => <StatusBadge value={value} /> },
    { key: 'joinedAt', label: 'Joined', width: 112, render: (value) => formatDate(value) }
  ];

  return <DataTable columns={columns} rows={rows} compact fitOnDesktop />;
};

export default CampusesTable;
