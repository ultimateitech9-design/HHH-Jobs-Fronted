import { formatCompactCurrency } from '../utils/currencyFormat';

const RevenueChart = ({ points = [] }) => {
  const maxValue = points.reduce((highest, item) => Math.max(highest, Number(item.revenue || 0), Number(item.refunds || 0)), 0) || 1;

  return (
    <section className="panel-card">
      <div className="dash-card-head">
        <div>
          <h3>Revenue Trend</h3>
          <p>Monthly revenue compared with refund pressure.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.9rem' }}>
        {points.map((point) => (
          <div key={point.month} style={{ display: 'grid', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>{point.month}</span>
              <span>{formatCompactCurrency(point.revenue || 0)}</span>
            </div>
            <div style={{ height: '10px', borderRadius: '999px', background: '#dbe7f1', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((Number(point.revenue || 0) / maxValue) * 100)}%`, height: '100%', background: '#1f7a61' }} />
            </div>
            <div style={{ height: '10px', borderRadius: '999px', background: '#f6d9d9', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((Number(point.refunds || 0) / maxValue) * 100)}%`, height: '100%', background: '#d44f4f' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RevenueChart;
