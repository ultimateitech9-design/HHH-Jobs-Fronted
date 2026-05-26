import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import CustomerTable from '../components/CustomerTable';
import SalesStatCards from '../components/SalesStatCards';
import { getCustomers } from '../services/customerApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({ totalAccounts: 0, activeAccounts: 0, inactiveAccounts: 0, lifetimeValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await getCustomers();
      setCustomers(response.data?.customers || []);
      setSummary(response.data?.summary || { totalAccounts: 0, activeAccounts: 0, inactiveAccounts: 0, lifetimeValue: 0 });
      setError(response.error || '');
      setLoading(false);
    };
    load();
  }, []);

  const cards = useMemo(() => [
    { label: 'Accounts', value: String(summary.totalAccounts || 0), helper: 'HR, campus, and student accounts', tone: 'info' },
    { label: 'Plan Taken', value: String(summary.activeAccounts || 0), helper: 'Current paying or active plan users', tone: 'success' },
    { label: 'Plan Pending', value: String(summary.inactiveAccounts || 0), helper: 'Accounts to convert', tone: 'warning' },
    { label: 'Lifetime Value', value: formatCompactCurrency(summary.lifetimeValue || 0), helper: 'Collected account value', tone: 'default' }
  ], [summary]);

  return (
    <div className="module-page module-page--platform">
      <SectionHeader eyebrow="Sales" title="Customers" subtitle="Track active accounts, lifetime value, ownership, and payment status." />
      {error ? <p className="form-error">{error}</p> : null}
      <SalesStatCards cards={cards} />
      <section className="panel-card">
        {loading ? <p className="module-note">Loading customers...</p> : null}
        <CustomerTable rows={customers} />
      </section>
    </div>
  );
};

export default Customers;
