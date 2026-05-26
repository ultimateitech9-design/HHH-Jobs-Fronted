import { useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
};

const LeadTable = ({ rows = [], onMarkCalled, updatingId = '' }) => {
  const [followupDrafts, setFollowupDrafts] = useState({});

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
    { key: 'contactName', label: 'Name', render: (value, row) => value || row.company || '-' },
    { key: 'phone', label: 'Contact', render: (value) => value || '-' },
    { key: 'targetRole', label: 'Audience' },
    { key: 'zone', label: 'Zone', render: (value, row) => value || row.location || '-' },
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
      key: 'lastContactedAt',
      label: 'Last Call',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'callAction',
      label: 'Call Action',
      render: (_value, row) => {
        const draftValue = followupDrafts[row.id] ?? toDateTimeLocalValue(row.nextFollowupAt);
        const isUpdating = updatingId === row.id;

        return (
          <div className="flex min-w-[210px] flex-col gap-2">
            <input
              type="datetime-local"
              value={draftValue}
              onChange={(event) => setFollowupDrafts((current) => ({ ...current, [row.id]: event.target.value }))}
              className="h-9 rounded-lg border border-slate-200 px-2 text-xs text-slate-700"
            />
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onMarkCalled?.(row, draftValue)}
              className="h-9 rounded-full border border-success-200 bg-success-50 px-3 text-xs font-bold text-success-700 transition hover:bg-success-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? 'Saving...' : 'Mark Called'}
            </button>
          </div>
        );
      }
    }
  ];

  return <DataTable columns={columns} rows={rows} pagination itemsPerPage={10} />;
};

export default LeadTable;
