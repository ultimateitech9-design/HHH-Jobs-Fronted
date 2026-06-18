import { Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
import { getCachedSupportContextSeed, getUserSupportContext } from '../services/usersApi';
import { formatDateTime } from '../utils/formatDate';
import HrDashboardPage from '../../hr/pages/HrDashboardPage';
import HrApplicationsPage from '../../hr/pages/HrApplicationsPage';
import HrCandidatesPage from '../../hr/pages/HrCandidatesPage';
import HrCampusConnectionsPage from '../../hr/pages/HrCampusConnectionsPage';
import HrCampusDrivesPage from '../../hr/pages/HrCampusDrivesPage';
import HrInterestsPage from '../../hr/pages/HrInterestsPage';
import HrInterviewsPage from '../../hr/pages/HrInterviewsPage';
import HrJobsPage from '../../hr/pages/HrJobsPage';
import HrNotificationsPage from '../../hr/pages/HrNotificationsPage';
import HrProfilePage from '../../hr/pages/HrProfilePage';
import HrShortlistedPage from '../../hr/pages/HrShortlistedPage';
import StudentCompaniesPage from '../../student/pages/StudentCompaniesPage';
import StudentApplicationsPage from '../../student/pages/StudentApplicationsPage';
import StudentAtsPage from '../../student/pages/StudentAtsPage';
import StudentCampusConnectPage from '../../student/pages/StudentCampusConnectPage';
import StudentInterviewsPage from '../../student/pages/StudentInterviewsPage';
import StudentJobsPage from '../../student/pages/StudentJobsPage';
import StudentProfilePage from '../../student/pages/StudentProfilePage';
import StudentSavedJobsPage from '../../student/pages/StudentSavedJobsPage';
import CampusDashboardPage from '../../campus-connect/pages/CampusDashboardPage';
import CampusBillingPage from '../../campus-connect/pages/CampusBillingPage';
import CampusConnectionsPage from '../../campus-connect/pages/CampusConnectionsPage';
import CampusDrivesPage from '../../campus-connect/pages/CampusDrivesPage';
import CampusNotificationsPage from '../../campus-connect/pages/CampusNotificationsPage';
import CampusProfilePage from '../../campus-connect/pages/CampusProfilePage';
import CampusReportsPage from '../../campus-connect/pages/CampusReportsPage';
import CampusStudentsPage from '../../campus-connect/pages/CampusStudentsPage';

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

const HR_SUPPORT_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', path: '/portal/hr/dashboard', Component: HrDashboardPage },
  { key: 'profile', label: 'Company Profile', path: '/portal/hr/profile', Component: HrProfilePage },
  { key: 'jobs', label: 'Job Postings', path: '/portal/hr/jobs', Component: HrJobsPage },
  { key: 'applications', label: 'Applications', path: '/portal/hr/applications', Component: HrApplicationsPage },
  { key: 'candidates', label: 'Candidate DB', path: '/portal/hr/candidates', Component: HrCandidatesPage },
  { key: 'shortlisted', label: 'Shortlisted', path: '/portal/hr/shortlisted', Component: HrShortlistedPage },
  { key: 'interests', label: 'Sent Interests', path: '/portal/hr/interests', Component: HrInterestsPage },
  { key: 'interviews', label: 'Interviews', path: '/portal/hr/interviews', Component: HrInterviewsPage },
  { key: 'campus-connections', label: 'Campus Connections', path: '/portal/hr/campus-connections', Component: HrCampusConnectionsPage },
  { key: 'campus-drives', label: 'Campus Drives', path: '/portal/hr/campus-drives', Component: HrCampusDrivesPage },
  { key: 'notifications', label: 'Notifications', path: '/portal/hr/notifications', Component: HrNotificationsPage }
];

const STUDENT_SUPPORT_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', path: '/portal/student/companies', Component: StudentCompaniesPage },
  { key: 'profile', label: 'Profile', path: '/portal/student/profile', Component: StudentProfilePage },
  { key: 'jobs', label: 'Jobs', path: '/portal/student/jobs', Component: StudentJobsPage },
  { key: 'applications', label: 'Applications', path: '/portal/student/applications', Component: StudentApplicationsPage },
  { key: 'saved-jobs', label: 'Saved Jobs', path: '/portal/student/saved-jobs', Component: StudentSavedJobsPage },
  { key: 'interviews', label: 'Interviews', path: '/portal/student/interviews', Component: StudentInterviewsPage },
  { key: 'campus-connect', label: 'Campus Connect', path: '/portal/student/campus-connect', Component: StudentCampusConnectPage },
  { key: 'ats', label: 'ATS', path: '/portal/student/ats', Component: StudentAtsPage }
];

