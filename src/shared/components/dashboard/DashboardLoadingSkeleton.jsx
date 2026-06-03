const DashboardLoadingSkeleton = ({ cards = 4, panels = 3, className = '' }) => (
  <div className={`dashboard-loading-skeleton ${className}`.trim()} aria-label="Loading dashboard">
    <div className="dashboard-loading-skeleton__cards">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={`card-${index}`} className="dashboard-loading-skeleton__card">
          <span />
          <strong />
          <em />
        </div>
      ))}
    </div>
    <div className="dashboard-loading-skeleton__panels">
      {Array.from({ length: panels }).map((_, index) => (
        <div key={`panel-${index}`} className="dashboard-loading-skeleton__panel">
          <span />
          <strong />
          <i />
          <i />
          <i />
        </div>
      ))}
    </div>
  </div>
);

export default DashboardLoadingSkeleton;
