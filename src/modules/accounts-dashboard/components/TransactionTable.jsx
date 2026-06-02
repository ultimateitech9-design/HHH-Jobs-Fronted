import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const shortenValue = (value, start = 10, end = 6) => {
  const text = String(value || '').trim();
  if (text.length <= start + end + 3) return text || '-';
  return end > 0 ? `${text.slice(0, start)}...${text.slice(-end)}` : `${text.slice(0, start)}...`;
};

const CompactCode = ({ value, start, end }) => (
  <span className="block max-w-full truncate font-mono text-[12px] leading-5 text-slate-700" title={String(value || '')}>
    {shortenValue(value, start, end)}
  </span>
);

const TransactionTable = ({ rows = [] }) => {
  const columns = [
    {
      key: 'id',
      label: 'Transaction ID',
      width: 130,
      wrap: false,
      render: (value) => <CompactCode value={value} start={8} end={6} />
    },
    { key: 'customer', label: 'Account', width: 130, wrap: false },
    { key: 'type', label: 'Type', width: 70, wrap: false },
    {
      key: 'channel',
      label: 'Channel',
      width: 125,
      wrap: false,
      render: (value) => <CompactCode value={value} start={14} end={0} />
    },
    {
      key: 'amount',
      label: 'Amount',
      width: 105,
      wrap: false,
      render: (value, row) => formatCurrency(value, row.currency || 'INR')
    },
    {
      key: 'status',
      label: 'Status',
      width: 95,
      wrap: false,
      render: (value) => <StatusPill value={value || 'pending'} />
    },
    {
      key: 'gateway',
      label: 'Gateway',
      width: 130,
      wrap: false,
      render: (value) => <CompactCode value={value} start={12} end={6} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: 125,
      wrap: false,
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} compact fitOnDesktop pagination itemsPerPage={8} />;
};

export default TransactionTable;
