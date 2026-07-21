import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiBarChart2, FiGrid, FiMessageCircle, FiShield } from 'react-icons/fi';
import ReportsChart from '../components/ReportsChart';
import StatusBadge from '../components/StatusBadge';
import DashboardFocusNav from '../../../shared/components/dashboard/DashboardFocusNav';
import DashboardLoadingSkeleton from '../../../shared/components/dashboard/DashboardLoadingSkeleton';
import DashboardPageHeader from '../../../shared/components/dashboard/DashboardPageHeader';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import DashboardSummaryStrip from '../../../shared/components/dashboard/DashboardSummaryStrip';
import Pagination from '../../../shared/components/Pagination';
import { getDashboardWorkspaceButtonClassName } from '../../../shared/components/dashboard/dashboardActionStyles';
import useDashboardView from '../../../shared/hooks/useDashboardView';
import useDashboardStats from '../hooks/useDashboardStats';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/formatDate';

const DASHBOARD_PAGE_SIZE = 10;
const SUPER_ADMIN_DASHBOARD_VIEWS = ['overview', 'workspaces', 'support', 'logs'];

const SuperAdminDashboard = () => {
  const [activeView, setActiveView] = useDashboardView(SUPER_ADMIN_DASHBOARD_VIEWS, 'overview');
  const { dashboard, loading, error } = useDashboardStats();
  const [selectedWorkspace, setSelectedWorkspace] = useState('super_admin');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [workspacePage, setWorkspacePage] = useState(1);
  const [supportPage, setSupportPage] = useState(1);

  const workspaceSnapshots = useMemo(() => {
    const source = dashboard || {};
    const users = Array.isArray(source.users) ? source.users : [];
    const supportTickets = Array.isArray(source.supportTickets) ? source.supportTickets : [];
    const payments = Array.isArray(source.payments) ? source.payments : [];
    const jobs = Array.isArray(source.jobs) ? source.jobs : [];
    const applications = Array.isArray(source.applications) ? source.applications : [];
    const logs = Array.isArray(source.systemLogs) ? source.systemLogs : [];
    const stats = source.stats || {};

    return [
      {
        key: 'super_admin',
        label: 'Super Admin Dashboard',
        title: 'Super Admin command data',
        subtitle: 'Platform-wide incidents, escalations, and governance signals.',
        metrics: [
          { label: 'Critical Logs', value: String(stats.criticalLogs || 0) },
          { label: 'Open Support Tickets', value: String(stats.openSupportTickets || 0) },
          { label: 'Duplicate Accounts', value: String(stats.duplicateAccounts || 0) }
        ],
        records: logs.map((log) => ({
          id: log.id,
          title: log.action,
          subtitle: `${log.module} · ${log.level}`,
          meta: formatDateTime(log.createdAt),
          profile: [
            ['Actor', log.actor],
            ['Actor Role', log.actorRole],
            ['Actor ID', log.actorId],
            ['Module', log.module],
            ['Level', log.level],
            ['Details', log.details]
          ]
        }))
      },
      {
        key: 'admin',
        label: 'Admin Dashboard',
        title: 'Admin operations monitoring',
        subtitle: 'Companies, jobs, and applications managed by admin teams.',
        metrics: [
          { label: 'Active Companies', value: String(stats.activeCompanies || 0) },
          { label: 'Live Jobs', value: String(stats.liveJobs || 0) },
          { label: 'Applications', value: String(stats.totalApplications || 0) }
        ],
        records: jobs.map((job) => ({
          id: job.id,
          title: job.title,
          subtitle: `${job.company} · ${job.status}`,
          meta: `${job.applications} applications`,
          profile: [
            ['Company', job.company],
            ['Location', job.location],
            ['Category', job.category],
            ['Status', job.status],
            ['Approval', job.approvalStatus],
            ['Applications', String(job.applications)],
            ['Created At', formatDateTime(job.createdAt)]
          ]
        }))
      },
      {
        key: 'hr',
        label: 'HR / Employer Dashboard',
        title: 'HR and employer profiles',
        subtitle: 'Recruiter-side accounts, approvals, and activity.',
        metrics: [
          { label: 'HR Accounts', value: String(users.filter((user) => user.role === 'hr').length) },
          { label: 'Pending Approvals', value: String(stats.pendingApprovals || 0) },
          { label: 'Blocked HR', value: String(users.filter((user) => user.role === 'hr' && user.status === 'blocked').length) }
        ],
        records: users.filter((user) => user.role === 'hr' || user.role === 'company_admin').map((user) => ({
          id: user.id,
          title: user.name,
          subtitle: `${user.company} · ${user.role}`,
          meta: user.email,
          profile: [
            ['User ID', user.displayId || user.id],
            ['Email', user.email],
            ['Company', user.company],
            ['Role', user.role],
            ['Status', user.status],
            ['Verified', user.verified ? 'Yes' : 'No'],
            ['Last Active', formatDateTime(user.lastActiveAt)],
            ['Created At', formatDateTime(user.createdAt)]
          ]
        }))
      },
      {
        key: 'dataentry',
        label: 'Data Entry Dashboard',
        title: 'Data entry team records',
        subtitle: 'Operational users handling entry queues and content updates.',
        metrics: [
          { label: 'Data Entry Users', value: String(users.filter((user) => ['data_entry', 'dataentry'].includes(user.role)).length) },
          { label: 'Draft Jobs', value: String(jobs.filter((job) => job.approvalStatus === 'pending').length) },
          { label: 'Rejected Jobs', value: String(jobs.filter((job) => job.approvalStatus === 'rejected').length) }
        ],
        records: users.filter((user) => ['data_entry', 'dataentry'].includes(user.role)).map((user) => ({
          id: user.id,
          title: user.name,
          subtitle: `${user.company} · Data Entry`,
          meta: user.email,
          profile: [
            ['User ID', user.displayId || user.id],
            ['Email', user.email],
            ['Status', user.status],
            ['Verified', user.verified ? 'Yes' : 'No'],
            ['Last Active', formatDateTime(user.lastActiveAt)],
            ['Created At', formatDateTime(user.createdAt)]
          ]
        }))
      },
      {
        key: 'support',
        label: 'Support Dashboard',
        title: 'Support desk queue',
        subtitle: 'Escalations and customer-facing support issues.',
        metrics: [
          { label: 'Open Tickets', value: String(supportTickets.length) },
          { label: 'Critical Tickets', value: String(supportTickets.filter((ticket) => ticket.priority === 'critical').length) },
          { label: 'Support Users', value: String(users.filter((user) => user.role === 'support').length) }
        ],
        records: supportTickets.map((ticket) => ({
          id: ticket.id,
          title: ticket.title,
          subtitle: `${ticket.company} · ${ticket.priority}`,
          meta: ticket.assignedTo,
          profile: [
            ['Ticket ID', ticket.id],
            ['Company', ticket.company],
            ['Priority', ticket.priority],
            ['Status', ticket.status],
            ['Assigned To', ticket.assignedTo],
            ['Updated At', formatDateTime(ticket.updatedAt)]
          ]
        }))
      },
      {
        key: 'accounts',
        label: 'Accounts Dashboard',
        title: 'Accounts and billing ledger',
        subtitle: 'Revenue, invoices, and payment recovery monitoring.',
        metrics: [
          { label: 'Monthly Revenue', value: formatCurrency(stats.monthlyRevenue || 0) },
          { label: 'Paid Payments', value: String(payments.filter((payment) => payment.status === 'paid').length) },
          { label: 'Refunded', value: String(payments.filter((payment) => payment.status === 'refunded').length) }
        ],
        records: payments.map((payment) => ({
          id: payment.id,
          title: payment.company,
          subtitle: `${payment.item} · ${payment.status}`,
          meta: formatCurrency(payment.amount),
          profile: [
            ['Payment ID', payment.id],
            ['Invoice ID', payment.invoiceId],
            ['Company', payment.company],
            ['Item', payment.item],
            ['Amount', formatCurrency(payment.amount)],
            ['Method', payment.method],
            ['Status', payment.status],
            ['Created At', formatDateTime(payment.createdAt)]
          ]
        }))
      },
      {
        key: 'sales',
        label: 'Sales Dashboard',
        title: 'Sales pipeline monitoring',
        subtitle: 'Closures, subscriptions, and revenue-linked customer movement.',
        metrics: [
          { label: 'Applications in Pipeline', value: String(applications.length) },
          { label: 'Selected', value: String(applications.filter((item) => item.stage === 'selected').length) },
          { label: 'Shortlisted', value: String(applications.filter((item) => item.stage === 'shortlisted').length) }
        ],
        records: applications.map((application) => ({
          id: application.id,
          title: application.candidate,
          subtitle: `${application.jobTitle} · ${application.stage}`,
          meta: `${application.company} · Score ${application.score}`,
          profile: [
            ['Application ID', application.id],
            ['Candidate', application.candidate],
            ['Job Title', application.jobTitle],
            ['Company', application.company],
            ['Stage', application.stage],
            ['Score', String(application.score)],
            ['Status', application.status],
            ['Created At', formatDateTime(application.createdAt)]
          ]
        }))
      },
      {
        key: 'student',
        label: 'User / Student Monitoring',
        title: 'Student-side monitoring panel',
        subtitle: 'Candidate profiles, activity, and portal usage signals.',
        metrics: [
          { label: 'Student Accounts', value: String(users.filter((user) => user.role === 'student').length) },
          { label: 'Verified Students', value: String(users.filter((user) => user.role === 'student' && user.verified).length) },
          { label: 'Duplicate Signals', value: String(stats.duplicateAccounts || 0) }
        ],
        records: users.filter((user) => user.role === 'student').map((user) => ({
          id: user.id,
          title: user.name,
          subtitle: `${user.company} · Student`,
          meta: user.email,
          profile: [
            ['User ID', user.displayId || user.id],
            ['Email', user.email],
            ['Status', user.status],
            ['Verified', user.verified ? 'Yes' : 'No'],
            ['Last Active', formatDateTime(user.lastActiveAt)],
            ['Created At', formatDateTime(user.createdAt)]
          ]
        }))
      }
    ];
  }, [dashboard]);

  const activeWorkspace = workspaceSnapshots.find((item) => item.key === selectedWorkspace) || workspaceSnapshots[0];
  const activeRecord = activeWorkspace?.records.find((record) => record.id === selectedRecordId) || activeWorkspace?.records[0] || null;
  const workspaceTotalPages = Math.max(1, Math.ceil((activeWorkspace?.records.length || 0) / DASHBOARD_PAGE_SIZE));
  const paginatedWorkspaceRecords = useMemo(() => {
    const records = activeWorkspace?.records || [];
    return records.slice((workspacePage - 1) * DASHBOARD_PAGE_SIZE, workspacePage * DASHBOARD_PAGE_SIZE);
  }, [activeWorkspace, workspacePage]);
  const supportTickets = useMemo(() => dashboard?.supportTickets || [], [dashboard?.supportTickets]);
  const supportTotalPages = Math.max(1, Math.ceil(supportTickets.length / DASHBOARD_PAGE_SIZE));
  const paginatedSupportTickets = useMemo(
    () => supportTickets.slice((supportPage - 1) * DASHBOARD_PAGE_SIZE, supportPage * DASHBOARD_PAGE_SIZE),
    [supportTickets, supportPage]
  );

  useEffect(() => {
    if (!activeWorkspace) return;
    setSelectedRecordId(activeWorkspace.records[0]?.id || '');
    setWorkspacePage(1);
  }, [activeWorkspace, selectedWorkspace]);

  useEffect(() => {
    if (workspacePage > workspaceTotalPages) setWorkspacePage(workspaceTotalPages);
  }, [workspacePage, workspaceTotalPages]);

  useEffect(() => {
    if (supportPage > supportTotalPages) setSupportPage(supportTotalPages);
  }, [supportPage, supportTotalPages]);

  const stats = dashboard?.stats || {};
  const focusItems = [
    { key: 'overview', label: 'Platform overview', description: 'Review top-line revenue movement and platform health.', icon: FiBarChart2 },
    { key: 'workspaces', label: 'Role workspaces', description: 'Inspect one operational role and one record at a time.', count: workspaceSnapshots.length, icon: FiGrid },
    { key: 'support', label: 'Escalations', description: 'Review open support escalations that need governance attention.', count: supportTickets.length, icon: FiMessageCircle },
    { key: 'logs', label: 'Critical logs', description: 'Inspect recent incidents and unusual platform behavior.', count: dashboard?.systemLogs?.length || 0, icon: FiActivity }
  ];

  return (
    <div className="super-admin-dashboard space-y-3 pb-2">
      <DashboardPageHeader
        eyebrow="Platform governance"
        title="Super admin control center"
        description="Monitor platform health, cross-role operations, escalations, and system incidents in separate workspaces."
      />
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <DashboardLoadingSkeleton panels={4} /> : null}

      {!loading && dashboard ? (
        <>
          <DashboardSummaryStrip
            items={[
              { label: 'Total users', value: Number(stats.totalUsers || 0).toLocaleString('en-IN'), helper: `${stats.pendingApprovals || 0} pending approvals`, icon: FiShield, to: '/portal/super-admin/users' },
              { label: 'Active companies', value: Number(stats.activeCompanies || 0).toLocaleString('en-IN'), helper: `${stats.activeSubscriptions || 0} active subscriptions`, icon: FiGrid, to: '/portal/super-admin/companies' },
              { label: 'Live jobs', value: Number(stats.liveJobs || 0).toLocaleString('en-IN'), helper: `${stats.totalApplications || 0} applications`, icon: FiActivity, to: '/portal/super-admin/jobs' },
              { label: 'Monthly revenue', value: formatCurrency(stats.monthlyRevenue || 0), helper: `${stats.openSupportTickets || 0} tickets open`, icon: FiBarChart2, to: '/portal/super-admin/payments' }
            ]}
          />

          <DashboardFocusNav items={focusItems} activeKey={activeView} onChange={setActiveView} label="Super admin dashboard workspaces" title="Control view" />

          {activeView === 'overview' ? (
            <DashboardSectionCard eyebrow="Revenue trend" title="Platform revenue movement" subtitle="Monthly top-line collections and refund pressure.">
              <ReportsChart rows={dashboard.reports?.revenueTrend || []} />
            </DashboardSectionCard>
          ) : null}

          {activeView === 'workspaces' ? (
          <DashboardSectionCard
            eyebrow="Cross-role access"
            title={activeWorkspace?.title || 'Operational workspace'}
            subtitle={activeWorkspace?.subtitle || 'Choose a role workspace to inspect its records.'}
          >
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {workspaceSnapshots.map((workspace) => (
                <button
                  key={workspace.key}
                  type="button"
                  className={getDashboardWorkspaceButtonClassName(selectedWorkspace === workspace.key)}
                  onClick={() => setSelectedWorkspace(workspace.key)}
                >
                  {workspace.label}
                </button>
              ))}
            </div>
            {activeWorkspace ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,1.05fr)]">
                <div className="min-w-0 border-b border-slate-200 lg:border-b-0 lg:border-r">
                  <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/80">
                    {activeWorkspace.metrics.map((metric) => (
                      <div key={metric.label} className="min-w-0 border-r border-slate-200 px-3 py-3 last:border-r-0">
                        <strong className="block text-lg font-black text-navy">{metric.value}</strong>
                        <span className="block truncate text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{metric.label}</span>
                      </div>
                    ))}
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {activeWorkspace.records.length === 0 ? (
                      <li className="p-5 text-sm text-slate-500">No records available for this workspace yet.</li>
                    ) : paginatedWorkspaceRecords.map((record) => (
                      <li
                        key={record.id}
                        className={`flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition hover:bg-slate-50 ${activeRecord?.id === record.id ? 'bg-brand-50/70' : ''}`}
                        onClick={() => setSelectedRecordId(record.id)}
                      >
                        <div className="min-w-0">
                          <strong className="block truncate text-sm text-slate-900">{record.title}</strong>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{record.subtitle}</p>
                          <span className="mt-1 block text-[11px] font-semibold text-slate-400">{record.meta}</span>
                        </div>
                        <StatusBadge value={activeRecord?.id === record.id ? 'selected' : 'active'} />
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-200 px-3 py-2">
                    <Pagination page={workspacePage} totalPages={workspaceTotalPages} onChange={setWorkspacePage} />
                  </div>
                </div>
                <section className="min-w-0 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-700">Selected record</p>
                  <h3 className="mt-1 text-lg font-bold text-navy">{activeRecord?.title || 'No record selected'}</h3>
                  <p className="mt-1 text-xs text-slate-500">{activeRecord?.subtitle || 'Select a row to inspect full details.'}</p>
                  {activeRecord ? (
                    <dl className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
                      {activeRecord.profile.map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-2.5 text-sm">
                          <dt className="font-semibold text-slate-500">{label}</dt>
                          <dd className="min-w-0 break-words font-medium text-slate-800">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="module-note">No data available for this workspace right now.</p>
                  )}
                </section>
              </div>
            ) : null}
          </DashboardSectionCard>
          ) : null}

          {activeView === 'support' ? (
            <DashboardSectionCard eyebrow="Escalations" title="Open support escalations" subtitle="Critical or high-priority issues that need immediate attention.">
              <ul className="divide-y divide-slate-100">
                {paginatedSupportTickets.map((ticket) => (
                  <li key={ticket.id} className="flex items-start justify-between gap-4 px-2 py-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-slate-900">{ticket.title}</strong>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{ticket.company} · Assigned to {ticket.assignedTo}</p>
                      <span className="mt-1 block text-[11px] font-semibold text-slate-400">{formatDateTime(ticket.updatedAt)}</span>
                    </div>
                    <StatusBadge value={ticket.status} />
                  </li>
                ))}
              </ul>
              <Pagination page={supportPage} totalPages={supportTotalPages} onChange={setSupportPage} />
            </DashboardSectionCard>
          ) : null}

          {activeView === 'logs' ? (
            <DashboardSectionCard eyebrow="System watch" title="Critical logs" subtitle="Recent incidents and unusual platform behavior.">
              <ul className="divide-y divide-slate-100">
                {(dashboard.systemLogs || []).slice(0, 4).map((log) => (
                  <li key={log.id} className="flex items-start justify-between gap-4 px-2 py-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-slate-900">{log.action}</strong>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{log.details}</p>
                      <span className="mt-1 block text-[11px] font-semibold text-slate-400">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <StatusBadge value={log.level} />
                  </li>
                ))}
              </ul>
            </DashboardSectionCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default SuperAdminDashboard;
