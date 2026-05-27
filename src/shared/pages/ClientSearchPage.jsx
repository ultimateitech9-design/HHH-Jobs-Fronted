import { useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import DataTable from '../components/DataTable';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { INDIAN_STATES } from '../constants/indianStates';
import { searchClients } from '../services/clientSearchApi';

const roleOptions = [
  { value: '', label: 'All Clients' },
  { value: 'hr', label: 'HR / Vendor' },
  { value: 'campus_connect', label: 'Campus' },
  { value: 'student', label: 'Student' }
];

const portalCopy = {
  support: {
    eyebrow: 'Support',
    title: 'Client Search',
    subtitle: 'Find HR, campus, student, lead, and customer records while handling support queries.'
  },
  sales: {
    eyebrow: 'Sales',
    title: 'Client Search',
    subtitle: 'Search leads, customers, and registered clients before onboarding or follow-up.'
  },
  accounts: {
    eyebrow: 'Accounts',
    title: 'Client Search',
    subtitle: 'Look up clients, billing owners, states, and commercial records during finance support.'
  }
};

const getPortalKey = (pathname = '') => {
  if (pathname.includes('/portal/sales')) return 'sales';
  if (pathname.includes('/portal/accounts')) return 'accounts';
  return 'support';
};

const formatType = (value = '') => {
  const normalized = String(value || '').replace(/_/g, ' ').trim();
  return normalized ? normalized.replace(/\b\w/g, (char) => char.toUpperCase()) : '-';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ClientSearchPage = () => {
  const location = useLocation();
  const portalKey = getPortalKey(location.pathname);
  const copy = portalCopy[portalKey] || portalCopy.support;
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    state: '',
    limit: 30
  });
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSearch = useMemo(() => (
    String(filters.search || '').trim().length >= 2 || Boolean(filters.role) || Boolean(filters.state)
  ), [filters]);

  const loadResults = async (nextFilters = filters) => {
    const nextCanSearch = String(nextFilters.search || '').trim().length >= 2 || Boolean(nextFilters.role) || Boolean(nextFilters.state);

    if (!nextCanSearch) {
      setResults([]);
      setTotal(0);
      setError('');
      return;
    }

    setLoading(true);
    const response = await searchClients(nextFilters);
    setResults(response.data?.results || []);
    setTotal(response.data?.total || 0);
    setError(response.error || '');
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadResults(filters);
    }, 280);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.role, filters.state, filters.limit]);

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Client',
      width: 220,
      render: (value, row) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-navy">{value || '-'}</p>
          <p className="truncate text-xs font-semibold text-slate-500">{row.company || row.email || '-'}</p>
        </div>
      )
    },
    { key: 'type', label: 'Record', width: 120, render: (value) => formatType(value) },
    { key: 'role', label: 'Audience', width: 130, render: (value) => formatType(value) },
    { key: 'phone', label: 'Phone', width: 135 },
    { key: 'email', label: 'Email', width: 220 },
    { key: 'state', label: 'State', width: 140, render: (value, row) => value || row.location || '-' },
    { key: 'owner', label: 'Owner', width: 150, render: (value) => value || '-' },
    { key: 'source', label: 'Source', width: 150, render: (value) => formatType(value) },
    {
      key: 'status',
      label: 'Status',
      width: 130,
      render: (value) => value ? <StatusPill value={value} /> : '-'
    },
    { key: 'updatedAt', label: 'Updated', width: 130, render: (value) => formatDate(value) }
  ], []);

  return (
    <div className="module-page module-page--platform">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />
      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Optimized lookup</h2>
            <p className="admin-ops-panel-note">Search by name, company, email, phone, state, or audience type.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
            {total} found
          </span>
        </div>
        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(260px,2fr)_minmax(160px,1fr)_minmax(160px,1fr)_auto]">
          <label className="relative min-w-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search client, company, email, phone"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <select
            value={filters.role}
            onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            {roleOptions.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
          </select>
          <select
            value={filters.state}
            onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All States</option>
            {INDIAN_STATES.map((stateName) => <option key={stateName} value={stateName}>{stateName}</option>)}
          </select>
          <button
            type="button"
            onClick={() => loadResults(filters)}
            className="btn-secondary justify-center"
            disabled={loading}
          >
            {loading ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
            Search
          </button>
        </div>
      </section>

      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Results</h2>
            <p className="admin-ops-panel-note">
              {canSearch ? 'Matched records from users, HR profiles, colleges, leads, and customers.' : 'Enter at least two characters or choose a filter.'}
            </p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          {loading ? <p className="module-note">Searching clients...</p> : null}
          <DataTable columns={columns} rows={results} pagination itemsPerPage={10} />
        </div>
      </section>
    </div>
  );
};

export default ClientSearchPage;
