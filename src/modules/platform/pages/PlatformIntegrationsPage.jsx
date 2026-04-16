import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import {
  formatDateTime,
  getPlatformIntegrations,
  runPlatformIntegrationSync,
  updatePlatformIntegration
} from '../services/platformApi';

const PlatformIntegrationsPage = () => {
  const [integrations, setIntegrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadIntegrations = async () => {
    setLoading(true);
    const response = await getPlatformIntegrations();
    setIntegrations(response.data || []);
    setIsDemo(response.isDemo);
    setLoading(false);
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const rows = useMemo(() => {
    if (statusFilter === 'all') return integrations;
    return integrations.filter((integration) => integration.status === statusFilter);
  }, [integrations, statusFilter]);

  const setRowStatus = async (integration, status) => {
    setError('');
    setMessage('');

    try {
      const updated = await updatePlatformIntegration(integration.id, { status });
      setIntegrations((current) => current.map((row) => (row.id === integration.id ? updated : row)));
      setMessage(`Integration ${integration.name} marked ${status}.`);
    } catch (actionError) {
      setError(actionError.message || 'Unable to update integration.');
    }
  };

  const runSync = async (integration) => {
    setError('');
    setMessage('');
    try {
      const updated = await runPlatformIntegrationSync(integration.id);
      setIntegrations((current) => current.map((row) => (row.id === integration.id ? updated : row)));
      setMessage(`Sync triggered for ${integration.name}.`);
    } catch (actionError) {
      setError(actionError.message || 'Unable to run sync.');
    }
  };

  const columns = [
    { key: 'name', label: 'Integration' },
    { key: 'category', label: 'Category' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'active'} />
    },
    { key: 'latencyMs', label: 'Latency (ms)' },
    {
      key: 'lastSyncAt',
      label: 'Last Sync',
      render: (value) => formatDateTime(value)
    },
    { key: 'owner', label: 'Owner' },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="student-job-actions">
          <button type="button" className="btn-link" onClick={() => setRowStatus(row, 'active')}>Active</button>
          <button type="button" className="btn-link" onClick={() => setRowStatus(row, 'degraded')}>Degraded</button>
          <button type="button" className="btn-link" onClick={() => setRowStatus(row, 'offline')}>Offline</button>
          <button type="button" className="btn-link" onClick={() => runSync(row)}>Run Sync</button>
        </div>
      )
    }
  ];

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Integrations"
        title="Connector Health and Sync Control"
        subtitle="Manage integration uptime, monitor latency, and trigger manual sync runs."
      />

      {isDemo ? <p className="module-note">Showing fallback integration data because the live backend is unavailable right now.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <section className="panel-card">
        <div className="student-inline-controls">
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="degraded">Degraded</option>
              <option value="offline">Offline</option>
            </select>
          </label>
        </div>

        {loading ? <p className="module-note">Loading integrations...</p> : null}
        <DataTable columns={columns} rows={rows} />
      </section>
    </div>
  );
};

export default PlatformIntegrationsPage;
