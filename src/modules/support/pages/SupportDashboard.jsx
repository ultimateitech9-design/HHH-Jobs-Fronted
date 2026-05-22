import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiClock, FiMessageCircle, FiShield } from 'react-icons/fi';
import StatusPill from '../../../shared/components/StatusPill';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import { dashboardSectionActionClassName } from '../../../shared/components/dashboard/dashboardActionStyles';
import useSupportStats from '../hooks/useSupportStats';
import useTickets from '../hooks/useTickets';
import { formatDateTime } from '../utils/formatDate';
import { getTicketDisplayId } from '../utils/ticketHelpers';

const TICKET_QUEUE_ROUTE = '/portal/support/tickets';
const ticketStatusRoute = (status) => `${TICKET_QUEUE_ROUTE}?status=${status}`;

const SupportDashboard = () => {
  const { stats, loading, error, isDemo } = useSupportStats();
  const { tickets, loading: ticketsLoading, error: ticketsError } = useTickets();

  const cards = useMemo(() => {
    const data = stats || {};
    return [
      { label: 'Total Tickets', value: String(data.totalTickets || 0), helper: `${data.openTickets || 0} open`, tone: 'info', icon: FiShield, to: TICKET_QUEUE_ROUTE, ctaLabel: 'Open tickets' },
      { label: 'Resolved', value: String(data.resolvedTickets || 0), helper: `${data.avgResolutionHours || 0} hrs avg resolution`, tone: 'success', icon: FiClock, to: ticketStatusRoute('resolved'), ctaLabel: 'Open resolved tickets' },
      { label: 'Escalations', value: String(data.escalatedTickets || 0), helper: `${data.pendingTickets || 0} pending`, tone: 'warning', icon: FiAlertCircle, to: ticketStatusRoute('escalated'), ctaLabel: 'Open escalations' },
      { label: 'Live Chat', value: String(data.liveChats || 0), helper: `${data.feedbackItems || 0} feedback items`, tone: 'default', icon: FiMessageCircle, to: '/portal/support/live-chat', ctaLabel: 'Open live chat' }
    ];
  }, [stats]);

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

  return (
    <div className="space-y-3 pb-2">
      {isDemo ? <p className="module-note">Demo support data is shown because backend support endpoints are not connected.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {ticketsError ? <p className="form-error">{ticketsError}</p> : null}
      {loading ? <p className="module-note">Loading support dashboard...</p> : null}

      {!loading ? (
        <>
          <DashboardMetricCards cards={cards} />

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <DashboardSectionCard
              eyebrow="Service Protocol"
              title="Immediate Desk Priorities"
              subtitle="Suggested sequence to protect response time and service quality."
            >
              <ul className="space-y-3">
                {supportChecklist.map((item, index) => (
                  <li key={item.title}>
                    <Link
                      to={item.to}
                      className="flex gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
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

            <DashboardSectionCard
              eyebrow="Queue Mix"
              title="Ticket Status Distribution"
              subtitle="Snapshot of how the support desk is balancing active and resolved workload."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-200 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  >
                    <p className="text-sm font-semibold text-slate-500">{label}</p>
                    <p className="mt-3 font-heading text-3xl font-bold text-navy">{value}</p>
                  </Link>
                ))}
              </div>
            </DashboardSectionCard>
          </div>

          <DashboardSectionCard
            eyebrow="Priority Tickets"
            title="Latest Queue Items"
            subtitle="Recent support tickets that need queue visibility."
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
                  <li key={ticket.id} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        <Link to={`/portal/support/ticket-details/${encodeURIComponent(ticket.id)}`} className="hover:text-brand-700">
                          {getTicketDisplayId(ticket)} • {ticket.title}
                        </Link>
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{ticket.customer} • {ticket.category}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
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
        </>
      ) : null}
    </div>
  );
};

export default SupportDashboard;
