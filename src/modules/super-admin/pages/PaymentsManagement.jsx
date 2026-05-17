import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import ConfirmModal from '../components/ConfirmModal';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import PaymentsTable from '../components/PaymentsTable';
import rankedSearch from '../../../shared/utils/rankedSearch';
import { getPayments, updatePaymentStatus } from '../services/paymentsApi';
import { formatCurrency } from '../utils/currencyFormat';

const PAGE_SIZE = 10;

const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [targetPayment, setTargetPayment] = useState(null);
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());

  useEffect(() => {
    const load = async () => {
      const response = await getPayments();
      setPayments(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status]);

  const filteredPayments = useMemo(() => {
    const statusFiltered = payments.filter((payment) => {
      const matchesStatus = !filters.status || payment.status === filters.status;
      return matchesStatus;
    });

    if (!deferredSearch) {
      return statusFiltered;
    }

    return rankedSearch(statusFiltered, deferredSearch, ['id', 'invoiceId', 'company', 'item', 'method', 'status']);
  }, [payments, filters.status, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const paginatedPayments = useMemo(
    () => filteredPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPayments, page]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const cards = useMemo(() => [
    { label: 'Collected Revenue', value: formatCurrency(payments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)), helper: 'Successful settled items', tone: 'success' },
    { label: 'Pending Payments', value: String(payments.filter((item) => item.status === 'pending').length), helper: 'Requires follow-up', tone: 'warning' },
    { label: 'Refunded', value: String(payments.filter((item) => item.status === 'refunded').length), helper: 'Watch refund pressure', tone: 'default' },
    { label: 'Failed Collections', value: String(payments.filter((item) => item.status === 'failed').length), helper: 'Retry and risk review', tone: 'danger' }
  ], [payments]);

  const handleApprove = async () => {
    if (!targetPayment) return;
    const updated = await updatePaymentStatus(targetPayment.id, 'paid');
    setPayments((current) => current.map((payment) => (payment.id === targetPayment.id ? { ...payment, ...updated, status: 'paid' } : payment)));
    setTargetPayment(null);
  };

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Payments Management" subtitle="Monitor collections, failures, and refunds." />
      {isDemo ? <p className="module-note">Demo data is shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card">
        <FilterBar
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          fields={[{ key: 'status', label: 'Status', options: ['paid', 'pending', 'failed', 'refunded', 'past_due'].map((status) => ({ value: status, label: status })) }]}
          actions={paginatedPayments[0] ? <button type="button" className="btn-secondary" onClick={() => setTargetPayment(paginatedPayments[0])}>Mark first visible payment paid</button> : null}
        />
        {loading ? <p className="module-note">Loading payments...</p> : null}
        <PaymentsTable rows={paginatedPayments} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
      <ConfirmModal
        open={Boolean(targetPayment)}
        title="Confirm payment settlement"
        message={targetPayment ? `Mark ${targetPayment.id} as paid?` : ''}
        confirmLabel="Mark paid"
        onConfirm={handleApprove}
        onClose={() => setTargetPayment(null)}
      />
    </div>
  );
};

export default PaymentsManagement;
