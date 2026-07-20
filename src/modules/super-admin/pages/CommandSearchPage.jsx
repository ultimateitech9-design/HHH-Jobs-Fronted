import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiExternalLink, FiSearch, FiUser } from 'react-icons/fi';
import DataTable from '../../../shared/components/DataTable';
import CompanyContextSummary from '../../../shared/components/CompanyContextSummary';
import { normalizeCompanies } from '../../../shared/utils/companyContext';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import StatusBadge from '../components/StatusBadge';
import { USER_ROLE_LABELS } from '../constants/userRoles';
import { cacheSupportContextSeed, getCommandSearchResults, updateUserStatus } from '../services/usersApi';
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
const COMMAND_SEARCH_MIN_QUERY_LENGTH = 2;
const COMMAND_SEARCH_DEBOUNCE_MS = 300;

const formatRole = (role = '') => USER_ROLE_LABELS[role] || String(role || '-').replace(/_/g, ' ');

const CompanyPostingContext = ({ row }) => {
  const relation = row.companyRelations || {};
  const isHr = ['hr', 'company_admin'].includes(String(row.role || '').toLowerCase());
  const companies = normalizeCompanies([
    relation.matchedCompany,
    row.company,
    ...(relation.postedCompanies || []),
    ...(relation.managedCompanies || []),
    ...(relation.companies || [])
  ]);

  if (!isHr) {
    return <span className="text-xs font-semibold text-slate-700">{companies[0] || '-'}</span>;
  }

  const jobCount = Number(relation.jobCount || row.metrics?.jobs || 0);
  const postedCompanyCount = Number(relation.postedCompanyCount || relation.postedCompanies?.length || 0);

  return (
    <CompanyContextSummary
      companies={companies}
      primaryCompany={companies[0]}
      jobCount={jobCount}
      postingCompanyCount={postedCompanyCount}
    />
  );
};

const ProfileContext = ({ row }) => {
  const isHr = ['hr', 'company_admin'].includes(String(row.role || '').toLowerCase());
  const profileLabel = isHr
    ? (row.profile?.verified ? 'Verified HR profile' : 'HR verification pending')
    : (row.profile?.headline || row.recordType || '-');

  return (
    <div className="min-w-0 text-xs leading-5 text-slate-600">
      <strong className="block text-slate-800">{profileLabel}</strong>
      <span className="block break-words">{row.profile?.location || '-'}</span>
      <span className="block break-words">{row.recordType || (row.profile?.verified ? 'Verified profile' : 'Verification not complete')}</span>
      {row.employee?.code && row.employee.code !== '-' ? (
        <span className="block font-mono text-[11px] text-slate-400">{row.employee.code}</span>
      ) : null}
    </div>
  );
};

const getSupportContextPath = (portalBasePath, userId, view) => (
  `${portalBasePath}/users/${encodeURIComponent(userId)}/${view}`
);

const getActivityPath = ({ portalBasePath, row }) => {
  if (portalBasePath === '/portal/admin') {
    const userId = encodeURIComponent(row.id || '');
    return `/portal/admin/audit${userId ? `?userId=${userId}` : ''}`;
  }

  return row.links?.activityLog || '/portal/super-admin/system-logs';
};

const useDebouncedValue = (value, delayMs) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
};

