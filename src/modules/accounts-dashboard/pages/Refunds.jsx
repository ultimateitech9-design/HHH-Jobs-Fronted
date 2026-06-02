import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import RevenueCards from '../components/RevenueCards';
import RefundTable from '../components/RefundTable';
import { getRefunds } from '../services/paymentApi';
import { formatCurrency } from '../utils/currencyFormat';

const Refunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await getRefunds();
      setRefunds(response.data || []);
      setError(response.error || '');
      setLoading(false);
    };

    load();
  }, []);

  const cards = useMemo(() => {
    const refunded = refunds.filter((item) => item.status === 'refunded');
    const pending = refunds.filter((item) => item.status === 'pending');

    return [
      { label: 'Refund Requests', value: String(refunds.length), helper: 'All refund cases', tone: 'info' },
      { label: 'Refunded Amount', value: formatCurrency(refunded.reduce((sum, item) => sum + Number(item.amount || 0), 0)), helper: `${refunded.length} completed`, tone: 'success' },
      { label: 'Pending Refunds', value: formatCurrency(pending.reduce((sum, item) => sum + Number(item.amount || 0), 0)), helper: `${pending.length} awaiting processing`, tone: 'warning' },
      { label: 'Exposure Count', value: String(pending.length), helper: 'Open refund risk', tone: pending.length > 0 ? 'danger' : 'default' }
    ];
  }, [refunds]);

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Accounts"
        title="Refunds"
        subtitle="Monitor refund requests raised by employers and finance reversals triggered from failed payment events."
      />

      {error ? <p className="form-error">{error}</p> : null}
      <RevenueCards cards={cards} />

      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Refund operations queue</h2>
            <p className="admin-ops-panel-note">Track refund exposure, processing completion, and reasons behind reversals.</p>
          </div>
        </div>
        <div className="px-2 py-2 sm:px-3 sm:py-3">
          {loading ? <p className="module-note">Loading refunds...</p> : null}
          <RefundTable rows={refunds} />
        </div>
      </section>
    </div>
  );
};

export default Refunds;
