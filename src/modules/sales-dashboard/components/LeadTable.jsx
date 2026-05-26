import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiPhoneCall } from 'react-icons/fi';
import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatDateTime } from '../utils/dateFormat';

const toLocalFollowupParts = (value) => {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
  return {
    date: local.slice(0, 10),
    time: local.slice(11, 16)
  };
};

const buildFollowupIso = ({ date = '', time = '' } = {}) => {
  if (!date) return undefined;
  const parsed = new Date(`${date}T${time || '10:00'}:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const LeadTable = ({ rows = [], onMarkCalled, updatingId = '' }) => {
  const [followupDrafts, setFollowupDrafts] = useState({});

  const getDraft = (row) => followupDrafts[row.id] || toLocalFollowupParts(row.nextFollowupAt);

  const updateDraft = (row, field, value) => {
    setFollowupDrafts((current) => ({
      ...current,
      [row.id]: {
        ...(current[row.id] || toLocalFollowupParts(row.nextFollowupAt)),
        [field]: value
      }
    }));
  };

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
      width: 332,
      stickyRight: true,
      render: (_value, row) => {
        const draft = getDraft(row);
        const followupIso = buildFollowupIso(draft);
        const isUpdating = updatingId === row.id;
        const hasBeenCalled = Boolean(row.lastContactedAt);
        const buttonTone = hasBeenCalled
          ? 'border-success-200 bg-success-50 text-success-700 hover:bg-success-100'
          : 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100';

        return (
          <div className="flex min-w-[300px] items-center gap-2">
            <input
              type="date"
              aria-label="Follow-up date"
              title="Follow-up date"
              value={draft.date}
              onChange={(event) => updateDraft(row, 'date', event.target.value)}
              className="h-9 w-[116px] rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="time"
              aria-label="Follow-up time"
              title="Follow-up time"
              value={draft.time}
              onChange={(event) => updateDraft(row, 'time', event.target.value)}
              className="h-9 w-[78px] rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onMarkCalled?.(row, followupIso)}
              className={`inline-flex h-9 w-[94px] items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonTone}`}
            >
              {hasBeenCalled ? <FiCheckCircle size={13} /> : <FiPhoneCall size={13} />}
              <span className="whitespace-nowrap">{isUpdating ? 'Saving' : (hasBeenCalled ? 'Called' : 'Mark call')}</span>
            </button>
          </div>
        );
      }
    }
  ];

  return <DataTable columns={columns} rows={rows} compact pagination itemsPerPage={10} />;
};

export default LeadTable;
