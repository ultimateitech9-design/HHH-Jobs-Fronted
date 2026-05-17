import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import RevenueCards from '../components/RevenueCards';
import { getSubscriptions } from '../services/accountsApi';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDate } from '../utils/dateFormat';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await getSubscriptions();
      setSubscriptions(response.data || []);
      setError(response.error || '');
      setLoading(false);
    };

    load();
  }, []);

  const cards = useMemo(() => {
    const active = subscriptions.filter((item) => item.status === 'active');
    const pastDue = subscriptions.filter((item) => item.status === 'past_due');

    return [
      { label: 'Subscriptions', value: String(subscriptions.length), helper: 'Employer billing accounts', tone: 'info' },
      { label: 'Active Plans', value: String(active.length), helper: 'Healthy recurring plans', tone: 'success' },
      { label: 'Monthly Billing', value: formatCurrency(subscriptions.filter((item) => item.billingCycle === 'Monthly').reduce((sum, item) => sum + Number(item.amount || 0), 0)), helper: 'Recurring monthly run-rate', tone: 'info' },
      { label: 'Past Due', value: String(pastDue.length), helper: 'Needs collection follow-up', tone: pastDue.length > 0 ? 'warning' : 'default' }
    ];
  }, [subscriptions]);

  const columns = [
    { key: 'company', label: 'Company' },
    { key: 'plan', label: 'Plan' },
    { key: 'billingCycle', label: 'Cycle' },
    { key: 'seats', label: 'Seats' },
    {
      key: 'amount',
      label: 'Value',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'active'} />
    },
    {
      key: 'renewalDate',
      label: 'Renewal',
      render: (value) => formatDate(value)
    }
  ];

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Accounts"
        title="Subscriptions"
        subtitle="Monitor active employer plans, recurring value, renewal dates, and overdue subscriptions."
      />

      {error ? <p className="form-error">{error}</p> : null}
      <RevenueCards cards={cards} />

      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Recurring billing registry</h2>
            <p className="admin-ops-panel-note">Review employer plan health, renewal timing, and recurring contract value from one list.</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          {loading ? <p className="module-note">Loading subscriptions...</p> : null}
          <DataTable columns={columns} rows={subscriptions} searchable pagination itemsPerPage={8} searchPlaceholder="Search company, plan, billing cycle, or status" />
        </div>
      </section>
    </div>
  );
};

export default Subscriptions;
