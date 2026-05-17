import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import { formatDateTime } from '../services/dataentryApi';

const statusBadgeClassName = {
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  default: 'border-slate-200 bg-slate-100 text-slate-700'
};

const getStatusBadgeClassName = (value) => statusBadgeClassName[String(value || '').toLowerCase()] || statusBadgeClassName.default;

const DataEntryEntryTable = ({ rows = [] }) => {
  const columns = [
    {
      key: 'id',
      label: 'Entry ID',
      width: 170,
      render: (value) => <span className="font-mono text-[12px] font-medium text-slate-600">{value}</span>
    },
    {
      key: 'type',
      label: 'Type',
      width: 82,
      wrap: false,
      render: (value) => <span className="text-[12px] font-medium capitalize text-slate-600">{value || '-'}</span>
    },
    {
      key: 'title',
      label: 'Title',
      width: 210,
      render: (value) => <span className="text-[12.5px] font-semibold leading-5 text-slate-700">{value || '-'}</span>
    },
    {
      key: 'companyName',
      label: 'Company',
      width: 120,
      render: (value) => <span className="text-[12px] font-medium text-slate-600">{value || '-'}</span>
    },
    {
      key: 'location',
      label: 'Location',
      width: 120,
      render: (value) => <span className="text-[12px] font-medium text-slate-600">{value || '-'}</span>
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      width: 116,
      render: (value) => <span className="text-[12px] font-medium text-slate-600">{value || '-'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      width: 112,
      wrap: false,
      render: (value) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getStatusBadgeClassName(value)}`}>
          {String(value || 'draft')}
        </span>
      )
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      width: 138,
      render: (value) => <span className="text-[12px] font-medium text-slate-500">{formatDateTime(value)}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 108,
      wrap: false,
      stickyRight: true,
      render: (_value, row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Link to={`/portal/dataentry/add-job?entryId=${row.id}`} className="text-[12px] font-semibold text-brand-700 transition hover:text-brand-800">Edit</Link>
          <Link to={`/portal/dataentry/add-job?entryId=${row.id}`} className="text-[12px] font-semibold text-slate-500 transition hover:text-slate-700">Images</Link>
        </div>
      )
    }
  ];

  return <DataTable columns={columns} rows={rows} compact fitOnDesktop pagination itemsPerPage={8} />;
};

export default DataEntryEntryTable;
