import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import PaymentsTable from '../components/PaymentsTable';
import rankedSearch from '../../../shared/utils/rankedSearch';
import { getSubscriptions } from '../services/paymentsApi';
import { formatCurrency } from '../utils/currencyFormat';

const PAGE_SIZE = 10;

const SubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());

  useEffect(() => {
    const load = async () => {
      const response = await getSubscriptions();
      setSubscriptions(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status]);

  const cards = useMemo(() => [
    { label: 'Active Subscriptions', value: String(subscriptions.filter((item) => item.status === 'active').length), helper: 'Healthy recurring revenue accounts', tone: 'success' },
    { label: 'Past Due', value: String(subscriptions.filter((item) => item.status === 'past_due').length), helper: 'Needs collections follow-up', tone: 'warning' },
    { label: 'Monthly Recurring Revenue', value: formatCurrency(subscriptions.reduce((sum, item) => sum + item.mrr, 0)), helper: 'Current committed run-rate', tone: 'info' },
    { label: 'Total Seats', value: String(subscriptions.reduce((sum, item) => sum + item.seats, 0)), helper: 'Licensed user capacity', tone: 'default' }
  ], [subscriptions]);

  const rows = subscriptions.map((subscription) => ({
    id: subscription.id,
    company: subscription.company,
    item: subscription.plan,
    amount: subscription.mrr,
    method: `${subscription.seats} seats`,
    status: subscription.status,
    createdAt: subscription.renewalDate
  }));

  const filteredRows = useMemo(() => {
    const statusFiltered = rows.filter((row) => !filters.status || row.status === filters.status);

    if (!deferredSearch) {
      return statusFiltered;
    }

    return rankedSearch(statusFiltered, deferredSearch, ['id', 'company', 'item', 'method', 'status']);
  }, [rows, filters.status, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Subscriptions Management" subtitle="Track recurring plans, renewals, and seat usage." />
      {isDemo ? <p className="module-note">Demo data is shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card">
        <FilterBar
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          fields={[{ key: 'status', label: 'Status', options: ['active', 'trialing', 'past_due', 'canceled'].map((status) => ({ value: status, label: status })) }]}
        />
        {loading ? <p className="module-note">Loading subscriptions...</p> : null}
        <PaymentsTable rows={paginatedRows} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
    </div>
  );
};

export default SubscriptionsManagement;