const CommandSearchPage = ({ portalBasePath = '/portal/super-admin' }) => {
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [savingUserId, setSavingUserId] = useState('');
  const normalizedSearch = String(filters.search || '').trim();
  const debouncedSearch = useDebouncedValue(normalizedSearch, COMMAND_SEARCH_DEBOUNCE_MS);
  const hasSearchText = debouncedSearch.length >= COMMAND_SEARCH_MIN_QUERY_LENGTH;
  const hasBlockingShortSearch = Boolean(normalizedSearch) && normalizedSearch.length < COMMAND_SEARCH_MIN_QUERY_LENGTH && !filters.role && !filters.status;
  const hasFilters = Boolean(hasSearchText || filters.role || filters.status);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      if (!hasFilters) {
        setResults([]);
        setError('');
        setIsDemo(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await getCommandSearchResults({
          q: hasSearchText ? debouncedSearch : '',
          role: filters.role,
          status: filters.status,
          limit: 30,
          signal: controller.signal
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
      controller?.abort();
    };
  }, [debouncedSearch, filters.role, filters.status, hasFilters, hasSearchText]);

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
      label: 'Account',
      width: 210,
      render: (_value, row) => (
        <div className="command-result-account">
          <strong title={row.name || '-'}>{row.name || '-'}</strong>
          <span title={row.email || '-'}>{row.email || '-'}</span>
          <small>{row.contactNumber || row.phone || row.mobile || 'No contact number'}</small>
        </div>
      )
    },
    {
      key: 'context',
      label: 'Organisation & profile',
      width: 360,
      render: (_value, row) => (
        <div className="command-result-context">
          <CompanyPostingContext row={row} />
          <ProfileContext row={row} />
        </div>
      )
    },
    {
      key: 'access',
      label: 'Access & activity',
      width: 250,
      render: (_value, row) => (
        <div className="command-result-access">
          <div className="command-result-access__badges">
            <StatusBadge value={formatRole(row.role)} />
            <StatusBadge value={row.status || 'active'} />
          </div>
          <div className="command-result-access__dates">
            <span><small>Onboarded</small>{formatDateTime(row.onboardingDate || row.createdAt)}</span>
            <span><small>Last active</small>{formatDateTime(row.lastActiveAt) || '-'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'metrics',
      label: 'Signals',
      width: 130,
      render: (_value, row) => (
        <div className="command-result-signals">
          <span><strong>{row.metrics?.jobs || 0}</strong>Jobs</span>
          <span><strong>{row.metrics?.applications || 0}</strong>Apps</span>
          <span><strong>{row.metrics?.payments || 0}</strong>Pay</span>
          <span><strong>{row.metrics?.activityEvents || 0}</strong>Logs</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Support Actions',
      width: 240,
      stickyRight: true,
      render: (_value, row) => {
        const isEmployeeRecord = row.contextType === 'employee_record';
        const dashboardPath = getSupportContextPath(portalBasePath, row.id, 'dashboard');
        const profilePath = getSupportContextPath(portalBasePath, row.id, 'profile');
        const activityPath = getActivityPath({ portalBasePath, row });
        const recordPath = isEmployeeRecord ? activityPath : profilePath;
        const canOpenContext = Boolean(row.id);

        return (
          <div className="command-result-actions">
            {isEmployeeRecord ? (
              <Link
                className={`command-result-action ${canOpenContext ? '' : 'pointer-events-none opacity-50'}`}
                to={recordPath}
                aria-disabled={!canOpenContext}
                onClick={() => cacheSupportContextSeed(row)}
              >
                <FiActivity size={13} /> Record
              </Link>
            ) : (
              <>
                <Link
                  className={`command-result-action ${canOpenContext ? '' : 'pointer-events-none opacity-50'}`}
                  to={dashboardPath}
                  aria-disabled={!canOpenContext}
                  onClick={() => cacheSupportContextSeed(row)}
                >
                  <FiExternalLink size={13} /> Dashboard
                </Link>
                <Link
                  className={`command-result-action ${canOpenContext ? '' : 'pointer-events-none opacity-50'}`}
                  to={profilePath}
                  aria-disabled={!canOpenContext}
                  onClick={() => cacheSupportContextSeed(row)}
                >
                  <FiUser size={13} /> Profile
                </Link>
              </>
            )}
            <Link
              className={`command-result-action ${canOpenContext ? '' : 'pointer-events-none opacity-50'}`}
              to={activityPath}
              aria-disabled={!canOpenContext}
            >
              <FiActivity size={13} /> Activity
            </Link>
            <select
              className="command-result-status-select"
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

      <section className="panel-card command-search-results">
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
            {hasBlockingShortSearch
              ? `Type at least ${COMMAND_SEARCH_MIN_QUERY_LENGTH} characters, or choose a record/status filter.`
              : hasFilters
              ? 'No live records matched these filters. Try exact email, phone number, user ID, company, or campus name.'
              : 'Search with at least one filter to inspect a user support context.'}
          </p>
        ) : null}
        <DataTable columns={columns} rows={results} compact fitOnDesktop professional />
      </section>
    </div>
  );
};

export default CommandSearchPage;
