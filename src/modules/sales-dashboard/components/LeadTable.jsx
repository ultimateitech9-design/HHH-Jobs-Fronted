import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPhoneCall } from 'react-icons/fi';
import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
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
      width: 118,
      wrap: false,
      render: (value, row) => (
        <Link to={`/portal/sales/lead-details/${encodeURIComponent(row.id)}`} className="whitespace-nowrap font-semibold text-brand-700 hover:text-brand-800">
          {value}
        </Link>
      )
    },
    {
      key: 'contactName',
      label: 'Name',
      width: 180,
      render: (value, row) => (
        <div className="space-y-0.5">
          <p className="font-semibold leading-snug text-slate-800">{value || row.company || '-'}</p>
          <p className="truncate text-[11px] font-medium text-slate-400">{row.email || row.company || '-'}</p>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Contact',
      width: 116,
      wrap: false,
      render: (value) => <span className="whitespace-nowrap font-semibold text-slate-700">{value || '-'}</span>
    },
    {
      key: 'targetRole',
      label: 'Audience',
      width: 118,
      render: (value, row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-700">{value || '-'}</p>
          <p className="truncate text-[11px] text-slate-400">{row.zone || row.location || 'No zone'}</p>
        </div>
      )
    },
    {
      key: 'assignedTo',
      label: 'Owner',
      width: 112,
      render: (value) => <span className="font-medium text-slate-700">{value || '-'}</span>
    },
    {
      key: 'stage',
      label: 'Status',
      width: 128,
      render: (value, row) => (
        <div className="space-y-1.5">
          <StatusPill value={value || 'new'} />
          <StatusPill value={row.onboardingStatus || 'prospect'} />
        </div>
      )
    },
    {
      key: 'nextFollowupAt',
      label: 'Follow-up',
      width: 156,
      render: (value, row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-700">{formatDateTime(value)}</p>
          <p className="text-[11px] text-slate-400">Last: {formatDateTime(row.lastContactedAt)}</p>
        </div>
      )
    },
    {
      key: 'callAction',
      label: 'Action',
      width: 252,
      stickyRight: true,
      render: (_value, row) => {
        const draftValue = followupDrafts[row.id] ?? toDateTimeLocalValue(row.nextFollowupAt);
        const isUpdating = updatingId === row.id;

        return (
          <div className="flex min-w-[220px] items-center gap-2">
            <input
              type="datetime-local"
              value={draftValue}
              onChange={(event) => setFollowupDrafts((current) => ({ ...current, [row.id]: event.target.value }))}
              className="h-9 w-[142px] rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onMarkCalled?.(row, draftValue)}
              className="inline-flex h-9 w-[86px] items-center justify-center gap-1 rounded-lg border border-success-200 bg-success-50 px-2 text-[11px] font-bold text-success-700 transition hover:bg-success-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiPhoneCall size={13} />
              <span className="whitespace-nowrap">{isUpdating ? 'Saving' : 'Called'}</span>
            </button>
          </div>
        );
      }
    }
  ];

  return <DataTable columns={columns} rows={rows} compact pagination itemsPerPage={10} />;
};

export default LeadTable;
