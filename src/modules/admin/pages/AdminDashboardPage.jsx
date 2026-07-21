import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiBriefcase,
  FiFlag,
  FiShield,
  FiUsers
} from 'react-icons/fi';
import DashboardFocusNav from '../../../shared/components/dashboard/DashboardFocusNav';
import DashboardLoadingSkeleton from '../../../shared/components/dashboard/DashboardLoadingSkeleton';
import DashboardPageHeader from '../../../shared/components/dashboard/DashboardPageHeader';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import DashboardSummaryStrip from '../../../shared/components/dashboard/DashboardSummaryStrip';
import { dashboardSectionActionClassName } from '../../../shared/components/dashboard/dashboardActionStyles';
import StatusPill from '../../../shared/components/StatusPill';
import useDashboardView from '../../../shared/hooks/useDashboardView';
import {
  formatDateTime,
  getAdminDashboard
} from '../services/adminApi';

const ADMIN_DASHBOARD_VIEWS = ['priorities', 'recruiters', 'jobs', 'reports'];

const AdminDashboardPage = () => {
  const [activeView, setActiveView] = useDashboardView(ADMIN_DASHBOARD_VIEWS, 'priorities');
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
        const dashboardRes = await getAdminDashboard();

        if (!mounted) return;

        const dashboard = dashboardRes.data || {};

        setState({
          loading: false,
          error: '',
          isDemo: Boolean(dashboardRes.isDemo),
          analytics: dashboard.analytics || null,
          pendingHr: dashboard.pendingHr || [],
          pendingJobs: dashboard.pendingJobs || [],
          openReports: dashboard.openReports || []
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

  const focusItems = [
    { key: 'priorities', label: 'Priorities', description: 'Start with the queues that need an admin decision today.', count: priorityItems.reduce((sum, item) => sum + item.value, 0), icon: FiShield },
    { key: 'recruiters', label: 'Recruiter approvals', description: 'Review recent employer accounts waiting for verification.', count: state.pendingHr.length, icon: FiUsers },
    { key: 'jobs', label: 'Job review', description: 'Review listings waiting for a publishing decision.', count: state.pendingJobs.length, icon: FiBriefcase },
    { key: 'reports', label: 'Reports', description: 'Resolve reported content and account issues.', count: state.openReports.length, icon: FiFlag }
  ];

  return (
    <div className="admin-dashboard-page pb-3">
      <DashboardPageHeader
        eyebrow="Admin console"
        title="Operations overview"
        description="Work through approvals, listing reviews, and reports one queue at a time."
      />

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

      {state.loading ? <DashboardLoadingSkeleton panels={2} /> : null}

      {!state.loading ? (
        <>
          <DashboardSummaryStrip
            className="mt-3"
            items={[
              { label: 'Recruiter approvals', value: state.pendingHr.length, icon: FiUsers, to: '/portal/admin/users' },
              { label: 'Listings in review', value: state.pendingJobs.length, icon: FiBriefcase, to: '/portal/admin/jobs' },
              { label: 'Open reports', value: state.openReports.length, icon: FiFlag, to: '/portal/admin/reports' }
            ]}
          />
          <div className="mt-3">
            <DashboardFocusNav items={focusItems} activeKey={activeView} onChange={setActiveView} label="Admin dashboard workspaces" title="Review queue" />
          </div>

          <div className="mt-3">
            {activeView === 'recruiters' ? (
              <DashboardSectionCard
                eyebrow="Recruiter Queue"
                title="Pending recruiter approvals"
                subtitle="Recent HR accounts waiting for verification."
                action={
                  <Link to="/portal/admin/users" className={dashboardSectionActionClassName}>
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
            ) : null}

            {activeView === 'jobs' ? (
              <DashboardSectionCard
                eyebrow="Listing Review"
                title="Jobs awaiting decision"
                subtitle="Pending listings ready for admin review."
                action={
                  <Link to="/portal/admin/jobs" className={dashboardSectionActionClassName}>
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
            ) : null}

            {activeView === 'reports' ? (
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
            ) : null}

            {activeView === 'priorities' ? (
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
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
