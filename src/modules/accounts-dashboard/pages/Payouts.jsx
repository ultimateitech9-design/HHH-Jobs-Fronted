import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import RevenueCards from '../components/RevenueCards';
import PayoutTable from '../components/PayoutTable';
import { getPayouts } from '../services/paymentApi';
import { formatCurrency } from '../utils/currencyFormat';

const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await getPayouts();
      setPayouts(response.data || []);
      setError(response.error || '');
      setLoading(false);
    };

    load();
  }, []);

  const cards = useMemo(() => {
    const completed = payouts.filter((item) => item.status === 'completed');
    const pending = payouts.filter((item) => item.status === 'pending');

    return [
      { label: 'Payouts', value: String(payouts.length), helper: 'Settlement instructions', tone: 'info' },
      { label: 'Completed Value', value: formatCurrency(completed.reduce((sum, item) => sum + Number(item.amount || 0), 0)), helper: `${completed.length} completed`, tone: 'success' },
      { label: 'Pending Value', value: formatCurrency(pending.reduce((sum, item) => sum + Number(item.amount || 0), 0)), helper: `${pending.length} in queue`, tone: 'warning' },
      { label: 'Scheduled', value: String(payouts.filter((item) => item.status === 'scheduled').length), helper: 'Planned next run', tone: 'default' }
    ];
  }, [payouts]);

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Accounts"
        title="Payouts"
        subtitle="Track vendor settlements, affiliate payouts, and outbound account disbursements."
      />

      {error ? <p className="form-error">{error}</p> : null}
      <RevenueCards cards={cards} />

      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Payout settlement queue</h2>
            <p className="admin-ops-panel-note">Review beneficiary disbursements, payment methods, and outbound finance status.</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          {loading ? <p className="module-note">Loading payouts...</p> : null}
          <PayoutTable rows={payouts} />
        </div>
      </section>
    </div>
  );
};

export default Payouts;
