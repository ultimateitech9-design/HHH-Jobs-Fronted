import { Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiActivity,
  FiArrowLeft,
  FiBriefcase,
  FiCreditCard,
  FiFileText,
  FiShield,
  FiUser
} from 'react-icons/fi';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../../../shared/components/DataTable';
import { setSupportSubjectUserId } from '../../../utils/api';
import { getUserSupportContext } from '../services/usersApi';
import { formatDateTime } from '../utils/formatDate';
import HrDashboardPage from '../../hr/pages/HrDashboardPage';
import StudentCompaniesPage from '../../student/pages/StudentCompaniesPage';
import CampusDashboardPage from '../../campus-connect/pages/CampusDashboardPage';

const safeValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  if (Array.isArray(value)) {
    const parts = value.map((item) => safeValue(item)).filter((item) => item && item !== '-');
    return parts.length ? parts.join(', ') : '-';
  }
  if (typeof value === 'object') {
    if (value.message) return safeValue(value.message);
    if (value.email) return safeValue(value.email);
    if (value.name) return safeValue(value.name);
    if (value.title) return safeValue(value.title);
    if (value.label) return safeValue(value.label);
    if (value.path || value.method || value.statusCode) {
      return [value.method, value.path, value.statusCode].filter(Boolean).join(' ') || '-';
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '-';
    }
  }
  return String(value);
};

const formatRole = (role = '') => String(role || 'user').replace(/_/g, ' ');

const safeDateTime = (value) => {
  const formatted = formatDateTime(value);
  return formatted && formatted !== 'Invalid Date' ? formatted : '-';
};

const safeKey = (prefix, row, index) => safeValue(row?.id) !== '-' ? `${prefix}-${safeValue(row.id)}` : `${prefix}-${index}`;

const normalizeRecentItems = (recent = {}) => ({
  jobs: Array.isArray(recent.jobs) ? recent.jobs.map((job, index) => ({
    id: safeKey('job', job, index),
    title: safeValue(job?.title),
    status: safeValue(job?.status),
    createdAt: job?.createdAt || job?.created_at || null
  })) : [],
  applications: Array.isArray(recent.applications) ? recent.applications.map((application, index) => ({
    id: safeKey('application', application, index),
    title: safeValue(application?.title || application?.jobTitle || application?.job_title || 'Application'),
    status: safeValue(application?.status),
    createdAt: application?.createdAt || application?.created_at || null
  })) : [],
  payments: Array.isArray(recent.payments) ? recent.payments.map((payment, index) => ({
    id: safeKey('payment', payment, index),
    source: safeValue(payment?.source),
    label: safeValue(payment?.label || payment?.plan || payment?.source || 'Payment'),
    amount: Number(payment?.amount || payment?.total_amount || payment?.paid_amount || payment?.price || 0),
    status: safeValue(payment?.status || payment?.payment_status),
    createdAt: payment?.createdAt || payment?.created_at || null
  })) : [],
  activity: Array.isArray(recent.activity) ? recent.activity.map((activity, index) => ({
    id: safeKey('activity', activity, index),
    createdAt: activity?.createdAt || activity?.created_at || null,
    module: safeValue(activity?.module),
    level: safeValue(activity?.level || 'info'),
    action: safeValue(activity?.action),
    details: safeValue(activity?.details)
  })) : []
});

const getWorkspaceCopy = (role = '') => {
  const normalizedRole = String(role || '').toLowerCase();
  if (normalizedRole === 'hr' || normalizedRole === 'company_admin') {
    return {
      title: 'HR live support workspace',
      summary: 'Use this to inspect recruiter-side jobs, applications, billing, quota, and company profile signals from real DB data.',
      focus: ['Job posting flow', 'Plan and payment status', 'Candidate/application pipeline', 'Company profile health']
    };
  }
  if (normalizedRole === 'student' || normalizedRole === 'professional' || normalizedRole === 'retired_employee') {
    return {
      title: 'Student / professional support workspace',
      summary: 'Use this to inspect candidate profile, applications, saved jobs, interviews, payments, and activity signals.',
      focus: ['Profile completion', 'Applications and saved jobs', 'Interview workflow', 'Resume/profile access']
    };
  }
  if (normalizedRole === 'campus_connect') {
    return {
      title: 'Campus connect support workspace',
      summary: 'Use this to inspect college profile, campus drives, students, company connections, billing, and activity signals.',
      focus: ['College profile setup', 'Student records', 'Campus drives', 'Company connection requests']
    };
  }
  return {
    title: 'Internal record workspace',
    summary: 'Use this to inspect employee/admin/support activity and account status. Internal staff do not have customer dashboards.',
    focus: ['Account status', 'Recent activity', 'Permission scope', 'Operational actions']
  };
};