const CAMPUS_SUPPORT_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', path: '/portal/campus-connect/dashboard', Component: CampusDashboardPage },
  { key: 'profile', label: 'Profile', path: '/portal/campus-connect/profile', Component: CampusProfilePage },
  { key: 'students', label: 'Students', path: '/portal/campus-connect/students', Component: CampusStudentsPage },
  { key: 'drives', label: 'Drives', path: '/portal/campus-connect/drives', Component: CampusDrivesPage },
  { key: 'connections', label: 'Connections', path: '/portal/campus-connect/connections', Component: CampusConnectionsPage },
  { key: 'reports', label: 'Reports', path: '/portal/campus-connect/reports', Component: CampusReportsPage },
  { key: 'billing', label: 'Billing', path: '/portal/campus-connect/billing', Component: CampusBillingPage },
  { key: 'notifications', label: 'Notifications', path: '/portal/campus-connect/notifications', Component: CampusNotificationsPage }
];

const getRoleSupportSections = (role = '') => {
  const normalizedRole = getSupportSubjectRole(role);
  if (normalizedRole === 'hr') return HR_SUPPORT_SECTIONS;
  if (normalizedRole === 'student' || normalizedRole === 'retired_employee') return STUDENT_SUPPORT_SECTIONS;
  if (normalizedRole === 'campus_connect') return CAMPUS_SUPPORT_SECTIONS;
  return [];
};

const resolveSupportSection = (pathname = '', sections = []) => {
  const normalizedPath = String(pathname || '').toLowerCase().replace(/\/+$/, '');
  if (['/portal/hr', '/portal/hr/dashboard'].includes(normalizedPath)) return 'dashboard';
  if (['/portal/student', '/portal/student/home', '/portal/student/dashboard', '/portal/student/companies'].includes(normalizedPath)) return 'dashboard';
  if (['/portal/campus-connect', '/portal/campus-connect/dashboard'].includes(normalizedPath)) return 'dashboard';
  if (normalizedPath.includes('/portal/hr/jobs/')) return 'jobs';
  if (normalizedPath.includes('/portal/hr/candidates/interests')) return 'interests';
  if (normalizedPath.includes('/portal/student/jobs/')) return 'jobs';
  if (normalizedPath.includes('/portal/student/ats/result')) return 'ats';
  if (normalizedPath.includes('/portal/campus-connect/drives/')) return 'drives';

  const match = sections
    .filter((section) => section.key !== 'dashboard')
    .find((section) => normalizedPath === section.path || normalizedPath.startsWith(`${section.path}/`));

  return match?.key || (sections.some((section) => normalizedPath === section.path) ? 'dashboard' : '');
};

const getValidSupportSection = (sections = [], section = '') =>
  sections.some((item) => item.key === section) ? section : 'dashboard';

const buildContextFromSeed = (seed = {}) => {
  if (!seed?.id) return null;
  const metrics = seed.metrics || {};
  const profile = seed.profile || {};
  const role = getSupportSubjectRole(seed.role);

  return {
    user: {
      id: seed.id,
      name: seed.name || '-',
      email: seed.email || '-',
      phone: seed.phone || seed.mobile || '-',
      role: seed.role || role || 'user',
      status: seed.status || 'active',
      createdAt: seed.createdAt || seed.created_at || null,
      updatedAt: null,
      lastActiveAt: seed.lastActiveAt || seed.last_login_at || null
    },
    profile: {
      title: seed.company || profile.headline || 'Profile details',
      verified: Boolean(profile.verified),
      fields: [
        { label: 'Profile context', value: profile.headline || seed.company || '-' },
        { label: 'Location', value: profile.location || '-' },
        { label: 'Record type', value: seed.recordType || '-' }
      ]
    },
    metrics: {
      jobs: Number(metrics.jobs || 0),
      applications: Number(metrics.applications || 0),
      payments: Number(metrics.payments || 0),
      activityEvents: Number(metrics.activityEvents || 0)
    },
    recent: {
      jobs: [],
      applications: [],
      payments: [],
      activity: []
    },
    links: seed.links || {}
  };
};

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

