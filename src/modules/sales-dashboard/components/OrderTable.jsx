import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const OrderTable = ({ rows = [] }) => {
  const columns = [
    {
      key: 'id',
      label: 'Payment ID',
      render: (value, row) => (
        <Link to={`/portal/sales/payment-details/${encodeURIComponent(value)}`} className="font-semibold text-brand-700 hover:text-brand-800">
          {row.orderNumber || value}
        </Link>
      )
    },
    { key: 'customer', label: 'Customer' },
    { key: 'product', label: 'Package' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value)
    },
    { key: 'quantity', label: 'Qty' },
    { key: 'zone', label: 'Zone', render: (value, row) => value || row.location || '-' },
    { key: 'paymentMethod', label: 'Payment Method' },
    {
      key: 'status',
      label: 'Record Status',
      render: (value) => <StatusPill value={value || 'pending'} />
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (value) => <StatusPill value={value || 'pending'} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} pagination itemsPerPage={10} />;
};

export default OrderTable;
