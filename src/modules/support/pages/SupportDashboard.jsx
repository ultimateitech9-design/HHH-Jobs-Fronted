import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiClock, FiMessageCircle, FiShield } from 'react-icons/fi';
import StatusPill from '../../../shared/components/StatusPill';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import useSupportStats from '../hooks/useSupportStats';
import useTickets from '../hooks/useTickets';
import { formatDateTime } from '../utils/formatDate';

const SupportDashboard = () => {
  const { stats, loading, error, isDemo } = useSupportStats();
  const { tickets, loading: ticketsLoading, error: ticketsError } = useTickets();

  const cards = useMemo(() => {
    const data = stats || {};
    return [
      { label: 'Total Tickets', value: String(data.totalTickets || 0), helper: `${data.openTickets || 0} open`, tone: 'info', icon: FiShield },
      { label: 'Resolved', value: String(data.resolvedTickets || 0), helper: `${data.avgResolutionHours || 0} hrs avg resolution`, tone: 'success', icon: FiClock },
      { label: 'Escalations', value: String(data.escalatedTickets || 0), helper: `${data.pendingTickets || 0} pending`, tone: 'warning', icon: FiAlertCircle },
      { label: 'Live Chat', value: String(data.liveChats || 0), helper: `${data.feedbackItems || 0} feedback items`, tone: 'default', icon: FiMessageCircle }
    ];
  }, [stats]);

  const queueSignals = useMemo(() => {
    const data = stats || {};
    return [
      { label: 'Open queue', value: String(data.openTickets || 0), helper: 'Active unresolved tickets' },
      { label: 'Escalations', value: String(data.escalatedTickets || 0), helper: 'Priority desk workload' },
      { label: 'Pending tickets', value: String(data.pendingTickets || 0), helper: 'Waiting on customer or team' },
      { label: 'Avg resolution', value: `${data.avgResolutionHours || 0}h`, helper: 'Current service speed' }
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
            : 'No escalated queue pressure right now.'
      },
      {
        title: Number(data.pendingTickets || 0) > 0 ? 'Clear pending follow-ups' : 'Pending follow-ups are under control',
        description:
          Number(data.pendingTickets || 0) > 0
            ? `${data.pendingTickets} tickets are waiting on customer or internal response.`
            : 'Customer follow-up backlog is low.'
      },
      {
        title: 'Keep knowledge links ready',
        description: 'Use FAQ and knowledge base responses to reduce repetitive handling time.'
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
      <PortalDashboardHero
        tone="support"
        eyebrow="Support Dashboard"
        badge={isDemo ? 'Demo desk' : 'Queue live'}
        title="Support queue pressure, escalations, and response flow in one service desk view"
        description="Track customer tickets, chat volume, escalation load, and response discipline so issues get triaged before they impact trust."
        chips={['Ticket queue', 'Live support', 'Knowledge routing']}
        primaryAction={{ to: '/portal/support/tickets', label: 'Open Ticket Queue' }}
        secondaryAction={{ to: '/portal/support/live-chat', label: 'Open Live Chat' }}
        metrics={queueSignals}
      />

      {isDemo ? <p className="module-note">Demo support data is shown because backend support endpoints are not connected.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {ticketsError ? <p className="form-error">{ticketsError}</p> : null}
      {loading ? <p className="module-note">Loading support dashboard...</p> : null}

      {!loading ? (
        <>
          <DashboardMetricCards cards={cards} />

          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to="/portal/support/tickets"
              className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <p className="font-heading text-lg font-bold text-navy">Tickets</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Open, assign, and resolve customer issues from the central queue.</p>
            </Link>
            <Link
              to="/portal/support/live-chat"
              className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <p className="font-heading text-lg font-bold text-navy">Live Chat</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Handle real-time conversations before they become escalations.</p>
            </Link>
            <Link
              to="/portal/support/knowledge-base"
              className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <p className="font-heading text-lg font-bold text-navy">Knowledge Base</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Route common issues toward reusable answers and guides.</p>
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <DashboardSectionCard
              eyebrow="Service Protocol"
              title="Immediate Desk Priorities"
              subtitle="Suggested sequence to protect response time and service quality."
            >
              <ul className="space-y-3">
                {supportChecklist.map((item, index) => (
                  <li key={item.title} className="flex gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                    </div>
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
                  ['Open', queueMix.open],
                  ['Pending', queueMix.pending],
                  ['Escalated', queueMix.escalated],
                  ['Resolved', queueMix.resolved]
                ].map(([label, value]) => (
                  <article key={label} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-500">{label}</p>
                    <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{value}</p>
                  </article>
                ))}
              </div>
            </DashboardSectionCard>
          </div>

          <DashboardSectionCard
            eyebrow="Priority Tickets"
            title="Latest Queue Items"
            subtitle="Recent support tickets that need queue visibility."
            action={
              <Link to="/portal/support/tickets" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
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
                          {ticket.title}
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
