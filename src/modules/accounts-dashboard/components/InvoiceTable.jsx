import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDate } from '../utils/dateFormat';

const InvoiceTable = ({ rows = [] }) => {
  const columns = [
    { key: 'invoiceNumber', label: 'Invoice No.' },
    { key: 'account', label: 'Account' },
    { key: 'category', label: 'Category' },
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
    {
      key: 'issueDate',
      label: 'Issue Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value) => formatDate(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} searchable pagination itemsPerPage={8} searchPlaceholder="Search invoice number, account, category, or status" />;
};

export default InvoiceTable;
