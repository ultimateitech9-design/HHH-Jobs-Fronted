import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import StatusPill from '../../../shared/components/StatusPill';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardQuickActionCard from '../../../shared/components/dashboard/DashboardQuickActionCard';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import { dashboardSectionActionClassName } from '../../../shared/components/dashboard/dashboardActionStyles';
import { formatDateTime, getAuditAlerts, getAuditEvents, getAuditSummary } from '../services/auditApi';

const AuditDashboardPage = () => {
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

  const cards = useMemo(() => {
    const summary = state.summary || {
      events24h: 0,
      criticalAlerts: 0,
      warnings: 0,
      informational: 0
    };

    return [
      {
        label: 'Events (24h)',
        value: String(summary.events24h || 0),
        helper: 'Tracked system and user actions',
        tone: 'info'
      },
      {
        label: 'Critical Alerts',
        value: String(summary.criticalAlerts || 0),
        helper: 'High-risk events requiring action',
        tone: summary.criticalAlerts > 0 ? 'danger' : 'success'
      },
      {
        label: 'Warnings',
        value: String(summary.warnings || 0),
        helper: 'Watchlist activities',
        tone: summary.warnings > 0 ? 'warning' : 'default'
      },
      {
        label: 'Informational',
        value: String(summary.informational || 0),
        helper: 'Standard activity logs',
        tone: 'default'
      }
    ];
  }, [state.summary]);

  const auditSignals = useMemo(() => {
    const highSeverityAlerts = state.alerts.filter((alert) =>
      ['high', 'critical'].includes(String(alert.severity || '').toLowerCase())
    ).length;
    const openAlerts = state.alerts.filter((alert) => String(alert.status || '').toLowerCase() !== 'resolved').length;
    const dangerEvents = state.recentEvents.filter((event) => String(event.severity || '').toLowerCase() === 'danger').length;

    return [
      { label: 'Events in last 24h', value: state.summary?.events24h || 0 },
      { label: 'High severity alerts', value: highSeverityAlerts },
      { label: 'Open alerts', value: openAlerts },
      { label: 'Danger events', value: dangerEvents }
    ];
  }, [state.summary, state.alerts, state.recentEvents]);

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

  const quickActions = [
    {
      title: 'Event Forensics',
      description: 'Inspect raw actions with entity and severity context.',
      to: '/portal/audit/events'
    },
    {
      title: 'Alert Response',
      description: 'Assign owners, classify risk, and close policy incidents.',
      to: '/portal/audit/alerts'
    },
    {
      title: 'Trace Snapshot',
      description: 'Keep event volume and alert pressure visible each shift.',
      to: '/portal/audit/dashboard'
    }
  ];

  return (
    <div className="space-y-3 pb-2">
      {state.isDemo ? <p className="module-note">Backend data is unavailable because backend is unavailable or restricted.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <PortalDashboardHero
        tone="audit"
        eyebrow="Audit Dashboard"
        badge={state.isDemo ? 'Demo trace' : 'Investigation live'}
        title="Operational traceability, alert pressure, and evidence readiness in one workspace"
        description="Observe security-relevant events, triage alerts, and maintain a defensible audit trail with role-ready investigative visibility."
        chips={['Event forensics', 'Alert response', 'Policy evidence']}
        primaryAction={{ to: '/portal/audit/events', label: 'Open Event Explorer' }}
        secondaryAction={{ to: '/portal/audit/alerts', label: 'Review Alerts' }}
        metrics={auditSignals.map((signal) => ({ ...signal, helper: 'Current risk indicator' }))}
      />

      {state.loading ? <p className="module-note">Loading audit dashboard...</p> : null}

      {!state.loading ? (
        <>
          <DashboardMetricCards cards={cards} />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <DashboardQuickActionCard
                key={action.title}
                to={action.to}
                title={action.title}
                description={action.description}
                tone="warning"
                ctaLabel="Open workspace"
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <DashboardSectionCard
              eyebrow="Investigation Brief"
              title="Current Audit Priorities"
              subtitle="Handle these checkpoints first to reduce policy exposure."
            >
              <ul className="space-y-3">
                {investigationChecklist.map((item, index) => (
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
              eyebrow="Risk Mix"
              title="Severity and Response Snapshot"
              subtitle="Quick view of signal mix across alerts and recent events."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Low severity alerts</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">
                    {state.alerts.filter((alert) => String(alert.severity || '').toLowerCase() === 'low').length}
                  </p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Medium alerts</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">
                    {state.alerts.filter((alert) => String(alert.severity || '').toLowerCase() === 'medium').length}
                  </p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">High / critical</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">
                    {state.alerts.filter((alert) => ['high', 'critical'].includes(String(alert.severity || '').toLowerCase())).length}
                  </p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Info events</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">
                    {state.recentEvents.filter((event) => String(event.severity || '').toLowerCase() === 'info').length}
                  </p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Warning events</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">
                    {state.recentEvents.filter((event) => String(event.severity || '').toLowerCase() === 'warning').length}
                  </p>
                </article>
                <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Resolved alerts</p>
                  <p className="mt-3 font-heading text-3xl font-extrabold text-navy">
                    {state.alerts.filter((alert) => String(alert.status || '').toLowerCase() === 'resolved').length}
                  </p>
                </article>
              </div>
            </DashboardSectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardSectionCard
              eyebrow="Recent Events"
              title="Latest Logged Actions"
              action={
                <Link to="/portal/audit/events" className={dashboardSectionActionClassName}>
                  Open Event Explorer
                </Link>
              }
            >
              <ul className="space-y-3">
                {state.recentEvents.map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{event.action}</p>
                      <p className="mt-1 text-sm text-slate-500">{event.entity_type}:{event.entity_id}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{formatDateTime(event.created_at)}</p>
                    </div>
                    <StatusPill value={event.severity} />
                  </li>
                ))}
                {state.recentEvents.length === 0 ? (
                  <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No events available.
                  </li>
                ) : null}
              </ul>
            </DashboardSectionCard>

            <DashboardSectionCard
              eyebrow="Open Alerts"
              title="Security and Policy Signals"
              action={
                <Link to="/portal/audit/alerts" className={dashboardSectionActionClassName}>
                  Open Alert Manager
                </Link>
              }
            >
              <ul className="space-y-3">
                {state.alerts.slice(0, 8).map((alert) => (
                  <li key={alert.id} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
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
                  <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No alerts detected.
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

export default AuditDashboardPage;
