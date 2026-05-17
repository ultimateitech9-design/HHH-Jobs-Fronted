import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const PayoutTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Payout ID' },
    { key: 'beneficiary', label: 'Beneficiary' },
    { key: 'purpose', label: 'Purpose' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value)
    },
    { key: 'method', label: 'Method' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'pending'} />
    },
    {
      key: 'requestedAt',
      label: 'Requested',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} searchable pagination itemsPerPage={8} searchPlaceholder="Search payout ID, beneficiary, purpose, or method" />;
};

export default PayoutTable;
