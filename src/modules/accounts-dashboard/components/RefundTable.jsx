import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const RefundTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Refund ID' },
    { key: 'account', label: 'Account' },
    { key: 'reason', label: 'Reason' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'pending'} />
    },
    {
      key: 'requestedAt',
      label: 'Requested',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'processedAt',
      label: 'Processed',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} searchable pagination itemsPerPage={8} searchPlaceholder="Search refund ID, account, reason, or status" />;
};

export default RefundTable;
