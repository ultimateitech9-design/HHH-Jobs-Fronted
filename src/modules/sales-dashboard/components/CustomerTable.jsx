import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const CustomerTable = ({ rows = [] }) => {
  const columns = [
    {
      key: 'id',
      label: 'Customer ID',
      render: (value) => (
        <Link to={`/portal/sales/customer-details/${encodeURIComponent(value)}`} className="font-semibold text-brand-700 hover:text-brand-800">
          {value}
        </Link>
      )
    },
    { key: 'company', label: 'Name', render: (value, row) => value || row.contactName || '-' },
    { key: 'phone', label: 'Contact', render: (value) => value || '-' },
    { key: 'email', label: 'Email' },
    { key: 'audienceRole', label: 'Audience' },
    { key: 'stateName', label: 'State', render: (value, row) => value || row.zone || '-' },
    { key: 'districtName', label: 'District', render: (value, row) => value || row.location || '-' },
    { key: 'plan', label: 'Plan' },
    {
      key: 'lifetimeValue',
      label: 'Lifetime Value',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'active'} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} pagination itemsPerPage={10} />;
};

export default CustomerTable;
