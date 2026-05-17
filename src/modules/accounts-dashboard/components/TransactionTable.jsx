import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const TransactionTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Transaction ID' },
    { key: 'customer', label: 'Account' },
    { key: 'type', label: 'Type' },
    { key: 'channel', label: 'Channel' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value, row) => formatCurrency(value, row.currency || 'INR')
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'pending'} />
    },
    { key: 'gateway', label: 'Gateway' },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} pagination itemsPerPage={8} />;
};

export default TransactionTable;
