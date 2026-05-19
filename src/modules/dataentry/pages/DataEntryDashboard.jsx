import { useEffect, useMemo, useState } from 'react';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
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

  return (
    <div className="space-y-3 pb-2">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Data Entry Workspace</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-navy sm:text-3xl">Data Entry Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
          Candidate, company, and job entry operations in one command view.
        </p>
      </div>

      {state.isDemo ? <p className="module-note">Demo data is being shown because the data entry backend is not connected.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}

      {state.loading ? <p className="module-note">Loading dashboard...</p> : null}

      {!state.loading ? (
        <>
          <DashboardMetricCards cards={statCards} />
        </>
      ) : null}
    </div>
  );
};

export default DataEntryDashboard;
