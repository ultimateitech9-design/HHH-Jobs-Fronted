import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import ReportsChart from '../components/ReportsChart';
import StatusBadge from '../components/StatusBadge';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import { getDashboardWorkspaceButtonClassName } from '../../../shared/components/dashboard/dashboardActionStyles';
import useDashboardStats from '../hooks/useDashboardStats';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/formatDate';

const SuperAdminDashboard = () => {
  const { dashboard, loading, error } = useDashboardStats();
  const [selectedWorkspace, setSelectedWorkspace] = useState('super_admin');
  const [selectedRecordId, setSelectedRecordId] = useState('');

  const cards = useMemo(() => {
    const stats = dashboard?.stats || {};
    return [
      { label: 'Total Users', value: String(stats.totalUsers || 0), helper: `${stats.pendingApprovals || 0} pending approvals`, tone: 'info' },
      { label: 'Active Companies', value: String(stats.activeCompanies || 0), helper: `${stats.activeSubscriptions || 0} active subscriptions`, tone: 'success' },
      { label: 'Live Jobs', value: String(stats.liveJobs || 0), helper: `${stats.totalApplications || 0} applications received`, tone: 'default' },
      { label: 'Monthly Revenue', value: formatCurrency(stats.monthlyRevenue || 0), helper: `${stats.openSupportTickets || 0} support tickets open`, tone: 'warning' }
    ];
  }, [dashboard]);

  const commandSignals = useMemo(() => {
    const stats = dashboard?.stats || {};
    return [
      { label: 'Critical logs', value: stats.criticalLogs || 0 },
      { label: 'Duplicate accounts', value: stats.duplicateAccounts || 0 },
      { label: 'Support queue', value: stats.openSupportTickets || 0 },
      { label: 'Revenue this month', value: formatCurrency(stats.monthlyRevenue || 0) }
    ];
  }, [dashboard]);

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

  useEffect(() => {
    if (!activeWorkspace) return;
    setSelectedRecordId(activeWorkspace.records[0]?.id || '');
  }, [activeWorkspace, selectedWorkspace]);

  return (
    <div className="space-y-3 pb-2">
      {error ? <p className="form-error">{error}</p> : null}
      <PortalDashboardHero
        tone="superAdmin"
        eyebrow="Super Admin Dashboard"
        badge="Global control"
        title="One workspace to monitor growth, risk, revenue, trust, and operations"
        description="Super admin can control users, employers, jobs, applications, payments, subscriptions, support load, permissions, and system configuration from this module."
        chips={['Platform health', 'Governance', 'Revenue risk']}
        primaryAction={{ to: '/portal/super-admin/users', label: 'Open Users Control' }}
        secondaryAction={{ to: '/portal/super-admin/system-settings', label: 'Review System Settings' }}
        metrics={commandSignals.map((signal) => ({
          label: signal.label,
          value: signal.value,
          helper: 'Cross-role command signal'
        }))}
      />

      {loading ? <p className="module-note">Loading super admin dashboard...</p> : null}

      {!loading && dashboard ? (
        <>
          <DashboardMetricCards cards={cards} />
          <div className="split-grid">
            <section className="panel-card">
              <AdminHeader eyebrow="Revenue Trend" title="Platform Revenue Movement" subtitle="Monthly top-line collections and refund pressure." />
              <ReportsChart rows={dashboard.reports?.revenueTrend || []} />
            </section>
            <AdminSidebar />
          </div>
          <section className="panel-card">
            <AdminHeader
              eyebrow="Cross-Role Access"
              title="Monitor any operational dashboard"
              subtitle="Dashboard button sirf data view kholega. Kisi record par click karne se uska full detail aur profile yahin show hoga."
            />
            <div className="student-job-actions">
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
              <div className="split-grid" style={{ marginTop: '1rem', alignItems: 'start' }}>
                <section className="panel-card">
                  <AdminHeader
                    eyebrow="Workspace Snapshot"
                    title={activeWorkspace.title}
                    subtitle={activeWorkspace.subtitle}
                  />
                  <div className="dash-stat-grid" style={{ marginBottom: '1rem' }}>
                    {activeWorkspace.metrics.map((metric) => (
                      <article key={metric.label} className="dash-card">
                        <strong>{metric.value}</strong>
                        <span>{metric.label}</span>
                      </article>
                    ))}
                  </div>
                  <ul className="dash-feed">
                    {activeWorkspace.records.length === 0 ? (
                      <li><p className="module-note">No records available for this workspace yet.</p></li>
                    ) : activeWorkspace.records.map((record) => (
                      <li
                        key={record.id}
                        style={{
                          cursor: 'pointer',
                          border: activeRecord?.id === record.id ? '1px solid rgba(31, 122, 97, 0.28)' : undefined,
                          borderRadius: '14px',
                          padding: '0.85rem'
                        }}
                        onClick={() => setSelectedRecordId(record.id)}
                      >
                        <div>
                          <strong>{record.title}</strong>
                          <p>{record.subtitle}</p>
                          <span>{record.meta}</span>
                        </div>
                        <StatusBadge value={activeRecord?.id === record.id ? 'selected' : 'active'} />
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="panel-card">
                  <AdminHeader
                    eyebrow="Full Record"
                    title={activeRecord?.title || 'No record selected'}
                    subtitle={activeRecord?.subtitle || 'Select any row from the workspace list to inspect full details.'}
                  />
                  {activeRecord ? (
                    <div className="profile-overview-meta-grid">
                      {activeRecord.profile.map(([label, value]) => (
                        <p key={label}>
                          <strong>{label}:</strong> {value}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="module-note">No data available for this workspace right now.</p>
                  )}
                </section>
              </div>
            ) : null}
          </section>
          <div className="split-grid">
            <section className="panel-card">
              <AdminHeader eyebrow="Escalations" title="Open Support Escalations" subtitle="Critical or high-priority issues that need immediate attention." />
              <ul className="dash-feed">
                {(dashboard.supportTickets || []).map((ticket) => (
                  <li key={ticket.id}>
                    <div>
                      <strong>{ticket.title}</strong>
                      <p>{ticket.company} · Assigned to {ticket.assignedTo}</p>
                      <span>{formatDateTime(ticket.updatedAt)}</span>
                    </div>
                    <StatusBadge value={ticket.status} />
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel-card">
              <AdminHeader eyebrow="System Watch" title="Critical Logs" subtitle="Recent incidents and unusual platform behavior." />
              <ul className="dash-feed">
                {(dashboard.systemLogs || []).slice(0, 4).map((log) => (
                  <li key={log.id}>
                    <div>
                      <strong>{log.action}</strong>
                      <p>{log.details}</p>
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                    <StatusBadge value={log.level} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default SuperAdminDashboard;
