import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiExternalLink, FiSearch } from 'react-icons/fi';
import DataTable from '../../../shared/components/DataTable';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import StatusBadge from '../components/StatusBadge';
import { USER_ROLE_LABELS } from '../constants/userRoles';
import { getCommandSearchResults, updateUserStatus } from '../services/usersApi';
import { formatDateTime } from '../utils/formatDate';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'restricted', label: 'Restricted' }
];
const COMMAND_SEARCH_ROLE_OPTIONS = [
  { value: '', label: 'All records' },
  { value: 'public_accounts', label: 'User accounts' },
  { value: 'hr_accounts', label: 'HR accounts' },
  { value: 'candidate_accounts', label: 'Students / professionals' },
  { value: 'campus_accounts', label: 'Campus accounts' },
  { value: 'internal_staff', label: 'Internal staff records' }
];
const USER_STATUS_OPTIONS = ['active', 'blocked', 'banned'];

const formatRole = (role = '') => USER_ROLE_LABELS[role] || String(role || '-').replace(/_/g, ' ');

const getSupportContextPath = (userId, view) => (
  `/portal/super-admin/users/${encodeURIComponent(userId)}/${view}`
);

const CommandSearchPage = () => {
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [savingUserId, setSavingUserId] = useState('');
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());
  const hasFilters = Boolean(deferredSearch || filters.role || filters.status);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!hasFilters) {
        setResults([]);
        setError('');
        setIsDemo(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getCommandSearchResults({
          q: deferredSearch,
          role: filters.role,
          status: filters.status,
          limit: 30
        });

        if (cancelled) return;
        setResults(response.data || []);
        setError(response.error || '');
        setIsDemo(Boolean(response.isDemo));
      } catch (requestError) {
        if (cancelled) return;
        setResults([]);
        setError(requestError.message || 'Search failed.');
        setIsDemo(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [deferredSearch, filters.role, filters.status, hasFilters]);

  const cards = useMemo(() => {
    const blockedCount = results.filter((item) => item.status === 'blocked' || item.status === 'banned').length;
    const accountCount = results.filter((item) => item.contextType !== 'employee_record').length;
    const employeeCount = results.filter((item) => item.contextType === 'employee_record').length;

    return [
      { label: 'Matched Records', value: String(results.length), helper: 'Email, phone, ID, employee code, company, or campus', tone: 'info' },
      { label: 'User Accounts', value: String(accountCount), helper: 'HR, student, professional, and campus accounts', tone: 'success' },
      { label: 'Employee Records', value: String(employeeCount), helper: 'Admin, support, sales, data entry, accounts, and finance activity', tone: 'default' },
      { label: 'Restricted Accounts', value: String(blockedCount), helper: 'Blocked or banned accounts in results', tone: blockedCount ? 'danger' : 'success' }
    ];
  }, [results]);

  const handleStatusChange = async (user, nextStatus) => {
    if (!user?.id || !nextStatus || nextStatus === user.status) return;

    setSavingUserId(user.id);
    try {
      const updated = await updateUserStatus(user.id, nextStatus);
      setResults((current) => current.map((item) => (
        item.id === user.id ? { ...item, ...updated, status: nextStatus } : item
      )));
      setError('');
    } catch (statusError) {
      setError(statusError.message || 'Unable to update user status.');
    } finally {
      setSavingUserId('');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      width: 230,
      render: (_value, row) => (
        <div className="min-w-0">
          <strong className="block truncate text-slate-900">{row.name || '-'}</strong>
          <span className="block truncate text-xs text-slate-500">{row.email || '-'}</span>
          <span className="block truncate text-xs text-slate-400">{row.phone || row.mobile || '-'}</span>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      width: 130,
      render: (value) => <StatusBadge value={formatRole(value)} />
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      render: (value) => <StatusBadge value={value || 'active'} />
    },
    {
      key: 'profile',
      label: 'Profile Context',
      width: 260,
      render: (_value, row) => (
        <div className="min-w-0 text-xs leading-5 text-slate-600">
          <strong className="block truncate text-slate-800">{row.profile?.headline || row.company || '-'}</strong>
          <span className="block truncate">{row.profile?.location || '-'}</span>
          <span className="block truncate">{row.recordType || (row.profile?.verified ? 'Verified profile' : 'Verification not complete')}</span>
          {row.employee?.code && row.employee.code !== '-' ? (
            <span className="block truncate font-mono text-[11px] text-slate-400">{row.employee.code}</span>
          ) : null}
        </div>
      )
    },
    {
      key: 'metrics',
      label: 'Signals',
      width: 210,
      render: (_value, row) => (
        <div className="grid grid-cols-2 gap-1 text-[11px] font-semibold text-slate-600">
          <span>Jobs: {row.metrics?.jobs || 0}</span>
          <span>Apps: {row.metrics?.applications || 0}</span>
          <span>Pay: {row.metrics?.payments || 0}</span>
          <span>Logs: {row.metrics?.activityEvents || 0}</span>
        </div>
      )
    },
    {
      key: 'lastActiveAt',
      label: 'Last Active',
      width: 160,
      render: (value) => formatDateTime(value) || '-'
    },
    {
      key: 'actions',
      label: 'Support Actions',
      width: 280,
      stickyRight: true,
      render: (_value, row) => {
        const dashboardPath = row.links?.dashboard || getSupportContextPath(row.id, 'dashboard');
        const profilePath = row.links?.profile || getSupportContextPath(row.id, 'profile');
        const activityPath = row.links?.activityLog || '/portal/super-admin/system-logs';
        const recordPath = row.links?.record || profilePath;
        const canOpenContext = Boolean(row.id);
        const isEmployeeRecord = row.contextType === 'employee_record';

        return (
          <div className="flex min-w-[240px] flex-wrap items-center gap-2">
            {isEmployeeRecord ? (
              <Link
                className={`btn-secondary py-1.5 text-xs ${canOpenContext ? '' : 'pointer-events-none opacity-50'}`}
                to={recordPath}
                aria-disabled={!canOpenContext}
              >
                Record
              </Link>
            ) : (
              <>
                <Link
                  className={`btn-secondary py-1.5 text-xs ${canOpenContext ? '' : 'pointer-events-none opacity-50'}`}
                  to={dashboardPath}
                  aria-disabled={!canOpenContext}
                >
                  <FiExternalLink size={13} /> Dashboard
                </Link>
                <Link
                  className={`btn-secondary py-1.5 text-xs ${canOpenContext ? '' : 'pointer-events-none opacity-50'}`}
                  to={profilePath}
                  aria-disabled={!canOpenContext}
                >
                  Profile
                </Link>
              </>
            )}
            <Link
              className={`btn-secondary py-1.5 text-xs ${canOpenContext ? '' : 'pointer-events-none opacity-50'}`}
              to={activityPath}
              aria-disabled={!canOpenContext}
            >
              Activity
            </Link>
            <select
              className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700"
              value={row.status || 'active'}
              disabled={savingUserId === row.id}
              onChange={(event) => handleStatusChange(row, event.target.value)}
            >
              {USER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        );
      }
    }
  ];

  return (
    <div className="module-page module-page--admin">
      <AdminHeader
        title="360 Search"
        subtitle="Find accounts by email, phone, ID, company, or campus. For internal staff, inspect their activity record instead of opening a user dashboard."
      />
      {isDemo ? <p className="module-note">Demo data is shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />

      <section className="panel-card">
        <div className="command-search-bar">
          <div className="filter-bar__search">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="command-search-bar__input"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search email, phone, user ID, employee code, company, or campus..."
              />
            </div>
          </div>
          <label className="command-search-bar__field">
            Record type
            <select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}>
              {COMMAND_SEARCH_ROLE_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="command-search-bar__field">
            Status
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value || 'all'} value={status.value}>{status.label}</option>
              ))}
            </select>
          </label>
          {hasFilters ? (
            <button
              className="btn-secondary self-end py-3 text-xs"
              type="button"
              onClick={() => setFilters({ search: '', role: '', status: '' })}
            >
              Clear
            </button>
          ) : null}
        </div>

        {loading ? <p className="module-note">Searching platform records...</p> : null}
        {!loading && !results.length ? (
          <p className="module-note">
            {hasFilters
              ? 'No live records matched these filters. Try exact email, phone number, user ID, company, or campus name.'
              : 'Search with at least one filter to inspect a user support context.'}
          </p>
        ) : null}
        <DataTable columns={columns} rows={results} compact fitOnDesktop />
      </section>
    </div>
  );
};

export default CommandSearchPage;
