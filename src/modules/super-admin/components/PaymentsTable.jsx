import DataTable from '../../../shared/components/DataTable';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDate } from '../utils/formatDate';
import StatusBadge from './StatusBadge';

const PaymentsTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Payment ID' },
    { key: 'company', label: 'User / Company' },
    { key: 'userEmail', label: 'Email' },
    { key: 'userRole', label: 'Role' },
    { key: 'source', label: 'Source' },
    { key: 'item', label: 'Item' },
    { key: 'amount', label: 'Amount', render: (value) => formatCurrency(value) },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge value={value} /> },
    { key: 'createdAt', label: 'Created', render: (value) => formatDate(value) }
  ];

  return <DataTable columns={columns} rows={rows} compact fitOnDesktop />;
};

export default PaymentsTable;
