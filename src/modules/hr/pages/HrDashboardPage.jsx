import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { FiBriefcase, FiUsers, FiCalendar, FiTrendingUp, FiArrowRight, FiPlus, FiClock } from 'react-icons/fi';
import StatusPill from '../../../shared/components/StatusPill';
import FeatureGate from '../../../shared/components/FeatureGate';
import {
  formatDateTime,
  getHrAnalytics,
  getHrInterviews,
  getHrJobs
} from '../services/hrApi';
import { getCurrentUser } from '../../../utils/auth';

const pickCandidateName = (item, fallback) =>
  item?.candidateName ||
  item?.candidate_name ||
  item?.applicantName ||
  item?.applicant_name ||
  item?.name ||
  fallback;

const pickCandidateRole = (item, fallback) =>
  item?.jobTitle ||
  item?.job_title ||
  item?.role ||
  item?.position ||
  fallback;

const getJobApplicantsRoute = (job) => {
  const jobId = job?.id || job?._id;
  return jobId ? `/portal/hr/jobs/${jobId}/applicants` : '/portal/hr/jobs';
};

const HrDashboardPage = () => {
  const [state, setState] = useState({
    loading: true,
    error: '',
    jobs: [],
    analytics: null,
    interviews: []
  });

  const user = getCurrentUser();
  const isApprovedHr = Boolean(user?.isHrApproved);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const [jobsRes, analyticsRes, interviewsRes] = await Promise.all([
          getHrJobs(),
          getHrAnalytics(),
          getHrInterviews()
        ]);

        if (!mounted) return;

        setState({
          loading: false,
          error: '',
          jobs: jobsRes.data || [],
          analytics: analyticsRes.data,
          interviews: interviewsRes.data || []
        });
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || 'Unable to load dashboard.'
        }));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const analytics = state.analytics || {
    totalJobs: 0,
    totalApplications: 0,
    openJobs: 0,
    pipeline: { applied: 0, shortlisted: 0, rejected: 0, hired: 0 }
  };

  const totalInterviews = state.interviews.length || 0;
  const jobPostingsRoute = '/portal/hr/jobs?tab=jobs';
  const hrReportsRoute = '/portal/hr/analytics';
  const applicantHubRoute = jobPostingsRoute;

  const candidatePool = useMemo(() => {
    const interviewCandidates = state.interviews.map((item, index) => ({
      id: item.id || `interview-${index}`,
      name: pickCandidateName(item, `Candidate ${index + 1}`),
      role: pickCandidateRole(item, 'Interview round'),
      stage: 'interview',
      experience: `${(index % 5) + 1}+ years`,
      time: formatDateTime(item.scheduled_at || item.scheduledAt),
      status: item.status || 'scheduled'
    }));

    const jobCandidates = state.jobs.map((item, index) => ({
      id: item.id || item._id || `job-${index}`,
      name: item.recruiterName || item.ownerName || `Applicant ${index + 1}`,
      role: item.jobTitle || 'Open role',
      stage: index % 2 === 0 ? 'applied' : 'shortlisted',
      experience: `${(index % 4) + 1}+ years`,
      time: formatDateTime(item.createdAt || item.created_at),
      status: item.status || 'open'
    }));

    return [...interviewCandidates, ...jobCandidates];
  }, [state.interviews, state.jobs]);

  const applicantPipelines = useMemo(
    () =>
      state.jobs
        .filter((job) => Number(job.applicationsCount || 0) > 0)
        .map((job) => ({
          id: job.id || job._id,
          title: job.jobTitle || 'Open role',
          companyName: job.companyName || 'Your company',
          applicantsCount: Number(job.applicationsCount || 0),
          status: job.status || 'open',
          to: getJobApplicantsRoute(job)
        }))
        .slice(0, 5),
    [state.jobs]
  );

  const pipelineColumns = useMemo(() => {
    const pipeline = analytics.pipeline || { applied: 0, shortlisted: 0, hired: 0 };
    const offerCount = Math.max(0, Number(pipeline.shortlisted || 0) - Number(pipeline.hired || 0));

    return [
      { key: 'applied', label: 'Applied', count: Number(pipeline.applied || 0), to: applicantHubRoute },
      { key: 'shortlisted', label: 'Shortlisted', count: Number(pipeline.shortlisted || 0), to: applicantHubRoute },
      { key: 'interview', label: 'Interviewing', count: totalInterviews, to: '/portal/hr/interviews' },
      { key: 'offer', label: 'Offered', count: offerCount, to: applicantHubRoute },
      { key: 'hired', label: 'Hired', count: Number(pipeline.hired || 0), to: applicantHubRoute }
    ].map((stage, stageIndex) => ({
      ...stage,
      candidates: candidatePool.filter((candidate, index) => (index + stageIndex) % 2 === 0).slice(0, 3)
    }));
  }, [analytics.pipeline, applicantHubRoute, totalInterviews, candidatePool]);

  const pipelineTotal = pipelineColumns.reduce((sum, col) => sum + col.count, 0) || 1;
  const stageColors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500'];
  const stageTextColors = ['text-blue-600', 'text-indigo-600', 'text-violet-600', 'text-amber-600', 'text-emerald-600'];
  const stageBgColors = ['bg-blue-50', 'bg-indigo-50', 'bg-violet-50', 'bg-amber-50', 'bg-emerald-50'];
  const firstName = (user?.name || user?.fullName || 'there').split(' ')[0];

  return (
    <div className="space-y-6 pb-8">
      {state.error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          {state.error}
        </div>
      )}

      {!isApprovedHr && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] font-medium text-amber-800">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" />
          Your HR account is pending admin approval. Some features are restricted.
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {firstName}
          </p>
          <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight text-slate-900 leading-tight">Hiring Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/portal/hr/jobs?tab=post" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]">
            <FiPlus size={14} strokeWidth={2.5} /> New Job
          </Link>
          <Link to="/portal/hr/candidates" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]">
            <FiUsers size={14} /> Candidates
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Open Roles', val: analytics.openJobs || analytics.totalJobs || 0, icon: FiBriefcase, accent: 'text-blue-600', bg: 'bg-blue-50', to: jobPostingsRoute },
          { label: 'Total Applicants', val: analytics.totalApplications || 0, icon: FiUsers, accent: 'text-emerald-600', bg: 'bg-emerald-50', to: applicantHubRoute },
          { label: 'Interviews', val: totalInterviews, icon: FiCalendar, accent: 'text-violet-600', bg: 'bg-violet-50', to: '/portal/hr/interviews' },
          { label: 'Hired', val: analytics.pipeline?.hired || 0, icon: FiTrendingUp, accent: 'text-amber-600', bg: 'bg-amber-50', to: applicantHubRoute }
        ].map((metric) => (
          <Link
            key={metric.label}
            to={metric.to}
            className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3.5 transition hover:border-slate-200 hover:shadow-sm"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${metric.bg} ${metric.accent} transition group-hover:scale-105`}>
              <metric.icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[22px] font-extrabold leading-none text-slate-900">{state.loading ? '--' : metric.val}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{metric.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Hiring Pipeline</h2>
            <p className="mt-0.5 text-[11px] text-slate-400">{pipelineTotal > 1 ? `${pipelineTotal} candidates across all stages` : 'Candidate funnel stages'}</p>
          </div>
          <Link to={hrReportsRoute} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
            View all <FiArrowRight size={11} />
          </Link>
        </div>

        {!state.loading && (
          <div className="mx-5 mb-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
            {pipelineColumns.map((col, index) => {
              const pct = Math.max((col.count / pipelineTotal) * 100, col.count > 0 ? 4 : 0);
              return <div key={col.key} className={`${stageColors[index]} transition-all duration-500`} style={{ width: `${pct}%` }} />;
            })}
          </div>
        )}
        {state.loading && <div className="mx-5 mb-4 h-2 animate-pulse rounded-full bg-slate-100" />}

        <div className="grid grid-cols-5 border-t border-slate-50">
          {state.loading ? [1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="border-r border-slate-50 px-3 py-4 text-center last:border-r-0">
              <div className="mx-auto h-6 w-8 animate-pulse rounded bg-slate-100" />
              <div className="mx-auto mt-2 h-3 w-16 animate-pulse rounded bg-slate-50" />
            </div>
          )) : pipelineColumns.map((col, index) => (
            <Link
              key={col.key}
              to={col.to}
              className="group border-r border-slate-50 px-3 py-4 text-center transition hover:bg-slate-50/60 last:border-r-0"
            >
              <p className={`text-2xl font-extrabold ${stageTextColors[index]}`}>{col.count}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600">{col.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 px-5 py-3.5">
            <h2 className="text-[15px] font-bold text-slate-900">Activity Feed</h2>
            <Link to={jobPostingsRoute} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-700">
              View all <FiArrowRight size={11} />
            </Link>
          </div>
          <div>
            {state.loading ? [1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-3.5 border-b border-slate-50 px-5 py-3 last:border-b-0">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="h-2.5 w-48 animate-pulse rounded bg-slate-50" />
                </div>
              </div>
            )) : candidatePool.length > 0 ? candidatePool.slice(0, 6).map((candidate, index) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between gap-3 border-b border-slate-50 px-5 py-3 transition hover:bg-slate-50/50 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${stageBgColors[index % 5]} ${stageTextColors[index % 5]}`}>
                    {(candidate.name || '?')[0].toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{candidate.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{candidate.role} &middot; {candidate.experience}</p>
                  </div>
                </div>
                <StatusPill value={candidate.status} />
              </div>
            )) : (
              <div className="px-5 py-10 text-center">
                <FiUsers className="mx-auto text-slate-300" size={28} />
                <p className="mt-2 text-[13px] font-medium text-slate-400">No candidates in pipeline yet</p>
                <Link to="/portal/hr/jobs?tab=post" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700">
                  <FiPlus size={12} /> Post your first job
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 px-5 py-3.5">
            <h2 className="text-[15px] font-bold text-slate-900">Applicant Pipelines</h2>
            <Link to={applicantHubRoute} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-700">
              View all <FiArrowRight size={11} />
            </Link>
          </div>
          <div>
            {state.loading ? [1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-3.5 border-b border-slate-50 px-5 py-3 last:border-b-0">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="h-2.5 w-40 animate-pulse rounded bg-slate-50" />
                </div>
              </div>
            )) : applicantPipelines.length > 0 ? applicantPipelines.map((applicant) => (
              <Link
                key={applicant.id}
                to={applicant.to}
                className="flex items-center justify-between gap-3 border-b border-slate-50 px-5 py-3 transition hover:bg-slate-50/50 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                    {(applicant.title || '?')[0].toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{applicant.title}</p>
                    <p className="truncate text-[11px] text-slate-400">{applicant.companyName} &middot; {applicant.applicantsCount} applicants</p>
                  </div>
                </div>
                <StatusPill value={applicant.status} />
              </Link>
            )) : (
              <div className="px-5 py-10 text-center">
                <FiUsers className="mx-auto text-slate-300" size={28} />
                <p className="mt-2 text-[13px] font-medium text-slate-400">No applicant pipelines yet</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <FiCalendar size={15} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Upcoming Interviews</h2>
              <p className="text-[11px] text-slate-400">{state.interviews.length > 0 ? `${state.interviews.length} scheduled` : 'None scheduled'}</p>
            </div>
          </div>
          <FeatureGate feature="hr.interview_scheduling" featureLabel="Interview Scheduling" inline>
            <Link to="/portal/hr/interviews" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800">
              <FiPlus size={11} /> Schedule
            </Link>
          </FeatureGate>
        </div>
        <div className="grid sm:grid-cols-2">
          {state.loading ? [1, 2].map((item) => (
            <div key={item} className="flex items-center gap-3.5 border-b border-r border-slate-50 px-5 py-3.5">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-44 animate-pulse rounded bg-slate-50" />
              </div>
            </div>
          )) : state.interviews.slice(0, 4).length > 0 ? state.interviews.slice(0, 4).map((interview, index) => (
            <Link
              key={interview.id || `interview-${index}`}
              to="/portal/hr/interviews"
              className="flex items-center justify-between gap-3 border-b border-r border-slate-50 px-5 py-3.5 transition hover:bg-slate-50/50 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-600">
                  {(pickCandidateName(interview, 'C') || 'C')[0].toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-800">{pickCandidateName(interview, 'Candidate')}</p>
                  <p className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                    <FiClock size={10} className="shrink-0" />
                    {pickCandidateRole(interview, 'Role')} &middot; {formatDateTime(interview.scheduled_at || interview.scheduledAt)}
                  </p>
                </div>
              </div>
              <StatusPill value={interview.status || 'scheduled'} />
            </Link>
          )) : (
            <div className="px-5 py-10 text-center sm:col-span-2">
              <FiCalendar className="mx-auto text-slate-300" size={28} />
              <p className="mt-2 text-[13px] font-medium text-slate-400">No interviews scheduled</p>
              <p className="mt-1 text-[11px] text-slate-400">Schedule interviews from the Candidates page</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HrDashboardPage;
