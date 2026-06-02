import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const RefundTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Refund ID', width: '15%' },
    { key: 'account', label: 'Account', width: '17%' },
    { key: 'reason', label: 'Reason', width: '18%' },
    {
      key: 'amount',
      label: 'Amount',
      width: '10%',
      wrap: false,
      render: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      label: 'Status',
      width: '11%',
      render: (value) => <StatusPill value={value || 'pending'} />
    },
    {
      key: 'requestedAt',
      label: 'Requested',
      width: '14%',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'processedAt',
      label: 'Processed',
      width: '15%',
      render: (value) => formatDateTime(value)
    }
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      searchable
      pagination
      compact
      fitOnDesktop
      itemsPerPage={8}
      searchPlaceholder="Search refund ID, account, reason, or status"
    />
  );
};

export default RefundTable;