const getSupportSubjectRole = (role = '') => {
  const normalizedRole = String(role || '').trim().toLowerCase();
  if (normalizedRole === 'company_admin') return 'hr';
  if (normalizedRole === 'professional') return 'student';
  return normalizedRole;
};

const CUSTOMER_DASHBOARD_ROLES = new Set(['hr', 'student', 'retired_employee', 'campus_connect']);

const SupportSubjectSession = ({ userId, enabled, children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (!enabled || !userId) {
      setSupportSubjectUserId('');
      return undefined;
    }
    setSupportSubjectUserId(userId);
    setReady(true);
    return () => {
      setSupportSubjectUserId('');
    };
  }, [enabled, userId]);

  if (!ready) return <p className="module-note">Preparing selected user dashboard context...</p>;
  return children;
};

const LiveRoleDashboard = ({ role }) => {
  const normalizedRole = getSupportSubjectRole(role);

  if (normalizedRole === 'hr') return <HrDashboardPage />;
  if (normalizedRole === 'student' || normalizedRole === 'retired_employee') return <StudentCompaniesPage />;
  if (normalizedRole === 'campus_connect') return <CampusDashboardPage />;

  return (
    <section className="panel-card">
      <h3 className="text-lg font-black text-slate-950">Internal employee record</h3>
      <p className="module-note mt-2">
        Internal staff accounts do not have a customer dashboard. Use profile and activity records for support review.
      </p>
    </section>
  );
};

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
    { key: 'createdAt', label: 'Time', width: 170, render: (value) => safeDateTime(value) },
    { key: 'module', label: 'Module', width: 130, render: (value) => safeValue(value) },
    { key: 'level', label: 'Level', width: 110, render: (value) => <StatusBadge value={value || 'info'} /> },
    { key: 'action', label: 'Action', width: 180, render: (value) => safeValue(value) },
    { key: 'details', label: 'Details', width: 420, render: (value) => safeValue(value) }
  ];

  const recentItems = useMemo(() => normalizeRecentItems(context?.recent || {}), [context]);
  const profileFields = context?.profile?.fields || [];
  const currentView = view === 'profile' ? 'profile' : 'dashboard';
  const workspace = useMemo(() => getWorkspaceCopy(context?.user?.role), [context?.user?.role]);
  const liveLinks = context?.links?.live || {};
  const supportRole = getSupportSubjectRole(context?.user?.role);
  const canOpenLiveDashboard = CUSTOMER_DASHBOARD_ROLES.has(supportRole);

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
                  <h2 className="truncate text-2xl font-black text-slate-950">{safeValue(context.user?.name)}</h2>
                  <p className="truncate text-sm font-semibold text-slate-500">{safeValue(context.user?.email)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge value={formatRole(context.user?.role)} />
                    <StatusBadge value={safeValue(context.user?.status || 'active')} />
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

          {currentView === 'profile' ? (
            <>
              <section className="panel-card">
                <div className="mb-4 flex items-center gap-2">
                  <FiFileText className="text-brand-600" />
                  <h3 className="text-lg font-black text-slate-950">{safeValue(context.profile?.title || 'Profile details')}</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">User ID</p>
                    <p className="mt-2 break-words font-mono text-sm font-bold text-slate-800">{safeValue(context.user?.id)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Phone</p>
                    <p className="mt-2 break-words text-sm font-bold text-slate-800">{safeValue(context.user?.phone)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Last active</p>
                    <p className="mt-2 break-words text-sm font-bold text-slate-800">{safeDateTime(context.user?.lastActiveAt)}</p>
                  </div>
                  {profileFields.map((field) => (
                    <div key={field.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{safeValue(field.label)}</p>
                      <p className="mt-2 break-words text-sm font-bold text-slate-800">{safeValue(field.value)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel-card">
                <h3 className="mb-4 text-lg font-black text-slate-950">Recent profile activity</h3>
                <DataTable columns={activityColumns} rows={recentItems.activity} compact fitOnDesktop />
              </section>
            </>
          ) : canOpenLiveDashboard ? (
            <SupportSubjectSession userId={context.user?.id} enabled={canOpenLiveDashboard}>
              <section className="panel-card border-brand-100 bg-brand-50/30">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <FiShield className="text-brand-600" />
                      <h3 className="text-lg font-black text-slate-950">Live {formatRole(supportRole)} dashboard context</h3>
                    </div>
                    <p className="max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                      This dashboard is loaded with the selected account's real DB context. Your super-admin session stays active and audit logs keep the support actor separate.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {workspace.focus.map((item) => (
                        <span key={item} className="rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-xs font-bold text-slate-500">
                    <p>Subject: {safeValue(context.user?.email)}</p>
                    <p className="mt-1">Role: {formatRole(supportRole)}</p>
                  </div>
                </div>
              </section>
              <Suspense fallback={<p className="module-note">Loading live dashboard...</p>}>
                <LiveRoleDashboard role={supportRole} />
              </Suspense>
            </SupportSubjectSession>
          ) : (
            <>
              <section className="panel-card">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <FiShield className="text-brand-600" />
                      <h3 className="text-lg font-black text-slate-950">{workspace.title}</h3>
                    </div>
                    <p className="max-w-3xl text-sm font-semibold leading-6 text-slate-600">{workspace.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {workspace.focus.map((item) => (
                        <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0 shrink-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs font-semibold text-slate-500 lg:max-w-sm">
                    <p className="font-black uppercase tracking-[0.16em] text-slate-400">Role routes</p>
                    {liveLinks.dashboard ? (
                      <p className="mt-2 break-all">Dashboard: {liveLinks.dashboard}</p>
                    ) : null}
                    {liveLinks.profile ? (
                      <p className="mt-1 break-all">Profile: {liveLinks.profile}</p>
                    ) : null}
                    <p className="mt-3 text-[11px] leading-5 text-slate-400">
                      These are target portals. Opening them as the selected user needs shadow-session permission wiring.
                    </p>
                  </div>
                </div>
              </section>

              <DashboardStatsCards cards={cards} />

              <div className="grid gap-4 xl:grid-cols-3">
                <section className="panel-card xl:col-span-2">
                  <div className="mb-4 flex items-center gap-2">
                    <FiBriefcase className="text-brand-600" />
                    <h3 className="text-lg font-black text-slate-950">Recent jobs and applications</h3>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {recentItems.jobs.slice(0, 6).map((job) => (
                      <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <strong className="block truncate text-slate-900">{job.title}</strong>
                        <p className="mt-1 text-xs text-slate-500">{job.status} - {safeDateTime(job.createdAt)}</p>
                      </article>
                    ))}
                    {recentItems.applications.slice(0, 6).map((application) => (
                      <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <strong className="block truncate text-slate-900">{application.title}</strong>
                        <p className="mt-1 text-xs text-slate-500">{application.status} - {safeDateTime(application.createdAt)}</p>
                      </article>
                    ))}
                    {!recentItems.jobs.length && !recentItems.applications.length ? (
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
                    {recentItems.payments.slice(0, 8).map((payment) => (
                      <article key={`${payment.source}-${payment.id}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <strong className="block text-slate-900">{payment.label}</strong>
                        <p className="mt-1 text-xs text-slate-500">Rs {payment.amount.toLocaleString('en-IN')} - {payment.status}</p>
                      </article>
                    ))}
                    {!recentItems.payments.length ? <p className="module-note">No payment records found.</p> : null}
                  </div>
                </section>
              </div>

              <section className="panel-card">
                <div className="mb-4 flex items-center gap-2">
                  <FiActivity className="text-brand-600" />
                  <h3 className="text-lg font-black text-slate-950">Recent dashboard activity</h3>
                </div>
                <DataTable columns={activityColumns} rows={recentItems.activity} compact fitOnDesktop />
              </section>
            </>
          )}
        </>
      ) : null}
    </div>
  );
};

export default UserSupportContextPage;
