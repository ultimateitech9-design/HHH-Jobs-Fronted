import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import CustomerTable from '../components/CustomerTable';
import SalesStatCards from '../components/SalesStatCards';
import { getCustomers } from '../services/customerApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await getCustomers();
      setCustomers(response.data || []);
      setError(response.error || '');
      setLoading(false);
    };
    load();
  }, []);

  const cards = useMemo(() => [
    { label: 'Customers', value: String(customers.length), helper: 'Managed accounts', tone: 'info' },
    { label: 'Active', value: String(customers.filter((item) => item.status === 'active').length), helper: 'Current paying customers', tone: 'success' },
    { label: 'Inactive', value: String(customers.filter((item) => item.status === 'inactive').length), helper: 'Reactivation opportunities', tone: 'warning' },
    { label: 'Lifetime Value', value: formatCompactCurrency(customers.reduce((sum, item) => sum + Number(item.lifetimeValue || 0), 0)), helper: 'Total visible account value', tone: 'default' }
  ], [customers]);

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
