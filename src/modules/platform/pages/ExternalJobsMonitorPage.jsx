import { useCallback, useEffect, useState } from 'react';
import {
  FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiDatabase, FiActivity,
  FiPlay, FiClock, FiList, FiToggleLeft, FiToggleRight, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import {
  adminGetMonitorStats,
  adminGetSyncLogs,
  adminTriggerSync,
  adminTriggerVerification,
  adminToggleJob,
  adminGetAllJobs
} from '../services/externalJobsApi';

const StatusBadge = ({ status }) => {
  const map = {
    ok: 'bg-success-100 text-success-700',
    success: 'bg-success-100 text-success-700',
    error: 'bg-error-100 text-error-700',
    pending: 'bg-warning-100 text-warning-700',
    verified: 'bg-success-100 text-success-700',
    expired: 'bg-error-100 text-error-700',
    timeout: 'bg-warning-100 text-warning-700',
    unknown: 'bg-neutral-100 text-neutral-600'
  };
  const cls = map[String(status).toLowerCase()] || 'bg-neutral-100 text-neutral-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status || '—'}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'brand' }) => (
  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
      <Icon className={`text-${color}-600`} size={22} />
    </div>
    <div>
      <p className="text-2xl font-bold text-neutral-900">{value ?? '—'}</p>
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const formatDuration = (ms) => {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

export default function ExternalJobsMonitorPage() {
  const [monitor, setMonitor] = useState({ sources: [], activeJobCount: 0, recentLogs: [] });
  const [monitorLoading, setMonitorLoading] = useState(true);
  const [logs, setLogs] = useState({ logs: [], pagination: null });
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [jobs, setJobs] = useState({ jobs: [], pagination: null });
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsPage, setJobsPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionState, setActionState] = useState({ loading: false, message: '', isError: false });
  const sourceNameMap = Object.fromEntries((monitor.sources || []).map((source) => [source.key, source]));

  const loadMonitor = useCallback(async () => {
    setMonitorLoading(true);
    const res = await adminGetMonitorStats();
    if (!res.error) setMonitor(res.data);
    setMonitorLoading(false);
  }, []);

  const loadLogs = useCallback(async (page = 1) => {
    setLogsLoading(true);
    const res = await adminGetSyncLogs({ page, limit: 20 });
    if (!res.error) setLogs(res.data);
    setLogsLoading(false);
  }, []);

  const loadJobs = useCallback(async (page = 1) => {
    setJobsLoading(true);
    const res = await adminGetAllJobs({ page, limit: 15 });
    if (!res.error) setJobs(res.data);
    setJobsLoading(false);
  }, []);

  useEffect(() => {
    loadMonitor();
    loadLogs(1);
    loadJobs(1);
  }, [loadMonitor, loadLogs, loadJobs]);

  useEffect(() => {
    loadLogs(logsPage);
  }, [logsPage, loadLogs]);

  useEffect(() => {
    loadJobs(jobsPage);
  }, [jobsPage, loadJobs]);

  const runAction = async (label, action) => {
    setActionState({ loading: true, message: `Running ${label}...`, isError: false });
    try {
      const res = await action();
      if (res.error) {
        setActionState({ loading: false, message: `${label} failed: ${res.error}`, isError: true });
      } else {
        setActionState({ loading: false, message: `${label} completed successfully.`, isError: false });
        loadMonitor();
        loadLogs(1);
      }
    } catch (err) {
      setActionState({ loading: false, message: `${label} error: ${err.message}`, isError: true });
    }

    setTimeout(() => setActionState({ loading: false, message: '', isError: false }), 5000);
  };

  const handleToggleJob = async (jobId) => {
    await adminToggleJob(jobId);
    loadJobs(jobsPage);
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: FiActivity },
    { key: 'logs', label: 'Sync Logs', icon: FiList },
    { key: 'jobs', label: 'Jobs', icon: FiDatabase }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">External Jobs Monitor</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Monitor live ingestion from official company career sites and curated global boards. Auto-syncs every 30 minutes.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => runAction('Full Sync', () => adminTriggerSync())}
            disabled={actionState.loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            <FiPlay size={14} />
            Sync All Sources
          </button>
          <button
            onClick={() => runAction('Verification', adminTriggerVerification)}
            disabled={actionState.loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg border border-neutral-200 transition-colors disabled:opacity-60"
          >
            <FiCheckCircle size={14} />
            Verify Jobs
          </button>
          <button
            onClick={loadMonitor}
            disabled={monitorLoading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-600 text-sm rounded-lg border border-neutral-200 transition-colors"
          >
            <FiRefreshCw size={14} className={monitorLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {actionState.message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg border text-sm ${
          actionState.isError
            ? 'bg-error-50 border-error-200 text-error-700'
            : 'bg-success-50 border-success-200 text-success-700'
        }`}>
          {actionState.isError ? <FiAlertTriangle size={16} /> : <FiCheckCircle size={16} />}
          {actionState.message}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={FiDatabase} label="Active Jobs" value={monitor.activeJobCount} color="brand" />
        <StatCard icon={FiActivity} label="Sources" value={monitor.sources?.length} color="success" />
        <StatCard icon={FiCheckCircle} label="Active Sources" value={monitor.sources?.filter((s) => s.is_active).length} color="success" />
        <StatCard icon={FiClock} label="Recent Syncs" value={monitor.recentLogs?.length} color="warning" />
      </div>

      <div className="border-b border-neutral-200">
        <nav className="flex gap-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-3">Sources Status</h2>
            {monitorLoading ? (
              <div className="h-32 flex items-center justify-center text-neutral-400 text-sm">Loading...</div>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">Source</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">Last Sync</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">Last Count</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">Active</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(monitor.sources || []).map((source) => (
                      <tr key={source.key} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-800">
                          <a
                            href={source.base_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-brand-600 transition-colors"
                          >
                            {source.name}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={source.last_fetch_status || 'pending'} />
                        </td>
                        <td className="px-4 py-3 text-neutral-500">{formatDateTime(source.last_fetched_at)}</td>
                        <td className="px-4 py-3 text-neutral-600">{source.last_fetch_count ?? 0}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${source.is_active ? 'text-success-600' : 'text-neutral-400'}`}>
                            {source.is_active ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                            {source.is_active ? 'Active' : 'Paused'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => runAction(`Sync ${source.name}`, () => adminTriggerSync(source.key))}
                            disabled={actionState.loading}
                            className="text-xs text-brand-600 hover:text-brand-800 font-medium disabled:opacity-40"
                          >
                            Sync Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-3">Recent Sync Activity</h2>
            <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Source</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Fetched</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">New</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Dupes</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(monitor.recentLogs || []).slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{log.source_key}</td>
                      <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                      <td className="px-4 py-3 text-neutral-600">{log.jobs_fetched}</td>
                      <td className="px-4 py-3 text-success-600 font-medium">+{log.jobs_new}</td>
                      <td className="px-4 py-3 text-neutral-400">{log.jobs_deduped}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatDateTime(log.started_at)}</td>
                    </tr>
                  ))}
                  {!monitor.recentLogs?.length && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No sync runs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
            {logsLoading ? (
              <div className="h-40 flex items-center justify-center text-neutral-400 text-sm">Loading logs...</div>
            ) : (
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Source</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Fetched</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">New</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Duration</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {logs.logs?.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{log.source_key}</td>
                      <td className="px-4 py-3 text-neutral-500">{log.run_type}</td>
                      <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                      <td className="px-4 py-3 text-neutral-600">{log.jobs_fetched}</td>
                      <td className="px-4 py-3 text-success-600 font-medium">+{log.jobs_new}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatDuration(log.duration_ms)}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatDateTime(log.started_at)}</td>
                    </tr>
                  ))}
                  {!logs.logs?.length && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No logs found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {logs.pagination && logs.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                Page {logs.pagination.page} of {logs.pagination.totalPages} — {logs.pagination.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={logsPage <= 1}
                  className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                >
                  <FiChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setLogsPage((p) => Math.min(logs.pagination.totalPages, p + 1))}
                  disabled={logsPage >= logs.pagination.totalPages}
                  className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
            {jobsLoading ? (
              <div className="h-40 flex items-center justify-center text-neutral-400 text-sm">Loading jobs...</div>
            ) : (
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Source</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Posted</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {jobs.jobs?.map((job) => (
                    <tr key={job.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800 max-w-xs truncate">{job.job_title}</td>
                      <td className="px-4 py-3 text-neutral-600">{job.company_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                          {sourceNameMap[job.source_key]?.name || job.source_key}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 max-w-xs truncate">{job.category}</td>
                      <td className="px-4 py-3"><StatusBadge status={job.is_verified ? 'verified' : 'pending'} /></td>
                      <td className="px-4 py-3 text-neutral-500">{formatDateTime(job.posted_at || job.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={job.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleToggleJob(job.id)}
                            className="text-xs text-error-600 hover:text-error-800 font-medium"
                          >
                            {job.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!jobs.jobs?.length && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No jobs found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {jobs.pagination && jobs.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                Page {jobs.pagination.page} of {jobs.pagination.totalPages} — {jobs.pagination.total} total jobs
              </p>
              <div className="flex gap-2">
                <button onClick={() => setJobsPage((p) => Math.max(1, p - 1))} disabled={jobsPage <= 1} className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">
                  <FiChevronLeft size={16} />
                </button>
                <button onClick={() => setJobsPage((p) => Math.min(jobs.pagination.totalPages, p + 1))} disabled={jobsPage >= jobs.pagination.totalPages} className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
