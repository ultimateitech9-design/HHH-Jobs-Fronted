import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatCard from '../../../shared/components/StatCard';
import StatusPill from '../../../shared/components/StatusPill';
import { formatDateTime as formatAuditTime, getAuditAlerts } from '../../audit/services/auditApi';
import {
  getPlatformSecurityChecks,
  updatePlatformSecurityCheck
} from '../services/platformApi';

const PlatformSecurityPage = () => {
  const [checks, setChecks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [checksRes, alertsRes] = await Promise.all([getPlatformSecurityChecks(), getAuditAlerts()]);
      if (!mounted) return;

      setChecks(checksRes.data || []);
      setAlerts((alertsRes.data || []).slice(0, 8));
      setIsDemo(checksRes.isDemo || alertsRes.isDemo);
      setError([checksRes, alertsRes].find((item) => item.error && !item.isDemo)?.error || '');
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const healthy = checks.filter((item) => item.status === 'healthy').length;
    const degraded = checks.filter((item) => item.status === 'degraded').length;
    const critical = checks.filter((item) => item.status === 'critical').length;
    const openAlerts = alerts.filter((item) => item.status === 'open').length;
    return [
      { label: 'Controls', value: String(checks.length), helper: `${healthy} healthy`, tone: 'info' },
      { label: 'Degraded', value: String(degraded), helper: 'Needs optimization', tone: degraded > 0 ? 'warning' : 'default' },
      { label: 'Critical', value: String(critical), helper: 'Immediate action', tone: critical > 0 ? 'danger' : 'success' },
      { label: 'Open Alerts', value: String(openAlerts), helper: 'From audit stream', tone: openAlerts > 0 ? 'warning' : 'default' }
    ];
  }, [checks, alerts]);

  const setCheckStatus = async (check, status) => {
    setError('');
    setMessage('');
    try {
      const updated = await updatePlatformSecurityCheck(check.id, { status });
      setChecks((current) => current.map((item) => (item.id === check.id ? updated : item)));
      setMessage(`Control "${check.control}" marked ${status}.`);
    } catch (actionError) {
      setError(actionError.message || 'Unable to update control.');
    }
  };

  const controlColumns = [
    { key: 'control', label: 'Control' },
    { key: 'owner', label: 'Owner' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value} />
    },
    { key: 'note', label: 'Note' },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="student-job-actions">
          <button type="button" className="btn-link" onClick={() => setCheckStatus(row, 'healthy')}>Healthy</button>
          <button type="button" className="btn-link" onClick={() => setCheckStatus(row, 'degraded')}>Degraded</button>
          <button type="button" className="btn-link" onClick={() => setCheckStatus(row, 'critical')}>Critical</button>
        </div>
      )
    }
  ];

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Security"
        title="Compliance and Control Monitoring"
        subtitle="Track control status, react to alert signals, and maintain trust posture across tenants."
      />

      {isDemo ? <p className="module-note">Showing fallback security data because the live backend is unavailable right now.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {loading ? <p className="module-note">Loading security controls...</p> : null}

      <div className="stats-grid">
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="split-grid">
        <section className="panel-card">
          <SectionHeader eyebrow="Control Matrix" title="Security and Compliance Checks" />
          <DataTable columns={controlColumns} rows={checks} />
        </section>

        <section className="panel-card">
          <SectionHeader eyebrow="Audit Alerts" title="Recent Risk Signals" />
          <ul className="student-list">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <div>
                  <h4>{alert.title}</h4>
                  <p>{alert.description}</p>
                  <p>{formatAuditTime(alert.created_at)}</p>
                </div>
                <div className="student-list-actions">
                  <StatusPill value={alert.severity} />
                  <StatusPill value={alert.status} />
                </div>
              </li>
            ))}
            {alerts.length === 0 ? <li>No alerts available.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PlatformSecurityPage;
