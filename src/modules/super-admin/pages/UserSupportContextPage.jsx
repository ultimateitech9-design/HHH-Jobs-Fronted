import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBriefcase, FiCreditCard, FiFileText, FiUser } from 'react-icons/fi';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../../../shared/components/DataTable';
import { getUserSupportContext } from '../services/usersApi';
import { formatDateTime } from '../utils/formatDate';

const safeValue = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const formatRole = (role = '') => String(role || 'user').replace(/_/g, ' ');

const UserSupportContextPage = () => {
  const { userId, view = 'dashboard' } = useParams();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadContext = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getUserSupportContext(userId);
        if (!cancelled) setContext(data);
      } catch (requestError) {
        if (!cancelled) {
          setContext(null);
          setError(requestError.message || 'Unable to load user context.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadContext();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const cards = useMemo(() => {
    const metrics = context?.metrics || {};
    return [
      { label: 'Jobs', value: String(metrics.jobs || 0), helper: 'Real jobs connected to this account', tone: 'info' },
      { label: 'Applications', value: String(metrics.applications || 0), helper: 'Applications owned or received', tone: 'success' },
      { label: 'Payments', value: String(metrics.payments || 0), helper: 'Billing and plan records', tone: 'default' },
      { label: 'Activity Events', value: String(metrics.activityEvents || 0), helper: 'Audit and system log entries', tone: 'danger' }
    ];
  }, [context]);

  const activityColumns = [
    { key: 'createdAt', label: 'Time', width: 170, render: (value) => formatDateTime(value) || '-' },
    { key: 'module', label: 'Module', width: 130 },
    { key: 'level', label: 'Level', width: 110, render: (value) => <StatusBadge value={value || 'info'} /> },
    { key: 'action', label: 'Action', width: 180 },
    { key: 'details', label: 'Details', width: 420 }
  ];

  const recentItems = context?.recent || {};
  const profileFields = context?.profile?.fields || [];
  const currentView = view === 'profile' ? 'profile' : 'dashboard';

  return (
    <div className="module-page module-page--admin">
      <div className="mb-4">
        <Link className="btn-secondary w-fit py-2 text-xs" to="/portal/super-admin/360-search">
          <FiArrowLeft size={14} /> Back to 360 Search
        </Link>
      </div>

      <AdminHeader
        title={currentView === 'profile' ? 'Support Profile Context' : 'Support Dashboard Context'}
        subtitle="Read-only real DB context for platform support. This does not switch your login session."
      />

      {loading ? <p className="module-note">Loading account context...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {context ? (
        <>
          <section className="panel-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <FiUser size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-black text-slate-950">{context.user?.name || '-'}</h2>
                  <p className="truncate text-sm font-semibold text-slate-500">{context.user?.email || '-'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge value={formatRole(context.user?.role)} />
                    <StatusBadge value={context.user?.status || 'active'} />
                    <StatusBadge value={context.profile?.verified ? 'verified' : 'unverified'} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="btn-secondary py-2 text-xs" to={`/portal/super-admin/users/${encodeURIComponent(userId)}/dashboard`}>
                  Dashboard
                </Link>
                <Link className="btn-secondary py-2 text-xs" to={`/portal/super-admin/users/${encodeURIComponent(userId)}/profile`}>
                  Profile
                </Link>
              </div>
            </div>
          </section>

          <DashboardStatsCards cards={cards} />

          {currentView === 'profile' ? (
            <section className="panel-card">
              <div className="mb-4 flex items-center gap-2">
                <FiFileText className="text-brand-600" />
                <h3 className="text-lg font-black text-slate-950">{context.profile?.title || 'Profile details'}</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {profileFields.map((field) => (
                  <div key={field.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{field.label}</p>
                    <p className="mt-2 break-words text-sm font-bold text-slate-800">{safeValue(field.value)}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              <section className="panel-card xl:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <FiBriefcase className="text-brand-600" />
                  <h3 className="text-lg font-black text-slate-950">Recent jobs and applications</h3>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {(recentItems.jobs || []).slice(0, 6).map((job) => (
                    <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <strong className="block truncate text-slate-900">{job.title || '-'}</strong>
                      <p className="mt-1 text-xs text-slate-500">{job.status || '-'} - {formatDateTime(job.createdAt) || '-'}</p>
                    </article>
                  ))}
                  {(recentItems.applications || []).slice(0, 6).map((application) => (
                    <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <strong className="block truncate text-slate-900">{application.title || application.jobTitle || 'Application'}</strong>
                      <p className="mt-1 text-xs text-slate-500">{application.status || '-'} - {formatDateTime(application.createdAt) || '-'}</p>
                    </article>
                  ))}
                  {!(recentItems.jobs || []).length && !(recentItems.applications || []).length ? (
                    <p className="module-note lg:col-span-2">No recent jobs or applications found for this account.</p>
                  ) : null}
                </div>
              </section>

              <section className="panel-card">
                <div className="mb-4 flex items-center gap-2">
                  <FiCreditCard className="text-brand-600" />
                  <h3 className="text-lg font-black text-slate-950">Recent payments</h3>
                </div>
                <div className="space-y-3">
                  {(recentItems.payments || []).slice(0, 8).map((payment) => (
                    <article key={`${payment.source}-${payment.id}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <strong className="block text-slate-900">{payment.label || payment.plan || payment.source || 'Payment'}</strong>
                      <p className="mt-1 text-xs text-slate-500">Rs {Number(payment.amount || 0).toLocaleString('en-IN')} - {payment.status || '-'}</p>
                    </article>
                  ))}
                  {!(recentItems.payments || []).length ? <p className="module-note">No payment records found.</p> : null}
                </div>
              </section>
            </div>
          )}

          <section className="panel-card">
            <h3 className="mb-4 text-lg font-black text-slate-950">Recent activity</h3>
            <DataTable columns={activityColumns} rows={recentItems.activity || []} compact fitOnDesktop />
          </section>
        </>
      ) : null}
    </div>
  );
};

export default UserSupportContextPage;