const RoleSupportWorkspace = ({ role, section, onSectionChange }) => {
  const sections = getRoleSupportSections(role);
  const activeSection = getValidSupportSection(sections, section);
  const selectedSection = sections.find((item) => item.key === activeSection) || sections[0];
  const SelectedComponent = selectedSection.Component;

  const handleSupportLinkClick = (event) => {
    const link = event.target?.closest?.('a[href]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    let url;
    try {
      url = new URL(href, window.location.origin);
    } catch (error) {
      return;
    }

    if (url.origin !== window.location.origin) return;

    const nextSection = resolveSupportSection(url.pathname, sections);
    if (!nextSection) return;

    event.preventDefault();
    onSectionChange(nextSection, url.searchParams);
  };

  return (
    <div className="space-y-4">
      <section className="panel-card">
        <div className="flex flex-wrap gap-2">
          {sections.map((item) => {
            const active = item.key === activeSection;
            return (
              <button
                key={item.key}
                type="button"
                className={active ? 'btn-primary py-2 text-xs' : 'btn-secondary py-2 text-xs'}
                onClick={() => onSectionChange(item.key)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <div onClickCapture={handleSupportLinkClick}>
        <SelectedComponent />
      </div>
    </div>
  );
};

const LiveRoleDashboard = ({ role, section, onSectionChange }) => {
  const normalizedRole = getSupportSubjectRole(role);

  if (CUSTOMER_DASHBOARD_ROLES.has(normalizedRole)) {
    return <RoleSupportWorkspace role={normalizedRole} section={section} onSectionChange={onSectionChange} />;
  }

  return (
    <section className="panel-card">
      <h3 className="text-lg font-black text-slate-950">Internal employee record</h3>
      <p className="module-note mt-2">
        Internal staff accounts do not have a customer dashboard. Use profile and activity records for support review.
      </p>
    </section>
  );
};

const UserSupportContextPage = ({ portalBasePath = '/portal/super-admin', actorLabel = 'super-admin' }) => {
  const { userId, view = 'dashboard' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadContext = async () => {
      setLoading(true);
      setError('');
      setWarning('');
      try {
        const data = await getUserSupportContext(userId);
        if (!cancelled) {
          setContext(data);
          setWarning('');
        }
      } catch (requestError) {
        if (!cancelled) {
          const cachedContext = buildContextFromSeed(getCachedSupportContextSeed(userId));
          setContext(cachedContext);
          setWarning(cachedContext
            ? 'Detailed support context API is not available yet. Showing the selected account dashboard with cached search context.'
            : '');
          setError(cachedContext ? '' : (requestError.message || 'Unable to load user context.'));
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
  const roleSections = getRoleSupportSections(supportRole);
  const supportSection = getValidSupportSection(
    roleSections,
    searchParams.get('supportSection') || (currentView === 'profile' ? 'profile' : 'dashboard')
  );

  const handleSupportSectionChange = (section, nextSectionParams = null) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('supportSection', getValidSupportSection(roleSections, section));

    ['tab', 'billingTab', 'view', 'status', 'jobId'].forEach((key) => {
      if (!nextSectionParams?.has?.(key)) nextParams.delete(key);
    });

    if (nextSectionParams) {
      nextSectionParams.forEach((value, key) => {
        nextParams.set(key, value);
      });
    }

    setSearchParams(nextParams);
  };

  return (
    <div className="module-page module-page--admin">
      <div className="mb-4">
        <Link className="btn-secondary w-fit py-2 text-xs" to={`${portalBasePath}/360-search`}>
          <FiArrowLeft size={14} /> Back to 360 Search
        </Link>
      </div>

      <AdminHeader
        title={currentView === 'profile' ? 'Account Profile Access' : 'Account Dashboard Access'}
        subtitle="Open the selected account with real DB context while keeping the support actor session active."
      />

      {loading ? <p className="module-note">Loading account context...</p> : null}
      {warning ? <p className="module-note">{warning}</p> : null}
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
                <Link className="btn-secondary py-2 text-xs" to={`${portalBasePath}/users/${encodeURIComponent(userId)}/dashboard`}>
                  Dashboard
                </Link>
                <Link className="btn-secondary py-2 text-xs" to={`${portalBasePath}/users/${encodeURIComponent(userId)}/profile?supportSection=profile`}>
                  Profile
                </Link>
              </div>
            </div>
          </section>

          {currentView === 'profile' && !canOpenLiveDashboard ? (
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
                      This workspace is loaded with real DB context for the selected account. Your {actorLabel} session stays active and support requests target this account.
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
                <LiveRoleDashboard
                  role={supportRole}
                  section={supportSection}
                  onSectionChange={handleSupportSectionChange}
                />
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
