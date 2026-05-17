import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import ReportsChart from '../components/ReportsChart';
import StatusBadge from '../components/StatusBadge';
import { getReportsAnalytics } from '../services/reportsApi';

const ReportsAnalytics = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await getReportsAnalytics();
      setReports(response.data || null);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };
    load();
  }, []);

  const cards = useMemo(() => {
    return (reports?.moduleHealth || []).map((item) => ({
      label: item.label,
      value: String(item.value),
      helper: item.helper,
      tone: item.status === 'warning' ? 'warning' : 'success'
    }));
  }, [reports]);

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Reports & Analytics" subtitle="Review revenue and platform health trends." />
      {isDemo ? <p className="module-note">Demo data is shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {cards.length > 0 ? <DashboardStatsCards cards={cards} /> : null}
      <div className="split-grid">
        <section className="panel-card">
          <AdminHeader eyebrow="Revenue" title="Revenue Trend" subtitle="Monthly collections." />
          {loading ? <p className="module-note">Loading analytics...</p> : null}
          {!loading ? <ReportsChart rows={reports?.revenueTrend || []} /> : null}
        </section>
        <section className="panel-card">
          <AdminHeader eyebrow="Adoption" title="Platform Adoption" subtitle="Topline scale across key modules." />
          <ul className="dash-feed">
            {(reports?.adoption || []).map((item) => (
              <li key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.helper}</p>
                </div>
                <div className="student-job-actions">
                  <strong>{item.value}</strong>
                  <StatusBadge value={item.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
