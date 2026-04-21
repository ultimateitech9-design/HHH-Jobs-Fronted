import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusPill from '../../../shared/components/StatusPill';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import { dashboardSectionActionClassName } from '../../../shared/components/dashboard/dashboardActionStyles';
import { getDataEntryDashboard } from '../services/dataentryApi';

const emptyDashboard = {
  totals: {
    candidatesAdded: 0,
    jobsPosted: 0,
    companiesAdded: 0,
    hrContactsAdded: 0,
    totalEntries: 0
  },
  candidateWorkflow: {
    profileCreated: 0,
    resumeUploaded: 0,
    detailsUpdated: 0,
    candidateIdsGenerated: 0
  },
  companyWorkflow: {
    companyDetailsAdded: 0,
    hrContactsAdded: 0,
    jobOpeningsAdded: 0
  },
  pipeline: {
    applied: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0
  },
  quality: {
    errors: 0,
    duplicateEntries: 0,
    pendingReview: 0,
    approved: 0,
    drafts: 0
  },
  activityFeed: []
};

const DataEntryDashboard = () => {
  const [state, setState] = useState({
    loading: true,
    error: '',
    isDemo: false,
    dashboard: emptyDashboard
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const dashboardRes = await getDataEntryDashboard();
        if (!mounted) return;

        setState({
          loading: false,
          error: dashboardRes.error || '',
          isDemo: Boolean(dashboardRes.isDemo),
          dashboard: { ...emptyDashboard, ...(dashboardRes.data || {}) }
        });
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || 'Unable to load data entry dashboard.'
        }));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totals = state.dashboard.totals || {};
    const quality = state.dashboard.quality || {};

    return [
      {
        label: 'Candidates Added',
        value: Number(totals.candidatesAdded || 0),
        helper: 'Profiles created by the data entry team'
      },
      {
        label: 'Jobs Posted',
        value: Number(totals.jobsPosted || 0),
        helper: 'Openings added to the system'
      },
      {
        label: 'Companies Added',
        value: Number(totals.companiesAdded || 0),
        helper: 'Company records created'
      },
      {
        label: 'Errors / Duplicates',
        value: Number(quality.errors || 0) + Number(quality.duplicateEntries || 0),
        helper: `${quality.errors || 0} errors | ${quality.duplicateEntries || 0} duplicates`
      }
    ];
  }, [state.dashboard]);

  const workflowItems = useMemo(() => {
    const candidateWorkflow = state.dashboard.candidateWorkflow || {};
    const companyWorkflow = state.dashboard.companyWorkflow || {};

    return [
      { label: 'Candidate Profiles Created', value: Number(candidateWorkflow.profileCreated || 0) },
      { label: 'Resumes Uploaded', value: Number(candidateWorkflow.resumeUploaded || 0) },
      { label: 'Candidate Details Updated', value: Number(candidateWorkflow.detailsUpdated || 0) },
      { label: 'Candidate IDs Generated', value: Number(candidateWorkflow.candidateIdsGenerated || 0) },
      { label: 'Company Details Added', value: Number(companyWorkflow.companyDetailsAdded || 0) },
      { label: 'HR Contacts Added', value: Number(companyWorkflow.hrContactsAdded || 0) },
      { label: 'Job Openings Added', value: Number(companyWorkflow.jobOpeningsAdded || 0) }
    ];
  }, [state.dashboard]);

  const pipelineItems = useMemo(() => {
    const pipeline = state.dashboard.pipeline || {};
    return [
      { key: 'applied', label: 'Applied', value: Number(pipeline.applied || 0) },
      { key: 'shortlisted', label: 'Shortlisted', value: Number(pipeline.shortlisted || 0) },
      { key: 'interview', label: 'Interview', value: Number(pipeline.interview || 0) },
      { key: 'selected', label: 'Selected', value: Number(pipeline.selected || 0) },
      { key: 'rejected', label: 'Rejected', value: Number(pipeline.rejected || 0) }
    ];
  }, [state.dashboard]);

  const monitoringItems = useMemo(() => {
    const quality = state.dashboard.quality || {};
    return [
      { label: 'Total Entries Handled', value: Number(state.dashboard.totals?.totalEntries || 0), tone: 'info' },
      { label: 'Pending Review', value: Number(quality.pendingReview || 0), tone: 'warning' },
      { label: 'Approved Entries', value: Number(quality.approved || 0), tone: 'success' },
      { label: 'Draft Entries', value: Number(quality.drafts || 0), tone: 'default' },
      { label: 'Errors', value: Number(quality.errors || 0), tone: Number(quality.errors || 0) > 0 ? 'danger' : 'default' },
      {
        label: 'Duplicate Entries',
        value: Number(quality.duplicateEntries || 0),
        tone: Number(quality.duplicateEntries || 0) > 0 ? 'danger' : 'default'
      }
    ];
  }, [state.dashboard]);

  const activityFeed = useMemo(() => {
    const items = Array.isArray(state.dashboard.activityFeed) ? state.dashboard.activityFeed : [];
    return items.slice(0, 6);
  }, [state.dashboard]);

  const heroMetrics = monitoringItems.slice(0, 4).map((item) => ({
    label: item.label,
    value: item.value,
    helper:
      item.tone === 'warning'
        ? 'Needs review'
        : item.tone === 'success'
          ? 'Quality stable'
          : 'Tracked live'
  }));

  const statCards = stats.map((card, index) => ({
    ...card,
    tone: ['accent', 'info', 'success', 'danger'][index] || 'default'
  }));

  return (
    <div className="space-y-3 pb-2">
      {state.isDemo ? <p className="module-note">Demo data is being shown because the data entry backend is not connected.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}

      <PortalDashboardHero
        tone="dataentry"
        eyebrow="Data Entry Dashboard"
        badge={state.isDemo ? 'Demo workflow' : 'Live operations'}
        title="Candidate, company, and job entry operations in one command view"
        description="Track operator throughput, record movement across the hiring pipeline, and the quality checks that keep duplicate or incorrect entries under control."
        chips={['Candidate workflow', 'Company setup', 'Approval monitoring']}
        primaryAction={{ to: '/portal/dataentry/add-job', label: 'Add Job' }}
        secondaryAction={{ to: '/portal/dataentry/manage-entries', label: 'Manage Entries' }}
        metrics={heroMetrics}
      />

      {state.loading ? <p className="module-note">Loading dashboard...</p> : null}

      {!state.loading ? (
        <>
          <DashboardMetricCards cards={statCards} />

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardSectionCard
              eyebrow="Operator Activity"
              title="Daily Input Coverage"
              subtitle="What the team has added or updated across candidate and company workflows."
            >
              <ul className="space-y-3">
                {workflowItems.map((item) => (
                  <li key={item.label} className="flex items-center justify-between rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-500">Recorded actions in this workflow step</p>
                    </div>
                    <strong className="font-heading text-2xl font-extrabold text-navy">{item.value}</strong>
                  </li>
                ))}
              </ul>
            </DashboardSectionCard>

            <DashboardSectionCard
              eyebrow="Recent Feed"
              title="Latest Queue Activity"
              subtitle="The newest actions captured from data entry operations."
            >
              <ul className="space-y-3">
                {activityFeed.map((item, index) => (
                  <li
                    key={item.id || `feed-${index}`}
                    className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.title || item.action || `Activity ${index + 1}`}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.description || item.message || 'Recent workflow activity recorded.'}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {item.time || item.createdAt || 'Just now'}
                      </p>
                    </div>
                    <StatusPill value={item.status || 'active'} />
                  </li>
                ))}
                {activityFeed.length === 0 ? (
                  <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No recent activity is available.
                  </li>
                ) : null}
              </ul>
            </DashboardSectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardSectionCard
              eyebrow="Pipeline"
              title="Application Movement"
              subtitle="Volume at each candidate stage handled by the current input and update flow."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pipelineItems.map((item) => (
                  <article key={item.key} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <StatusPill value={item.label.toLowerCase()} />
                    </div>
                    <p className="mt-4 font-heading text-3xl font-extrabold text-navy">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-500">Current stage volume</p>
                  </article>
                ))}
              </div>
            </DashboardSectionCard>

            <DashboardSectionCard
              eyebrow="Quality Desk"
              title="Data Quality Monitoring"
              subtitle="Errors, duplicate entries, approvals, and drafts that need operator attention."
              action={
                <Link to="/portal/dataentry/pending" className={dashboardSectionActionClassName}>
                  Open Queue
                </Link>
              }
            >
              <ul className="space-y-3">
                {monitoringItems.map((item) => (
                  <li key={item.label} className="flex items-center justify-between rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-500">Dashboard monitor</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <strong className="font-heading text-2xl font-extrabold text-navy">{item.value}</strong>
                      <StatusPill value={item.tone} />
                    </div>
                  </li>
                ))}
              </ul>
            </DashboardSectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default DataEntryDashboard;
