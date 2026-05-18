import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const LeadTable = ({ rows = [] }) => {
  const columns = [
    {
      key: 'leadCode',
      label: 'Lead ID',
      width: 130,
      wrap: false,
      render: (value, row) => (
        <Link to={`/portal/sales/lead-details/${encodeURIComponent(row.id)}`} className="font-semibold text-brand-700 hover:text-brand-800">
          {value}
        </Link>
      )
    },
    { key: 'company', label: 'Company' },
    { key: 'contactName', label: 'Contact' },
    { key: 'targetRole', label: 'Audience' },
    { key: 'source', label: 'Source' },
    { key: 'assignedTo', label: 'Owner' },
    {
      key: 'onboardingStatus',
      label: 'Onboarding',
      render: (value) => <StatusPill value={value || 'prospect'} />
    },
    {
      key: 'expectedValue',
      label: 'Expected Value',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (value) => <StatusPill value={value || 'new'} />
    },
    {
      key: 'nextFollowupAt',
      label: 'Next Follow-up',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} pagination itemsPerPage={10} />;
};

export default LeadTable;
