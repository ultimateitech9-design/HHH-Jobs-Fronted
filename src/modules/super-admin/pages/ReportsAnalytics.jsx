import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import ReportsChart from '../components/ReportsChart';
import StatusBadge from '../components/StatusBadge';
import { getReportsAnalytics } from '../services/reportsApi';
import { formatCurrency } from '../utils/currencyFormat';

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

  const healthPanels = useMemo(() => {
    if (!reports) return [];

    return [
      {
        title: 'Website',
        rows: [
          { label: 'Status', value: reports.website?.status || '-' },
          { label: 'Runtime', value: reports.website?.uptimeLabel || '-' },
          { label: 'Critical events', value: reports.website?.criticalEvents ?? 0 },
          { label: 'Warnings', value: reports.website?.warningEvents ?? 0 }
        ]
      },
      {
        title: 'Database',
        rows: [
          { label: 'Provider', value: reports.database?.provider || 'mysql' },
          { label: 'Tables', value: reports.database?.tableCount ?? 0 },
          { label: 'Size', value: `${reports.database?.sizeMb ?? 0} MB` },
          { label: 'Issues', value: reports.database?.issueCount ?? 0 }
        ]
      },
      {
        title: 'Operations',
        rows: [
          { label: 'Companies', value: reports.operations?.companyCount ?? reports.totalCompanies ?? 0 },
          { label: 'Campuses', value: reports.operations?.campusCount ?? reports.totalCampuses ?? 0 },
          { label: 'Active subscriptions', value: reports.operations?.activeSubscriptions ?? 0 },
          { label: 'Revenue', value: formatCurrency(reports.operations?.revenue ?? reports.totalRevenue ?? 0) }
        ]
      }
    ];
  }, [reports]);

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Reports & Analytics" subtitle="Review revenue and platform health trends." />
      {isDemo ? <p className="module-note">Demo data is shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {cards.length > 0 ? <DashboardStatsCards cards={cards} /> : null}
      <section className="panel-card">
        <AdminHeader eyebrow="Live Website Report" title="Traffic & Runtime Signals" subtitle="Derived from platform activity, system logs, support queue, and MySQL health." />
        {loading ? <p className="module-note">Loading health report...</p> : null}
        <div className="report-signal-grid">
          {(reports?.traffic || []).map((item) => (
            <div key={item.label} className="report-signal">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.helper}</p>
              <StatusBadge value={item.status} />
            </div>
          ))}
        </div>
      </section>
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
      <section className="panel-card">
        <AdminHeader eyebrow="Health" title="Website, DB & Operations" subtitle="Quick checks for support and engineering." />
        <div className="report-health-grid">
          {healthPanels.map((panel) => (
            <div key={panel.title} className="report-health-panel">
              <h3>{panel.title}</h3>
              <dl>
                {panel.rows.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ReportsAnalytics;
