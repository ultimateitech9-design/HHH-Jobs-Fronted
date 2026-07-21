import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiGrid, FiLink, FiMessageCircle, FiShield } from 'react-icons/fi';
import StatusPill from '../../../shared/components/StatusPill';
import DashboardFocusNav from '../../../shared/components/dashboard/DashboardFocusNav';
import DashboardPageHeader from '../../../shared/components/dashboard/DashboardPageHeader';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import DashboardSummaryStrip from '../../../shared/components/dashboard/DashboardSummaryStrip';
import { dashboardSectionActionClassName } from '../../../shared/components/dashboard/dashboardActionStyles';
import useDashboardView from '../../../shared/hooks/useDashboardView';
import {
  formatDateTime,
  getPlatformIntegrations,
  getPlatformOverview,
  getPlatformSecurityChecks,
  getPlatformSupportTickets,
  getPlatformTenants
} from '../services/platformApi';

const PLATFORM_DASHBOARD_VIEWS = ['priorities', 'tenants', 'support', 'integrations', 'security'];

const PlatformDashboardPage = () => {
  const [activeView, setActiveView] = useDashboardView(PLATFORM_DASHBOARD_VIEWS, 'priorities');
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

  const overview = state.overview || {};
  const focusItems = [
    { key: 'priorities', label: 'Priorities', description: 'Follow the recommended order for tenant reliability and service quality.', icon: FiActivity },
    { key: 'tenants', label: 'Tenants', description: 'Review active and non-active tenant posture.', count: state.tenants.length, icon: FiGrid },
    { key: 'support', label: 'Support', description: 'Inspect recent priority tenant tickets.', count: state.tickets.length, icon: FiMessageCircle },
    { key: 'integrations', label: 'Integrations', description: 'Review connector sync and recovery health.', count: state.integrations.length, icon: FiLink },
    { key: 'security', label: 'Security', description: 'Inspect compliance controls and risk observations.', count: state.checks.length, icon: FiShield }
  ];

  return (
    <div className="space-y-3 pb-2">
      {state.isDemo ? <p className="module-note">Showing fallback platform telemetry because the live backend is unavailable right now.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}

      <DashboardPageHeader
        eyebrow="Platform operations"
        title="Platform control center"
        description="Review tenant health, support pressure, connector reliability, and compliance without mixing unrelated workflows."
        meta={[
          { label: 'Environment', value: state.isDemo ? 'Demo data' : 'Live' },
          { label: 'Tenant state', value: `${overview.activeTenants || 0} active` }
        ]}
        actions={(
          <>
            <Link to="/portal/platform/tenants" className={dashboardSectionActionClassName}>Manage tenants</Link>
            <Link to="/portal/platform/support" className={dashboardSectionActionClassName}>Open support</Link>
          </>
        )}
      />

      <DashboardSummaryStrip
        loading={state.loading}
        items={[
          { label: 'Active tenants', value: overview.activeTenants || 0, helper: `${overview.pendingTenants || 0} pending`, icon: FiGrid },
          { label: 'Monthly revenue', value: `INR ${Number(overview.monthlyRevenue || 0).toLocaleString('en-IN')}`, helper: 'Current billing run' },
          { label: 'Open tickets', value: state.tickets.filter((ticket) => String(ticket.status || '').toLowerCase() === 'open').length, helper: `${state.tickets.length} visible`, icon: FiMessageCircle },
          { label: 'Healthy controls', value: overview.complianceHealthy || 0, helper: `${state.checks.length} checks`, icon: FiShield }
        ]}
      />

      <DashboardFocusNav
        title="Operations view"
        label="Platform operations views"
        items={focusItems}
        activeKey={activeView}
        onChange={setActiveView}
      />

      {state.loading ? <p className="module-note">Loading platform dashboard...</p> : null}

      {!state.loading ? (
        <>
          {activeView === 'priorities' ? (
            <DashboardSectionCard
              eyebrow="Shift brief"
              title="Immediate platform priorities"
              subtitle="Work through the highest-value reliability checks in order."
              id="dashboard-view-priorities"
              role="tabpanel"
              aria-labelledby="dashboard-tab-priorities"
            >
              <ol className="divide-y divide-slate-200 border-y border-slate-200">
                {operationsChecklist.map((item, index) => (
                  <li key={item.title} className="flex gap-4 px-1 py-5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-sm font-black text-brand-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </DashboardSectionCard>
          ) : null}

          {activeView === 'tenants' ? (
            <DashboardSectionCard
              eyebrow="Tenant directory"
              title="Tenant health and access"
              subtitle="Review plan, usage, renewal, and operating status for each tenant."
              action={<Link to="/portal/platform/tenants" className={dashboardSectionActionClassName}>Manage tenants</Link>}
              id="dashboard-view-tenants"
              role="tabpanel"
              aria-labelledby="dashboard-tab-tenants"
            >
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {state.tenants.map((tenant) => (
                  <li key={tenant.id} className="flex items-start justify-between gap-4 px-1 py-5">
                    <div>
                      <p className="font-semibold text-slate-900">{tenant.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{tenant.domain || '-'} • Plan: {tenant.plan}</p>
                      <p className="mt-1 text-sm text-slate-500">Users: {tenant.activeUsers || 0} • Renewal: {tenant.renewalDate || '-'}</p>
                    </div>
                    <StatusPill value={tenant.status || 'active'} />
                  </li>
                ))}
                {state.tenants.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-slate-500">
                    No tenant records available.
                  </li>
                ) : null}
              </ul>
            </DashboardSectionCard>
          ) : null}

          {activeView === 'support' ? (
            <DashboardSectionCard
              eyebrow="Support queue"
              title="Priority tenant tickets"
              subtitle="See ownership, urgency, and current ticket state in one list."
              action={<Link to="/portal/platform/support" className={dashboardSectionActionClassName}>Open support operations</Link>}
              id="dashboard-view-support"
              role="tabpanel"
              aria-labelledby="dashboard-tab-support"
            >
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {state.tickets.map((ticket) => (
                  <li key={ticket.id} className="flex items-start justify-between gap-4 px-1 py-5">
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
                  <li className="px-4 py-8 text-center text-sm text-slate-500">No support tickets.</li>
                ) : null}
              </ul>
            </DashboardSectionCard>
          ) : null}

          {activeView === 'integrations' ? (
            <DashboardSectionCard
              eyebrow="Integrations"
              title="Connector health"
              subtitle="Review synchronization state and ownership without unrelated platform noise."
              action={<Link to="/portal/platform/integrations" className={dashboardSectionActionClassName}>Manage integrations</Link>}
              id="dashboard-view-integrations"
              role="tabpanel"
              aria-labelledby="dashboard-tab-integrations"
            >
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {state.integrations.map((integration) => (
                  <li key={integration.id} className="flex items-start justify-between gap-4 px-1 py-5">
                    <div>
                      <p className="font-semibold text-slate-900">{integration.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{integration.category} • Owner: {integration.owner}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Last sync {formatDateTime(integration.lastSyncAt)}</p>
                    </div>
                    <StatusPill value={integration.status || 'active'} />
                  </li>
                ))}
                {state.integrations.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-slate-500">No integrations available.</li>
                ) : null}
              </ul>
            </DashboardSectionCard>
          ) : null}

          {activeView === 'security' ? (
            <DashboardSectionCard
              eyebrow="Security"
              title="Compliance controls"
              subtitle="Keep each control, observation, and health outcome easy to scan."
              action={<Link to="/portal/platform/security" className={dashboardSectionActionClassName}>Open security controls</Link>}
              id="dashboard-view-security"
              role="tabpanel"
              aria-labelledby="dashboard-tab-security"
            >
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {state.checks.map((check) => (
                  <li key={check.id} className="flex items-start justify-between gap-4 px-1 py-5">
                    <div>
                      <p className="font-semibold text-slate-900">{check.control}</p>
                      <p className="mt-1 text-sm text-slate-500">{check.note}</p>
                    </div>
                    <StatusPill value={check.status || 'healthy'} />
                  </li>
                ))}
                {state.checks.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-slate-500">No compliance checks available.</li>
                ) : null}
              </ul>
            </DashboardSectionCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default PlatformDashboardPage;
