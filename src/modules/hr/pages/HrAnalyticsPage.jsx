import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatCard from '../../../shared/components/StatCard';
import { fetchHrCampusDriveApplications, fetchHrCampusDrives, getHrAnalytics } from '../services/hrApi';

const emptyPipeline = {
  applied: 0,
  shortlisted: 0,
  interview_scheduled: 0,
  interviewed: 0,
  offered: 0,
  rejected: 0,
  hired: 0
};

const reportFilters = [
  { key: 'all', label: 'All Reports' },
  { key: 'hr', label: 'HR Jobs' },
  { key: 'campus', label: 'Campus Drives' }
];

const stageLabels = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  offered: 'Offered',
  rejected: 'Rejected',
  hired: 'Hired'
};

const normalizePipeline = (pipeline = {}) => ({
  applied: Number(pipeline.applied || pipeline.total || 0),
  shortlisted: Number(pipeline.shortlisted || 0),
  interview_scheduled: Number(pipeline.interview_scheduled || pipeline.interviewReady || 0),
  interviewed: Number(pipeline.interviewed || 0),
  offered: Number(pipeline.offered || 0),
  rejected: Number(pipeline.rejected || 0),
  hired: Number(pipeline.hired || pipeline.selected || 0)
});

const mergePipelines = (...pipelines) =>
  pipelines.reduce((acc, pipeline) => {
    Object.keys(emptyPipeline).forEach((key) => {
      acc[key] += Number(pipeline?.[key] || 0);
    });
    return acc;
  }, { ...emptyPipeline });

const HrAnalyticsPage = () => {
  const [state, setState] = useState({ loading: true, error: '', isDemo: false, analytics: null, campusPipeline: { ...emptyPipeline }, campusDrives: 0 });
  const [reportFilter, setReportFilter] = useState('all');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [response, campusDrivesResponse] = await Promise.all([
        getHrAnalytics(),
        fetchHrCampusDrives()
      ]);
      if (!mounted) return;

      const campusDrives = campusDrivesResponse.data || [];
      const campusApplicationResponses = await Promise.all(
        campusDrives.map((drive) => fetchHrCampusDriveApplications(drive.id || drive._id, { all: true }).catch(() => null))
      );
      if (!mounted) return;

      const campusPipeline = mergePipelines(
        ...campusApplicationResponses.map((result) => normalizePipeline(result?.summary || {}))
      );

      setState({
        loading: false,
        error: response.error && !response.isDemo ? response.error : '',
        isDemo: response.isDemo,
        analytics: response.data,
        campusPipeline,
        campusDrives: campusDrives.length
      });
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    const analytics = state.analytics || {
      totalJobs: 0,
      openJobs: 0,
      closedJobs: 0,
      totalViews: 0,
      totalApplications: 0,
      pipeline: { ...emptyPipeline }
    };
    const hrPipeline = normalizePipeline(analytics.pipeline);
    const campusPipeline = normalizePipeline(state.campusPipeline);
    const selectedPipeline = reportFilter === 'campus' ? campusPipeline : reportFilter === 'hr' ? hrPipeline : mergePipelines(hrPipeline, campusPipeline);
    const totalApplications = Object.values(selectedPipeline).reduce((sum, value) => sum + Number(value || 0), 0);
    const totalJobs = reportFilter === 'campus' ? state.campusDrives : analytics.totalJobs || 0;

    return [
      {
        label: reportFilter === 'campus' ? 'Campus Drives' : 'Total Jobs',
        value: String(totalJobs),
        helper: reportFilter === 'campus' ? 'Campus hiring reports' : `${analytics.openJobs || 0} open / ${analytics.closedJobs || 0} closed`,
        tone: 'info'
      },
      {
        label: 'Total Views',
        value: String(analytics.totalViews || 0),
        helper: 'Reach across active postings',
        tone: 'default'
      },
      {
        label: 'Applications',
        value: String(totalApplications),
        helper: `${selectedPipeline.shortlisted || 0} shortlisted`,
        tone: 'warning'
      },
      {
        label: 'Hires',
        value: String(selectedPipeline.hired || 0),
        helper: `${selectedPipeline.rejected || 0} rejected`,
        tone: 'success'
      }
    ];
  }, [reportFilter, state.analytics, state.campusDrives, state.campusPipeline]);

  const hrPipeline = normalizePipeline(state.analytics?.pipeline);
  const campusPipeline = normalizePipeline(state.campusPipeline);
  const pipeline = reportFilter === 'campus' ? campusPipeline : reportFilter === 'hr' ? hrPipeline : mergePipelines(hrPipeline, campusPipeline);
  const totalPipeline = Math.max(0, Object.values(pipeline).reduce((sum, value) => sum + Number(value || 0), 0));

  const stageColors = {
    applied: 'bg-blue-500',
    shortlisted: 'bg-amber-500',
    interview_scheduled: 'bg-yellow-500',
    interviewed: 'bg-brand-500',
    offered: 'bg-emerald-500',
    rejected: 'bg-red-400',
    hired: 'bg-teal-500'
  };

  return (
    <div className="module-page module-page--hr">
      <SectionHeader
        eyebrow="Analytics"
        title="Recruitment Performance"
        subtitle="Monitor hiring pipeline conversion and posting performance."
      />

      {state.isDemo ? <p className="module-note">Backend data is unavailable because backend is unavailable.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.loading ? <p className="module-note">Loading analytics...</p> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeader eyebrow="Pipeline" title="Application Stage Distribution" />
          <div className="flex flex-wrap gap-2">
            {reportFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setReportFilter(filter.key)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${reportFilter === filter.key ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {Object.entries(pipeline).map(([stage, count]) => {
            const numericCount = Number(count || 0);
            const percentage = totalPipeline > 0 ? Math.round((numericCount / totalPipeline) * 100) : 0;

            return (
              <div key={stage} className="space-y-0.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-slate-600">{stageLabels[stage] || stage}</span>
                  <span className="font-semibold text-navy tabular-nums">{numericCount} ({percentage}%)</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stageColors[stage] || 'bg-slate-400'}`}
                    style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HrAnalyticsPage;
