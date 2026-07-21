import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiClock, FiMessageCircle, FiShield } from 'react-icons/fi';
import StatusPill from '../../../shared/components/StatusPill';
import DashboardFocusNav from '../../../shared/components/dashboard/DashboardFocusNav';
import DashboardPageHeader from '../../../shared/components/dashboard/DashboardPageHeader';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import DashboardSummaryStrip from '../../../shared/components/dashboard/DashboardSummaryStrip';
import { dashboardSectionActionClassName } from '../../../shared/components/dashboard/dashboardActionStyles';
import useSupportStats from '../hooks/useSupportStats';
import useTickets from '../hooks/useTickets';
import { formatDateTime } from '../utils/formatDate';
import { getTicketDisplayId } from '../utils/ticketHelpers';
import useDashboardView from '../../../shared/hooks/useDashboardView';

const TICKET_QUEUE_ROUTE = '/portal/support/tickets';
const ticketStatusRoute = (status) => `${TICKET_QUEUE_ROUTE}?status=${status}`;
const SUPPORT_DASHBOARD_VIEWS = ['priorities', 'queue', 'recent'];

const SupportDashboard = () => {
  const [activeView, setActiveView] = useDashboardView(SUPPORT_DASHBOARD_VIEWS, 'priorities');
  const { stats, loading, error, isDemo } = useSupportStats();
  const { tickets, loading: ticketsLoading, error: ticketsError } = useTickets();

  const supportChecklist = useMemo(() => {
    const data = stats || {};
    return [
      {
        title: Number(data.escalatedTickets || 0) > 0 ? 'Review escalations first' : 'Escalation pressure is stable',
        description:
          Number(data.escalatedTickets || 0) > 0
            ? `${data.escalatedTickets} escalated tickets require fast triage and owner confirmation.`
            : 'No escalated queue pressure right now.',
        to: ticketStatusRoute('escalated')
      },
      {
        title: Number(data.pendingTickets || 0) > 0 ? 'Clear pending follow-ups' : 'Pending follow-ups are under control',
        description:
          Number(data.pendingTickets || 0) > 0
            ? `${data.pendingTickets} tickets are waiting on customer or internal response.`
            : 'Customer follow-up backlog is low.',
        to: ticketStatusRoute('pending')
      },
      {
        title: 'Keep knowledge links ready',
        description: 'Use FAQ and knowledge base responses to reduce repetitive handling time.',
        to: '/portal/support/knowledge-base'
      }
    ];
  }, [stats]);

  const queueMix = useMemo(() => {
    const bucket = { open: 0, pending: 0, escalated: 0, resolved: 0 };
    tickets.forEach((ticket) => {
      const status = String(ticket.status || '').toLowerCase();
      if (bucket[status] !== undefined) bucket[status] += 1;
    });
    return bucket;
  }, [tickets]);

  const focusItems = [
    { key: 'priorities', label: 'Priorities', description: 'Follow the recommended service sequence for the current shift.', count: Number(stats?.escalatedTickets || 0) + Number(stats?.pendingTickets || 0), icon: FiAlertCircle },
    { key: 'queue', label: 'Queue status', description: 'See active ticket distribution without opening every queue.', count: Number(stats?.totalTickets || tickets.length || 0), icon: FiShield },
    { key: 'recent', label: 'Recent tickets', description: 'Open the latest support records and continue handling.', count: tickets.length, icon: FiMessageCircle }
  ];

  return (
    <div className="space-y-3 pb-2">
      <DashboardPageHeader
        eyebrow="Service operations"
        title="Support workspace"
        description="Triage priorities, inspect queue balance, and continue recent tickets in separate views."
      />
      {isDemo ? <p className="module-note">Demo support data is shown because backend support endpoints are not connected.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {ticketsError ? <p className="form-error">{ticketsError}</p> : null}
      {loading ? <p className="module-note">Loading support dashboard...</p> : null}

      {!loading ? (
        <>
          <DashboardSummaryStrip
            items={[
              { label: 'Total tickets', value: Number(stats?.totalTickets || tickets.length || 0).toLocaleString('en-IN'), icon: FiMessageCircle, to: TICKET_QUEUE_ROUTE },
              { label: 'Open', value: Number(queueMix.open || 0).toLocaleString('en-IN'), icon: FiClock, to: ticketStatusRoute('open') },
              { label: 'Pending', value: Number(queueMix.pending || 0).toLocaleString('en-IN'), icon: FiClock, to: ticketStatusRoute('pending') },
              { label: 'Escalated', value: Number(queueMix.escalated || 0).toLocaleString('en-IN'), icon: FiAlertCircle, to: ticketStatusRoute('escalated') }
            ]}
          />
          <DashboardFocusNav items={focusItems} activeKey={activeView} onChange={setActiveView} label="Support dashboard workspaces" />

          {activeView === 'priorities' ? (
              <DashboardSectionCard
                eyebrow="Service Protocol"
                title="Immediate Desk Priorities"
                subtitle="Suggested sequence to protect response time and service quality."
                id="dashboard-view-priorities"
                role="tabpanel"
                aria-labelledby="dashboard-tab-priorities"
              >
              <ul className="space-y-3">
                {supportChecklist.map((item, index) => (
                  <li key={item.title}>
                    <Link
                      to={item.to}
                    className="flex gap-4 border-b border-slate-100 px-3 py-4 transition last:border-b-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </DashboardSectionCard>
          ) : null}

          {activeView === 'queue' ? (
              <DashboardSectionCard
                eyebrow="Queue Mix"
                title="Ticket Status Distribution"
                subtitle="Snapshot of how the support desk is balancing active and resolved workload."
                id="dashboard-view-queue"
                role="tabpanel"
                aria-labelledby="dashboard-tab-queue"
              >
              <div className="divide-y divide-slate-100">
                {[
                  ['Open', queueMix.open, ticketStatusRoute('open')],
                  ['Pending', queueMix.pending, ticketStatusRoute('pending')],
                  ['Escalated', queueMix.escalated, ticketStatusRoute('escalated')],
                  ['Resolved', queueMix.resolved, ticketStatusRoute('resolved')]
                ].map(([label, value, to]) => (
                  <Link
                    key={label}
                    to={to}
                    aria-label={`Open ${String(label).toLowerCase()} tickets`}
                    className="flex items-center justify-between px-3 py-4 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300"
                  >
                    <p className="text-sm font-semibold text-slate-500">{label}</p>
                    <p className="font-heading text-2xl font-bold text-navy">{value}</p>
                  </Link>
                ))}
              </div>
            </DashboardSectionCard>
          ) : null}

          {activeView === 'recent' ? (
            <DashboardSectionCard
              eyebrow="Priority Tickets"
              title="Latest Queue Items"
              subtitle="Recent support tickets that need queue visibility."
              id="dashboard-view-recent"
              role="tabpanel"
              aria-labelledby="dashboard-tab-recent"
              action={
              <Link to="/portal/support/tickets" className={dashboardSectionActionClassName}>
                Full Ticket Queue
              </Link>
            }
          >
            {ticketsLoading ? (
              <p className="text-sm text-slate-500">Loading ticket queue...</p>
            ) : (
              <ul className="space-y-3">
                {tickets.slice(0, 6).map((ticket) => (
                  <li key={ticket.id} className="flex items-start justify-between gap-4 border-b border-slate-100 px-3 py-4 last:border-b-0">
                    <div>
                      <p className="font-semibold text-slate-900">
                        <Link to={`/portal/support/ticket-details/${encodeURIComponent(ticket.id)}`} className="hover:text-brand-700">
                          {getTicketDisplayId(ticket)} • {ticket.title}
                        </Link>
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{ticket.customer} • {ticket.category}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Updated {formatDateTime(ticket.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusPill value={ticket.priority || 'low'} />
                      <StatusPill value={ticket.status || 'open'} />
                      <Link
                        to={`/portal/support/ticket-details/${encodeURIComponent(ticket.id)}`}
                        className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                      >
                        View details
                      </Link>
                    </div>
                  </li>
                ))}
                {tickets.length === 0 ? (
                  <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No tickets available right now.
                  </li>
                ) : null}
              </ul>
            )}
          </DashboardSectionCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default SupportDashboard;
