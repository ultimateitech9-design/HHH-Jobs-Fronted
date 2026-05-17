import { formatCompactCurrency } from '../utils/currencyFormat';

const RevenueChart = ({ points = [] }) => {
  const maxValue = points.reduce((highest, item) => Math.max(highest, Number(item.revenue || 0), Number(item.expenses || 0)), 0) || 1;

  return (
    <div className="admin-ops-panel">
      <div className="admin-ops-panel-header">
        <div>
          <h2 className="admin-ops-panel-title">Monthly collections vs spend</h2>
          <p className="admin-ops-panel-note">Commercial performance for the HHH Jobs portal accounts flow.</p>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5" style={{ display: 'grid', gap: '1rem' }}>
        {points.length === 0 ? (
          <div className="admin-ops-empty-state">
            <p className="admin-ops-empty-state__title">No revenue trend available</p>
            <p className="admin-ops-empty-state__copy">Once finance reporting data is available, monthly collections and spend comparisons will appear here.</p>
          </div>
        ) : points.map((point) => (
          <div key={point.month} style={{ display: 'grid', gap: '0.45rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontWeight: 600 }}>
              <span>{point.month}</span>
              <span>{formatCompactCurrency(point.revenue || 0)}</span>
            </div>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <div style={{ height: '10px', borderRadius: '999px', background: '#dbe7f1', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.max(8, Math.round((Number(point.revenue || 0) / maxValue) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #1f7a61 0%, #2d8fcb 100%)'
                  }}
                />
              </div>
              <div style={{ height: '10px', borderRadius: '999px', background: '#f2e2d4', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.max(8, Math.round((Number(point.expenses || 0) / maxValue) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #c16b2f 0%, #d44f4f 100%)'
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;
