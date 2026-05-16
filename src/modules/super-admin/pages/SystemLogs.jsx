import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { getSystemLogs } from '../services/reportsApi';
import { formatDateTime } from '../utils/formatDate';

const PAGE_SIZE = 10;
const INITIAL_FILTERS = { search: '', level: '', actorRole: '' };
const HIDDEN_ACTOR_ROLES = new Set(['student', 'hr', 'retired_employee', 'system']);

const formatOptionLabel = (value = '') => String(value || '')
  .split('_')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const shortenValue = (value = '', visible = 18) => {
  const text = String(value || '').trim();
  if (!text) return '-';
  if (text.length <= visible) return text;
  return `${text.slice(0, visible)}...`;
};

const buildDetailsPreview = (value = '') => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '-';
  return shortenValue(text, 72);
};

const renderCompactText = (value, className = '') => (
  <span
    title={value || ''}
    className={`block truncate ${className}`.trim()}
  >
    {value || '-'}
  </span>
);

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalEvents: 0, criticalEvents: 0, warningEvents: 0, managementActions: 0 });
  const [actorRoleOptions, setActorRoleOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const response = await getSystemLogs({
        filters,
        page: pagination.page,
        limit: PAGE_SIZE
      });

      setLogs(response.data?.logs || []);
      setSummary(response.data?.summary || { totalEvents: 0, criticalEvents: 0, warningEvents: 0, managementActions: 0 });
      setActorRoleOptions(response.data?.actorRoles || []);
      setPagination(response.data?.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, [filters, pagination.page]);

  const cards = useMemo(() => [
    { label: 'Management Actions', value: String(summary.managementActions || 0), helper: 'Admin, support, sales, accounts, HR, and other dashboard activity', tone: 'info' },
    { label: 'Critical Events', value: String(summary.criticalEvents || 0), helper: 'Immediate action required', tone: 'danger' },
    { label: 'Warnings', value: String(summary.warningEvents || 0), helper: 'Needs follow-up review', tone: 'warning' },
    { label: 'Operational Events', value: String(summary.totalEvents || 0), helper: 'Current filtered log volume', tone: 'default' }
  ], [summary]);

  const columns = [
    {
      key: 'id',
      label: 'Log ID',
      width: 148,
      cellClassName: 'font-mono text-[11.5px] text-slate-500',
      render: (value) => renderCompactText(shortenValue(value, 16), 'font-mono')
    },
    {
      key: 'actorId',
      label: 'Actor ID',
      width: 148,
      cellClassName: 'font-mono text-[11.5px] text-slate-500',
      render: (value) => renderCompactText(shortenValue(value, 16), 'font-mono')
    },
    {
      key: 'module',
      label: 'Module',
      width: 112,
      cellClassName: 'text-[12px] font-semibold text-slate-600',
      render: (value) => renderCompactText(formatOptionLabel(value) || '-')
    },
    {
      key: 'actor',
      label: 'Actor',
      width: 164,
      cellClassName: 'text-[12.5px] font-semibold text-slate-800',
      render: (value) => renderCompactText(value || '-')
    },
    {
      key: 'actorRole',
      label: 'Role',
      width: 108,
      render: (value) => <StatusBadge value={value || 'system'} />
    },
    {
      key: 'action',
      label: 'Action',
      width: 166,
      cellClassName: 'text-[12px]',
      render: (value) => (
        <span
          title={value || ''}
          className="inline-flex max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] text-slate-600"
        >
          <span className="truncate">{formatOptionLabel(value) || '-'}</span>
        </span>
      )
    },
    {
      key: 'level',
      label: 'Level',
      width: 88,
      render: (value) => <StatusBadge value={value} />
    },
    {
      key: 'createdAt',
      label: 'Time',
      width: 156,
      cellClassName: 'text-[12px] text-slate-500',
      render: (value) => {
        const formatted = formatDateTime(value);
        if (!formatted) return '-';
        const [datePart, timePart] = String(formatted).split(',');
        return (
          <div className="min-w-[122px] whitespace-nowrap leading-4.5 text-slate-500">
            <div className="font-medium text-slate-700">{datePart || '-'}</div>
            <div className="mt-1 text-[11px]">{timePart?.trim() || ''}</div>
          </div>
        );
      }
    },
    {
      key: 'details',
      label: 'Details',
      width: 320,
      cellClassName: 'text-[11.5px] text-slate-500',
      render: (value) => renderCompactText(buildDetailsPreview(value), 'font-mono text-[11px] text-slate-500')
    }
  ];

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="System Logs" subtitle="Review platform activity across super admin, admin, support, sales, accounts, HR, campus, and system workflows." />
      {isDemo ? <p className="module-note">Demo log data is shown because super admin log endpoints are not connected yet.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card min-w-0">
        <FilterBar
          filters={filters}
          onChange={(key, value) => {
            setFilters((current) => ({ ...current, [key]: value }));
            setPagination((current) => ({ ...current, page: 1 }));
          }}
          fields={[
            {
              key: 'actorRole',
              label: 'Actor Role',
              options: actorRoleOptions
                .filter((value) => !HIDDEN_ACTOR_ROLES.has(value))
                .map((value) => ({
                  value,
                  label: formatOptionLabel(value)
                }))
            },
            {
              key: 'level',
              label: 'Level',
              options: [
                { value: 'critical', label: 'Critical' },
                { value: 'warning', label: 'Warning' },
                { value: 'info', label: 'Info' }
              ]
            }
          ]}
        />
        {loading ? <p className="module-note">Loading system logs...</p> : null}
        <DataTable columns={columns} rows={logs} compact />
        <Pagination
          page={pagination.page || 1}
          totalPages={pagination.totalPages || 1}
          onChange={(nextPage) => setPagination((current) => ({ ...current, page: nextPage }))}
        />
      </section>
    </div>
  );
};

export default SystemLogs;
