import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import RevenueCards from '../components/RevenueCards';
import TransactionTable from '../components/TransactionTable';
import { getTransactions } from '../services/paymentApi';
import { formatCurrency } from '../utils/currencyFormat';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: 'all', search: '' });

  useEffect(() => {
    const load = async () => {
      const response = await getTransactions();
      setTransactions(response.data || []);
      setError(response.error || '');
      setLoading(false);
    };

    load();
  }, []);

  const filteredTransactions = useMemo(() => {
    const search = String(filters.search || '').trim().toLowerCase();

    return transactions.filter((item) => {
      const matchesStatus = filters.status === 'all' || String(item.status || '').toLowerCase() === filters.status;
      const matchesSearch = !search || `${item.id} ${item.reference} ${item.customer} ${item.email}`.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [transactions, filters]);

  const cards = useMemo(() => {
    const paid = filteredTransactions.filter((item) => item.status === 'paid');
    const pending = filteredTransactions.filter((item) => item.status === 'pending');
    const failed = filteredTransactions.filter((item) => item.status === 'failed');

    return [
      { label: 'Visible Transactions', value: String(filteredTransactions.length), helper: 'Filtered dataset', tone: 'info' },
      { label: 'Collected', value: formatCurrency(paid.reduce((sum, item) => sum + Number(item.amount || 0), 0)), helper: `${paid.length} paid`, tone: 'success' },
      { label: 'Pending', value: String(pending.length), helper: 'Awaiting settlement', tone: 'warning' },
      { label: 'Failed', value: String(failed.length), helper: 'Requires reconciliation', tone: failed.length > 0 ? 'danger' : 'default' }
    ];
  }, [filteredTransactions]);

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Accounts"
        title="Transactions"
        subtitle="Review all payment collections across job postings, subscriptions, invoices, and refund activity."
      />

      {error ? <p className="form-error">{error}</p> : null}
      <RevenueCards cards={cards} />

      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Collections ledger</h2>
            <p className="admin-ops-panel-note">Filter payment flow by transaction state and review the current collections book.</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="student-inline-controls">
            <label>
              Status
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>

            <label className="full-width-control">
              Search
              <input
                value={filters.search}
                placeholder="Transaction ID, reference, company, email"
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </label>
          </div>

          {loading ? <p className="module-note">Loading transactions...</p> : null}
          <TransactionTable rows={filteredTransactions} />
        </div>
      </section>
    </div>
  );
};

export default Transactions;
