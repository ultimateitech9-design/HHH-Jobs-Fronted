import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';

const SalesAgentTable = ({ rows = [] }) => {
  const columns = [
    { key: 'name', label: 'Agent' },
    { key: 'email', label: 'Email' },
    { key: 'dealsClosed', label: 'Deals Closed' },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (value) => formatCurrency(value)
    },
    { key: 'leadResponseRate', label: 'Lead Response %' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'active'} />
    }
  ];

  return <DataTable columns={columns} rows={rows} pagination itemsPerPage={10} />;
};

export default SalesAgentTable;
