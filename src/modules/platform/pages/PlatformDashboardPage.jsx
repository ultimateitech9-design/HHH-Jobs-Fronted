import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import StatusPill from '../../../shared/components/StatusPill';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import {
  formatDateTime,
  getPlatformIntegrations,
  getPlatformOverview,
  getPlatformSecurityChecks,
  getPlatformSupportTickets,
  getPlatformTenants
} from '../services/platformApi';

const PlatformDashboardPage = () => {
  const [state, setState] = useState({
    loading: true,
    isDemo: false,
    error: '',
    overview: null,
    tenants: [],
    tickets: [],
    integrations: [],
    checks: []
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const [overviewRes, tenantsRes, ticketsRes, integrationsRes, checksRes] = await Promise.all([
          getPlatformOverview(),
          getPlatformTenants(),
          getPlatformSupportTickets(),
          getPlatformIntegrations(),
          getPlatformSecurityChecks()
        ]);

        if (!mounted) return;

        setState({
          loading: false,
          isDemo: [overviewRes, tenantsRes, ticketsRes, integrationsRes, checksRes].some((item) => item.isDemo),
          error: '',
          overview: overviewRes.data,
          tenants: tenantsRes.data || [],
          tickets: ticketsRes.data || [],
          integrations: integrationsRes.data || [],
          checks: checksRes.data || []
        });
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || 'Unable to load platform dashboard.'
        }));
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    const overview = state.overview || {
      totalTenants: 0,
      activeTenants: 0,
      suspendedTenants: 0,
      pendingTenants: 0,
      openTickets: 0,
      healthyIntegrations: 0,
      degradedIntegrations: 0,
      monthlyRevenue: 0,
      complianceHealthy: 0,
      complianceTotal: 0
    };

    return [
      {
        label: 'Tenants',
        value: String(overview.totalTenants || 0),
        helper: `${overview.activeTenants || 0} active • ${overview.suspendedTenants || 0} suspended`,
        tone: 'info'
      },
      {
        label: 'Revenue (Monthly)',
        value: String(overview.monthlyRevenue || 0),
        helper: 'Paid invoices aggregate',
        tone: 'success'
      },
      {
        label: 'Open Tickets',
        value: String(overview.openTickets || 0),
        helper: 'Priority support queue',
        tone: overview.openTickets > 0 ? 'warning' : 'default'
      },
      {
        label: 'Compliance Health',
        value: `${overview.complianceHealthy || 0}/${overview.complianceTotal || 0}`,
        helper: `${overview.healthyIntegrations || 0} healthy integrations`,
        tone: overview.degradedIntegrations > 0 ? 'warning' : 'success'
      }
    ];
  }, [state.overview]);

  const platformSignals = useMemo(() => {
    const highPriorityTickets = state.tickets.filter((ticket) => String(ticket.priority || '').toLowerCase() === 'high').length;
    const degradedIntegrations = state.integrations.filter(
      (integration) => String(integration.status || '').toLowerCase() !== 'active'
    ).length;
    const unhealthyChecks = state.checks.filter((check) => String(check.status || '').toLowerCase() !== 'healthy').length;
    const nonActiveTenants = state.tenants.filter((tenant) => String(tenant.status || '').toLowerCase() !== 'active').length;

    return [
      { label: 'Non-active tenants', value: nonActiveTenants },
      { label: 'High priority tickets', value: highPriorityTickets },
      { label: 'Degraded integrations', value: degradedIntegrations },
      { label: 'Compliance warnings', value: unhealthyChecks }
    ];
  }, [state.tenants, state.tickets, state.integrations, state.checks]);

  const operationsChecklist = useMemo(() => {
    const openTickets = state.tickets.filter((ticket) => String(ticket.status || '').toLowerCase() === 'open').length;
    const degradedIntegrations = state.integrations.filter(
      (integration) => String(integration.status || '').toLowerCase() !== 'active'
    ).length;
    const unhealthyChecks = state.checks.filter((check) => String(check.status || '').toLowerCase() !== 'healthy').length;

    return [
      {
        title: openTickets > 0 ? 'Support queue requires action' : 'Support queue is under control',
        description:
          openTickets > 0
            ? `${openTickets} support tickets remain open across tenant environments.`
            : 'No pending open tickets right now.'
      },
      {
        title: degradedIntegrations > 0 ? 'Connectors need recovery' : 'All integrations are healthy',
        description:
          degradedIntegrations > 0
            ? `${degradedIntegrations} integrations show degraded/offline status.`
            : 'Sync health is stable across integration catalog.'
      },
      {
        title: unhealthyChecks > 0 ? 'Compliance controls need review' : 'Compliance checks are healthy',
        description:
          unhealthyChecks > 0
            ? `${unhealthyChecks} controls are flagged for follow-up.`
            : 'No compliance risk signals detected.'
      }
    ];
  }, [state.tickets, state.integrations, state.checks]);

  const quickActions = [
    {
      title: 'Tenant Lifecycle',
      description: 'Oversee tenant status, plan allocations, and renewal posture.',
      to: '/portal/platform/tenants'
    },
    {
      title: 'Billing Control',
      description: 'Track invoice health, payment states, and revenue consistency.',
      to: '/portal/platform/billing'
    },
    {
      title: 'Integration Health',
      description: 'Detect degraded connectors and trigger sync recovery quickly.',
      to: '/portal/platform/integrations'
    },
    {
      title: 'Security Controls',
      description: 'Review compliance checks and close risk observations proactively.',
      to: '/portal/platform/security'
    }
  ];

  return (
    <div className="space-y-3 pb-2">
      {state.isDemo ? <p className="module-note">Showing fallback platform telemetry because the live backend is unavailable right now.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <PortalDashboardHero
        tone="platform"
        eyebrow="Platform Dashboard"
        badge={state.isDemo ? 'Demo telemetry' : 'Operations live'}
        title="Operations command center for tenants, billing, integrations, and risk"
        description="Monitor multi-tenant reliability, billing posture, connector state, and support pressure from one executive platform screen."
        chips={['Tenant health', 'Billing posture', 'Compliance watch']}
        primaryAction={{ to: '/portal/platform/tenants', label: 'Manage Tenants' }}
        secondaryAction={{ to: '/portal/platform/support', label: 'Open Support Ops' }}
        metrics={platformSignals.map((signal) => ({ ...signal, helper: 'Current live count' }))}
      />

      {state.loading ? <p className="module-note">Loading platform dashboard...</p> : null}

      {!state.loading ? (
        <>
          <DashboardMetricCards cards={cards} />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <p className="font-heading text-lg font-bold text-navy">{action.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{action.description}</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <DashboardSectionCard
              eyebrow="Shift Brief"
              title="Immediate Platform Priorities"
              subtitle="Suggested order to stabilize reliability and tenant service quality."
            >
              <ul className="space-y-3">
                {operationsChecklist.map((item, index) => (
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
              eyebrow="Health Snapshot"
              title="Tenant and Reliability Mix"
              subtitle="Cross-check tenant state with integration and control outcomes."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Active tenants</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview?.activeTenants || 0}</p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Pending tenants</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview?.pendingTenants || 0}</p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Suspended tenants</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview?.suspendedTenants || 0}</p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Healthy integrations</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview?.healthyIntegrations || 0}</p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Degraded integrations</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview?.degradedIntegrations || 0}</p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Healthy controls</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview?.complianceHealthy || 0}</p>
                </article>
              </div>
            </DashboardSectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardSectionCard
              eyebrow="Top Tenants"
              title="Active Tenant Footprint"
              action={
                <Link to="/portal/platform/tenants" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                  Open Tenant Manager
                </Link>
              }
            >
              <ul className="space-y-3">
                {state.tenants.slice(0, 6).map((tenant) => (
                  <li key={tenant.id} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{tenant.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{tenant.domain || '-'} • Plan: {tenant.plan}</p>
                      <p className="mt-1 text-sm text-slate-500">Users: {tenant.activeUsers || 0} • Renewal: {tenant.renewalDate || '-'}</p>
                    </div>
                    <StatusPill value={tenant.status || 'active'} />
                  </li>
                ))}
                {state.tenants.length === 0 ? (
                  <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No tenant records available.
                  </li>
                ) : null}
              </ul>
            </DashboardSectionCard>

            <DashboardSectionCard
              eyebrow="Support Queue"
              title="Recent Priority Tickets"
              action={
                <Link to="/portal/platform/support" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                  Open Support Ops
                </Link>
              }
            >
              <ul className="space-y-3">
                {state.tickets.slice(0, 6).map((ticket) => (
                  <li key={ticket.id} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{ticket.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{ticket.tenantName || ticket.tenantId} • Owner: {ticket.owner || '-'}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Updated {formatDateTime(ticket.updatedAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusPill value={ticket.priority || 'low'} />
                      <StatusPill value={ticket.status || 'open'} />
                    </div>
                  </li>
                ))}
                {state.tickets.length === 0 ? (
                  <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No support tickets.
                  </li>
                ) : null}
              </ul>
            </DashboardSectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardSectionCard
              eyebrow="Integrations"
              title="Connector Health"
              action={
                <Link to="/portal/platform/integrations" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                  Open Integration Manager
                </Link>
              }
            >
              <ul className="space-y-3">
                {state.integrations.slice(0, 6).map((integration) => (
                  <li key={integration.id} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{integration.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{integration.category} • Owner: {integration.owner}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Last sync {formatDateTime(integration.lastSyncAt)}</p>
                    </div>
                    <StatusPill value={integration.status || 'active'} />
                  </li>
                ))}
                {state.integrations.length === 0 ? (
                  <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No integrations available.
                  </li>
                ) : null}
              </ul>
            </DashboardSectionCard>

            <DashboardSectionCard
              eyebrow="Security"
              title="Compliance Controls"
              action={
                <Link to="/portal/platform/security" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                  Open Security Controls
                </Link>
              }
            >
              <ul className="space-y-3">
                {state.checks.slice(0, 6).map((check) => (
                  <li key={check.id} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{check.control}</p>
                      <p className="mt-1 text-sm text-slate-500">{check.note}</p>
                    </div>
                    <StatusPill value={check.status || 'healthy'} />
                  </li>
                ))}
                {state.checks.length === 0 ? (
                  <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No compliance checks available.
                  </li>
                ) : null}
              </ul>
            </DashboardSectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default PlatformDashboardPage;
