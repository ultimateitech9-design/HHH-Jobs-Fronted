import { useEffect, useMemo, useState } from 'react';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardQuickActionCard from '../../../shared/components/dashboard/DashboardQuickActionCard';
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

  const statCards = stats.map((card, index) => ({
    ...card,
    tone: ['accent', 'info', 'success', 'danger'][index] || 'default'
  }));

  const quickActions = useMemo(() => {
    const totals = state.dashboard.totals || {};
    const quality = state.dashboard.quality || {};
    const pipeline = state.dashboard.pipeline || {};
    const activityCount = Array.isArray(state.dashboard.activityFeed) ? state.dashboard.activityFeed.length : 0;

    return [
    {
      to: '/portal/dataentry/add-job',
      title: 'Post Job',
      description: 'Create a new job entry and send it into the publishing workflow.',
      eyebrow: 'Create',
      tone: 'brand',
      ctaLabel: 'Open posting'
    },
    {
      to: '/portal/dataentry/records',
      title: 'Data Records',
      description: `${Number(totals.totalEntries || 0)} total records available across jobs, candidates, companies, and queue data.`,
      eyebrow: 'Records',
      tone: 'neutral',
      ctaLabel: 'Open records'
    },
    {
      to: '/portal/dataentry/manage-entries',
      title: 'Manage Jobs',
      description: `${Number(totals.jobsPosted || 0)} job entries are currently tracked from the main operator queue.`,
      eyebrow: 'Queue',
      tone: 'info',
      ctaLabel: 'Open queue'
    },
    {
      to: '/portal/dataentry/drafts',
      title: 'Draft Jobs',
      description: `${Number(quality.drafts || 0)} draft entries still need operator input before they can move forward.`,
      eyebrow: 'Drafts',
      tone: 'accent',
      ctaLabel: 'Open drafts'
    },
    {
      to: '/portal/dataentry/pending',
      title: 'Pending Approval',
      description: `${Number(quality.pendingReview || 0)} entries are waiting for review or next-stage approval.`,
      eyebrow: 'Review',
      tone: 'warning',
      ctaLabel: 'Review pending'
    },
    {
      to: '/portal/dataentry/approved',
      title: 'Approved Jobs',
      description: `${Number(quality.approved || 0)} entries have cleared review and moved into the approved pipeline.`,
      eyebrow: 'Approved',
      tone: 'success',
      ctaLabel: 'Open approved'
    },
    {
      to: '/portal/dataentry/rejected',
      title: 'Rejected Jobs',
      description: `${Number(pipeline.rejected || 0)} records are currently marked rejected and need follow-up or correction.`,
      eyebrow: 'Rejected',
      tone: 'warning',
      ctaLabel: 'Open rejected'
    },
    {
      to: '/portal/dataentry/notifications',
      title: 'Notifications',
      description: `${activityCount} recent alerts and workflow updates are available for operator follow-up.`,
      eyebrow: 'Alerts',
      tone: 'neutral',
      ctaLabel: 'Open alerts'
    }
    ];
  }, [state.dashboard]);

  return (
    <div className="space-y-3 pb-2">
      {state.isDemo ? <p className="module-note">Demo data is being shown because the data entry backend is not connected.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}

      {state.loading ? <p className="module-note">Loading dashboard...</p> : null}

      {!state.loading ? (
        <>
          <DashboardMetricCards cards={statCards} />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <DashboardQuickActionCard
                key={action.title}
                to={action.to}
                title={action.title}
                description={action.description}
                eyebrow={action.eyebrow}
                tone={action.tone}
                ctaLabel={action.ctaLabel}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default DataEntryDashboard;
