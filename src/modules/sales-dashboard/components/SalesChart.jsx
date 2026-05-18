const SalesChart = ({ points = [] }) => {
  const maxValue = points.reduce((highest, item) => Math.max(highest, Number(item.value || 0), Number(item.target || 0)), 0) || 1;

  return (
    <section className="panel-card">
      <div className="dash-card-head">
        <div>
          <h3>Sales Trend</h3>
          <p>Track closed sales from live commercial activity.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.9rem' }}>
        {points.map((point) => (
          <div key={point.month} style={{ display: 'grid', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>{point.month}</span>
              <span>{point.target ? `${point.value} / ${point.target}` : point.value}</span>
            </div>
            <div style={{ height: '12px', borderRadius: '999px', background: '#dbe7f1', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.round((Number(point.value || 0) / maxValue) * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #1f7a61 0%, #2d8fcb 100%)'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SalesChart;
