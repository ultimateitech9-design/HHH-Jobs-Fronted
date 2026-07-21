import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiAlertTriangle, FiClock, FiFileText } from 'react-icons/fi';
import StatusPill from '../../../shared/components/StatusPill';
import DashboardFocusNav from '../../../shared/components/dashboard/DashboardFocusNav';
import DashboardPageHeader from '../../../shared/components/dashboard/DashboardPageHeader';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import DashboardSummaryStrip from '../../../shared/components/dashboard/DashboardSummaryStrip';
import { dashboardSectionActionClassName } from '../../../shared/components/dashboard/dashboardActionStyles';
import useDashboardView from '../../../shared/hooks/useDashboardView';
import { formatDateTime, getAuditAlerts, getAuditEvents, getAuditSummary } from '../services/auditApi';

const AUDIT_DASHBOARD_VIEWS = ['priorities', 'events', 'alerts'];

const AuditDashboardPage = () => {
  const [activeView, setActiveView] = useDashboardView(AUDIT_DASHBOARD_VIEWS, 'priorities');
  const [state, setState] = useState({
    loading: true,
    isDemo: false,
    error: '',
    summary: null,
    recentEvents: [],
    alerts: []
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const [summaryRes, eventsRes, alertsRes] = await Promise.all([
          getAuditSummary(),
          getAuditEvents({ page: 1, limit: 8 }),
          getAuditAlerts()
        ]);

        if (!mounted) return;

        setState({
          loading: false,
          isDemo: [summaryRes, eventsRes, alertsRes].some((item) => item.isDemo),
          error: [summaryRes, eventsRes, alertsRes].find((item) => item.error && !item.isDemo)?.error || '',
          summary: summaryRes.data,
          recentEvents: eventsRes.data?.auditLogs || [],
          alerts: alertsRes.data || []
        });
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || 'Unable to load audit dashboard.'
        }));
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const investigationChecklist = useMemo(() => {
    const unresolved = state.alerts.filter((alert) => String(alert.status || '').toLowerCase() !== 'resolved').length;
    const warningEvents = state.recentEvents.filter((event) => String(event.severity || '').toLowerCase() === 'warning').length;

    return [
      {
        title: unresolved > 0 ? 'Resolve open alert ownership' : 'Alert ownership is stable',
        description:
          unresolved > 0
            ? `${unresolved} alert signals require owner assignment or closure notes.`
            : 'All alert cases are either resolved or in managed review.'
      },
      {
        title: warningEvents > 0 ? 'Review warning-grade event patterns' : 'Warning trend is low',
        description:
          warningEvents > 0
            ? `${warningEvents} warning events appear in the latest log slice.`
            : 'No significant warning spike in current event window.'
      },
      {
        title: 'Keep evidence trail complete',
        description: 'Attach investigation notes and owner updates directly to alert workflows for compliance.'
      }
    ];
  }, [state.alerts, state.recentEvents]);

  const summary = state.summary || {};
  const openAlerts = state.alerts.filter((alert) => String(alert.status || '').toLowerCase() !== 'resolved').length;
  const highSeverityAlerts = state.alerts.filter((alert) =>
    ['high', 'critical'].includes(String(alert.severity || '').toLowerCase())
  ).length;
  const focusItems = [
    { key: 'priorities', label: 'Priorities', description: 'Start with the checks that reduce the largest policy exposure.', icon: FiClock },
    { key: 'events', label: 'Events', description: 'Inspect recent system and user actions with severity context.', count: state.recentEvents.length, icon: FiActivity },
    { key: 'alerts', label: 'Alerts', description: 'Review open security and policy signals, ownership, and response state.', count: state.alerts.length, icon: FiAlertTriangle }
  ];

  return (
    <div className="space-y-3 pb-2">
      {state.isDemo ? <p className="module-note">Backend data is unavailable because backend is unavailable or restricted.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}

      <DashboardPageHeader
        eyebrow="Audit and governance"
        title="Audit control center"
        description="Investigate event history, triage policy alerts, and preserve a clear evidence trail through focused workspaces."
        meta={[
          { label: 'Trace source', value: state.isDemo ? 'Demo data' : 'Live' },
          { label: 'Open alerts', value: openAlerts }
        ]}
        actions={(
          <>
            <Link to="/portal/audit/events" className={dashboardSectionActionClassName}>Event explorer</Link>
            <Link to="/portal/audit/alerts" className={dashboardSectionActionClassName}>Alert manager</Link>
          </>
        )}
      />

      <DashboardSummaryStrip
        loading={state.loading}
        items={[
          { label: 'Events in 24h', value: summary.events24h || 0, helper: 'Tracked actions', icon: FiActivity },
          { label: 'Open alerts', value: openAlerts, helper: `${state.alerts.length} total signals`, icon: FiAlertTriangle },
          { label: 'High severity', value: highSeverityAlerts, helper: 'High and critical' },
          { label: 'Warnings', value: summary.warnings || 0, helper: 'Watchlist activity', icon: FiFileText }
        ]}
      />

      <DashboardFocusNav
        title="Investigation view"
        label="Audit dashboard views"
        items={focusItems}
        activeKey={activeView}
        onChange={setActiveView}
      />

      {state.loading ? <p className="module-note">Loading audit dashboard...</p> : null}

      {!state.loading ? (
        <>
          {activeView === 'priorities' ? (
            <DashboardSectionCard
              eyebrow="Investigation brief"
              title="Current audit priorities"
              subtitle="Handle these checkpoints first to reduce policy exposure."
              id="dashboard-view-priorities"
              role="tabpanel"
              aria-labelledby="dashboard-tab-priorities"
            >
              <ol className="divide-y divide-slate-200 border-y border-slate-200">
                {investigationChecklist.map((item, index) => (
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

          {activeView === 'events' ? (
            <DashboardSectionCard
              eyebrow="Recent events"
              title="Latest logged actions"
              subtitle="Inspect the actor, entity, severity, and timestamp for recent actions."
              action={<Link to="/portal/audit/events" className={dashboardSectionActionClassName}>Open event explorer</Link>}
              id="dashboard-view-events"
              role="tabpanel"
              aria-labelledby="dashboard-tab-events"
            >
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {state.recentEvents.map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-4 px-1 py-5">
                    <div>
                      <p className="font-semibold text-slate-900">{event.action}</p>
                      <p className="mt-1 text-sm text-slate-500">{event.entity_type}:{event.entity_id}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{formatDateTime(event.created_at)}</p>
                    </div>
                    <StatusPill value={event.severity} />
                  </li>
                ))}
                {state.recentEvents.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-slate-500">No events available.</li>
                ) : null}
              </ul>
            </DashboardSectionCard>
          ) : null}

          {activeView === 'alerts' ? (
            <DashboardSectionCard
              eyebrow="Alert response"
              title="Security and policy signals"
              subtitle="Review severity, ownership, response status, and incident context."
              action={<Link to="/portal/audit/alerts" className={dashboardSectionActionClassName}>Open alert manager</Link>}
              id="dashboard-view-alerts"
              role="tabpanel"
              aria-labelledby="dashboard-tab-alerts"
            >
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {state.alerts.map((alert) => (
                  <li key={alert.id} className="flex items-start justify-between gap-4 px-1 py-5">
                    <div>
                      <p className="font-semibold text-slate-900">{alert.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{alert.description}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {formatDateTime(alert.created_at)} • Owner: {alert.owner || '-'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusPill value={alert.severity} />
                      <StatusPill value={alert.status} />
                    </div>
                  </li>
                ))}
                {state.alerts.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-slate-500">No alerts detected.</li>
                ) : null}
              </ul>
            </DashboardSectionCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default AuditDashboardPage;
