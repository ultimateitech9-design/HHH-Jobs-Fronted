import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiBriefcase,
  FiFlag,
  FiShield,
  FiUsers
} from 'react-icons/fi';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import StatusPill from '../../../shared/components/StatusPill';
import {
  formatDateTime,
  getAdminAnalytics,
  getAdminJobs,
  getAdminReports,
  getAdminUsers
} from '../services/adminApi';

const AdminDashboardPage = () => {
  const [state, setState] = useState({
    loading: true,
    error: '',
    isDemo: false,
    analytics: null,
    pendingHr: [],
    pendingJobs: [],
    openReports: []
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const [analyticsRes, hrRes, jobsRes, reportsRes] = await Promise.all([
          getAdminAnalytics(),
          getAdminUsers({ role: 'hr' }),
          getAdminJobs(),
          getAdminReports({ status: 'open' })
        ]);

        if (!mounted) return;

        const pendingHr = (hrRes.data || []).filter((user) => !user.is_hr_approved);
        const pendingJobs = (jobsRes.data || []).filter((job) => String(job.approvalStatus || '').toLowerCase() === 'pending');

        setState({
          loading: false,
          error: '',
          isDemo: [analyticsRes, hrRes, jobsRes, reportsRes].some((item) => item.isDemo),
          analytics: analyticsRes.data || null,
          pendingHr,
          pendingJobs,
          openReports: reportsRes.data || []
        });
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || 'Unable to load admin dashboard.'
        }));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    const analytics = state.analytics || {
      totalUsers: 0,
      totalHr: 0,
      approvedHr: 0,
      activeUsers: 0,
      blockedUsers: 0,
      totalJobs: 0,
      openJobs: 0,
      pendingJobs: 0,
      reportsOpen: 0,
      reportsTotal: 0
    };

    return [
      {
        label: 'Total Users',
        value: String(analytics.totalUsers || 0),
        helper: `Active: ${analytics.activeUsers || 0} | Blocked: ${analytics.blockedUsers || 0}`,
        icon: <FiUsers className="text-sky-700" />,
        tone: 'info',
        to: '/portal/admin/users',
        ctaLabel: 'Open users'
      },
      {
        label: 'HR Accounts',
        value: String(analytics.totalHr || 0),
        helper: `Approved: ${analytics.approvedHr || 0} | Pending: ${(analytics.totalHr || 0) - (analytics.approvedHr || 0)}`,
        icon: <FiShield className="text-brand-700" />,
        tone: 'accent',
        to: '/portal/admin/users',
        ctaLabel: 'Review accounts'
      },
      {
        label: 'Job Listings',
        value: String(analytics.totalJobs || 0),
        helper: `Open: ${analytics.openJobs || 0} | Pending: ${analytics.pendingJobs || 0}`,
        icon: <FiBriefcase className="text-emerald-700" />,
        tone: 'success',
        to: '/portal/admin/jobs',
        ctaLabel: 'Open jobs'
      },
      {
        label: 'Open Reports',
        value: String(analytics.reportsTotal || 0),
        helper: `Needs attention: ${analytics.reportsOpen || 0}`,
        icon: <FiFlag className="text-amber-700" />,
        tone: 'warning',
        to: '/portal/admin/reports',
        ctaLabel: 'Open reports'
      }
    ];
  }, [state.analytics]);

  const commandSignals = useMemo(() => {
    const analytics = state.analytics || {};
    return [
      { label: 'HR pending', value: state.pendingHr.length, helper: 'Recruiter approvals waiting' },
      { label: 'Jobs pending', value: state.pendingJobs.length, helper: 'Listings waiting for review' },
      { label: 'Open reports', value: state.openReports.length, helper: 'Reports requiring action' },
      { label: 'Blocked auth', value: analytics.blockedUsers || 0, helper: 'Accounts with access restrictions' }
    ];
  }, [state.analytics, state.pendingHr, state.pendingJobs, state.openReports]);

  const priorityItems = useMemo(() => (
    [
      {
        label: 'Recruiter approvals',
        value: state.pendingHr.length,
        note: state.pendingHr.length > 0 ? 'Waiting for admin action' : 'All caught up',
        tone: state.pendingHr.length > 0 ? 'pending' : 'approved'
      },
      {
        label: 'Listing review',
        value: state.pendingJobs.length,
        note: state.pendingJobs.length > 0 ? 'Pending publishing decisions' : 'No items in review',
        tone: state.pendingJobs.length > 0 ? 'pending' : 'approved'
      },
      {
        label: 'Reports',
        value: state.openReports.length,
        note: state.openReports.length > 0 ? 'Needs timely resolution' : 'No active report queue',
        tone: state.openReports.length > 0 ? 'warning' : 'approved'
      }
    ]
  ), [state.pendingHr, state.pendingJobs, state.openReports]);

  return (
    <div className="relative overflow-hidden pb-3">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[410px] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_40%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.88))]" />
      <div className="pointer-events-none absolute right-0 top-24 -z-10 h-40 w-40 rounded-full bg-amber-100/55 blur-3xl" />
      <div className="pointer-events-none absolute left-10 top-64 -z-10 h-36 w-36 rounded-full bg-sky-100/45 blur-3xl" />

      {state.isDemo ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-700">
          Demo Mode: Showing placeholder admin data.
        </div>
      ) : null}
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-600">
          {state.error}
        </div>
      ) : null}

      <div className="relative z-10">
        <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_34%,transparent_66%,rgba(255,255,255,0.06))]" />
        <PortalDashboardHero
          tone="admin"
          eyebrow="Admin Dashboard"
          badge="Admin workspace"
          title="Admin approvals and review summary"
          description="Review recruiters, pending listings, and reports from one clean dashboard."
          chips={['Approvals', 'Listings', 'Reports']}
          primaryAction={{ to: '/portal/admin/users', label: 'Review HR Queue' }}
          secondaryAction={{ to: '/portal/admin/reports', label: 'Open Reports' }}
          metrics={commandSignals}
        />
      </div>

      {state.loading ? <p className="module-note">Loading admin dashboard...</p> : null}

      {!state.loading ? (
        <>
          <div className="relative z-20 mt-4 rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Quick Access</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Open the main admin areas directly from here.</p>
              </div>
            </div>
            <DashboardMetricCards cards={cards} className="gap-3" />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-3">
              <DashboardSectionCard
                eyebrow="Recruiter Queue"
                title="Pending recruiter approvals"
                subtitle="Recent HR accounts waiting for verification."
                action={
                  <Link to="/portal/admin/users" className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                    Open Users <FiArrowRight />
                  </Link>
                }
              >
                <div className="grid gap-2">
                  {state.pendingHr.length === 0 ? (
                    <div className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-500">
                      No recruiter approvals are pending right now.
                    </div>
                  ) : (
                    state.pendingHr.slice(0, 4).map((user) => (
                      <div key={user.id} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{user.name || 'HR Recruiter'}</p>
                          <p className="truncate text-sm text-slate-500">{user.email || 'No email available'}</p>
                        </div>
                        <StatusPill value="pending" />
                      </div>
                    ))
                  )}
                </div>
              </DashboardSectionCard>

              <DashboardSectionCard
                eyebrow="Listing Review"
                title="Jobs awaiting decision"
                subtitle="Pending listings ready for admin review."
                action={
                  <Link to="/portal/admin/jobs" className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                    Open Jobs <FiArrowRight />
                  </Link>
                }
              >
                <div className="grid gap-2">
                  {state.pendingJobs.length === 0 ? (
                    <div className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-500">
                      No job listings are awaiting review.
                    </div>
                  ) : (
                    state.pendingJobs.slice(0, 4).map((job) => (
                      <div key={job.id || job._id} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{job.jobTitle || 'Job listing'}</p>
                          <p className="truncate text-sm text-slate-500">{job.companyName || 'Company'} {job.jobLocation ? `• ${job.jobLocation}` : ''}</p>
                        </div>
                        <StatusPill value={job.approvalStatus || 'pending'} />
                      </div>
                    ))
                  )}
                </div>
              </DashboardSectionCard>
            </div>

            <div className="grid gap-3">
              <DashboardSectionCard
                eyebrow="Report Center"
                title="Open reports"
                subtitle="Recent reports that may need immediate attention."
                action={
                  <Link to="/portal/admin/reports" className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                    Open Reports <FiArrowRight />
                  </Link>
                }
              >
                <div className="grid gap-2">
                  {state.openReports.length === 0 ? (
                    <div className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-500">
                      No open reports at the moment.
                    </div>
                  ) : (
                    state.openReports.slice(0, 4).map((report) => (
                      <div key={report.id} className="rounded-[1rem] border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold capitalize text-slate-900">
                              {report.reason || 'Reported issue'}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {report.details || 'No additional details provided.'}
                            </p>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              {formatDateTime(report.updated_at || report.created_at)}
                            </p>
                          </div>
                          <StatusPill value={report.status || 'open'} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DashboardSectionCard>

              <DashboardSectionCard
                eyebrow="Daily Priorities"
                title="Admin focus for today"
                subtitle="A quick view of what deserves attention first."
              >
                <div className="grid gap-2">
                  {priorityItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <p className="text-sm text-slate-500">{item.note}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-black leading-none text-navy">{item.value}</p>
                        <StatusPill value={item.tone} />
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardSectionCard>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
