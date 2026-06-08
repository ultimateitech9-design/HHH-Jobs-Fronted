import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { getActivityLogs } from '../services/reportsApi';
import { formatDateTime } from '../utils/formatDate';

const PAGE_SIZE = 10;

const PAGE_CONFIG = {
  student: {
    title: 'Student Activity Log',
    subtitle: 'Track student and professional profile, login, application, and support activity.'
  },
  hr: {
    title: 'HR Activity Log',
    subtitle: 'Track recruiter activity across jobs, billing, candidates, and company workflows.'
  },
  campus: {
    title: 'Campus Activity Log',
    subtitle: 'Track campus connect activity across profiles, students, drives, and company requests.'
  }
};

const getRoleGroupFromPath = (pathname = '') => {
  if (pathname.includes('/hr-activity-log')) return 'hr';
  if (pathname.includes('/campus-activity-log')) return 'campus';
  return 'student';
};

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

const renderCompactText = (value, className = '') => (
  <span title={value || ''} className={`block truncate ${className}`.trim()}>
    {value || '-'}
  </span>
);

const buildDetailsPreview = (value = '') => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '-';
  return shortenValue(text, 82);
};

const ActivityLogPage = () => {
  const location = useLocation();
  const roleGroup = getRoleGroupFromPath(location.pathname);
  const pageConfig = PAGE_CONFIG[roleGroup] || PAGE_CONFIG.student;
  const urlSearch = useMemo(() => new URLSearchParams(location.search).get('search')?.trim() || '', [location.search]);

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalEvents: 0, criticalEvents: 0, warningEvents: 0, managementActions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  }, [roleGroup, urlSearch]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getActivityLogs({
        roleGroup,
        filters: urlSearch ? { search: urlSearch } : {},
        page: pagination.page,
        limit: PAGE_SIZE
      });

      setLogs(response.data?.logs || []);
      setSummary(response.data?.summary || { totalEvents: 0, criticalEvents: 0, warningEvents: 0, managementActions: 0 });
      setPagination(response.data?.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, [pagination.page, roleGroup, urlSearch]);

  const cards = useMemo(() => [
    { label: 'Total Events', value: String(summary.totalEvents || 0), helper: 'Current filtered activity volume', tone: 'info' },
    { label: 'User Actions', value: String(summary.managementActions || 0), helper: 'Events triggered by platform users', tone: 'success' },
    { label: 'Warnings', value: String(summary.warningEvents || 0), helper: 'Needs follow-up review', tone: 'warning' },
    { label: 'Critical Events', value: String(summary.criticalEvents || 0), helper: 'Immediate review required', tone: 'danger' }
  ], [summary]);

  const columns = [
    {
      key: 'id',
      label: 'Log ID',
      width: 146,
      cellClassName: 'font-mono text-[11.5px] text-slate-500',
      render: (value) => renderCompactText(shortenValue(value, 16), 'font-mono')
    },
    {
      key: 'actor',
      label: 'Actor',
      width: 190,
      cellClassName: 'text-[12.5px] font-semibold text-slate-800',
      render: (value) => renderCompactText(value || '-')
    },
    {
      key: 'actorRole',
      label: 'Role',
      width: 120,
      render: (value) => <StatusBadge value={value || roleGroup} />
    },
    {
      key: 'module',
      label: 'Module',
      width: 130,
      cellClassName: 'text-[12px] font-semibold text-slate-600',
      render: (value) => renderCompactText(formatOptionLabel(value) || '-')
    },
    {
      key: 'action',
      label: 'Action',
      width: 184,
      render: (value) => (
        <span title={value || ''} className="inline-flex max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          <span className="truncate">{formatOptionLabel(value) || '-'}</span>
        </span>
      )
    },
    {
      key: 'level',
      label: 'Level',
      width: 90,
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
      width: 340,
      cellClassName: 'text-[11.5px] text-slate-500',
      render: (value) => renderCompactText(buildDetailsPreview(value), 'font-mono text-[11px] text-slate-500')
    }
  ];

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title={pageConfig.title} subtitle={pageConfig.subtitle} />
      {isDemo ? <p className="module-note">Demo data is shown.</p> : null}
      {urlSearch ? <p className="module-note">Filtered by: {urlSearch}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card min-w-0">
        {loading ? <p className="module-note">Loading activity logs...</p> : null}
        <DataTable columns={columns} rows={logs} compact searchable searchPlaceholder="Search activity by actor, action, module, or details" />
        <Pagination
          page={pagination.page || 1}
          totalPages={pagination.totalPages || 1}
          onChange={(nextPage) => setPagination((current) => ({ ...current, page: nextPage }))}
        />
      </section>
    </div>
  );
};

export default ActivityLogPage;
