import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FiBriefcase,
  FiCheckCircle,
  FiClipboard,
  FiUsers
} from 'react-icons/fi';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import StatusPill from '../../../shared/components/StatusPill';
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
  const totalHires = Number(analytics.pipeline?.hired || 0);

  const compactStats = [
    {
      label: 'Open roles',
      value: Number(analytics.openJobs || analytics.totalJobs || 0),
      helper: 'Live on portal',
      icon: FiBriefcase
    },
    {
      label: 'Applicants',
      value: Number(analytics.totalApplications || 0),
      helper: `${analytics.pipeline?.shortlisted || 0} shortlisted`,
      icon: FiUsers
    },
    {
      label: 'Interviews',
      value: totalInterviews,
      helper: 'Upcoming rounds',
      icon: FiClipboard
    },
    {
      label: 'Hired',
      value: totalHires,
      helper: 'Closed successfully',
      icon: FiCheckCircle
    }
  ];

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

  const pipelineColumns = useMemo(() => {
    const pipeline = analytics.pipeline || { applied: 0, shortlisted: 0, hired: 0 };
    const offerCount = Math.max(0, Number(pipeline.shortlisted || 0) - Number(pipeline.hired || 0));

    return [
      { key: 'applied', label: 'Applied', count: Number(pipeline.applied || 0) },
      { key: 'shortlisted', label: 'Shortlisted', count: Number(pipeline.shortlisted || 0) },
      { key: 'interview', label: 'Interviewing', count: totalInterviews },
      { key: 'offer', label: 'Offered', count: offerCount },
      { key: 'hired', label: 'Hired', count: Number(pipeline.hired || 0) }
    ].map((stage, stageIndex) => ({
      ...stage,
      candidates: candidatePool.filter((candidate, index) => (index + stageIndex) % 2 === 0).slice(0, 3)
    }));
  }, [analytics.pipeline, totalInterviews, candidatePool]);

  const recentApplicants = useMemo(() => {
    return candidatePool.slice(0, 5).map((candidate, index) => ({
      ...candidate,
      id: candidate.id || `recent-${index}`,
      status: candidate.stage || 'applied'
    }));
  }, [candidatePool]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-600">
          {state.error}
        </div>
      ) : null}

      {!isApprovedHr ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 font-semibold text-orange-700">
          Your HR account is pending admin approval. Job posting and team management actions remain restricted until verification is complete.
        </div>
      ) : null}

      <PortalDashboardHero
        compact
        tone="hr"
        eyebrow="HR Dashboard"
        badge={isApprovedHr ? 'Hiring live' : 'Approval pending'}
        title="Run hiring from one clean workspace"
        description="See open roles, candidate activity, and interviews without extra clutter."
        chips={[]}
        primaryAction={{ to: '/portal/hr/jobs/new', label: 'Post New Job' }}
        secondaryAction={{ to: '/portal/hr/candidates', label: 'Review Applicants' }}
        metrics={[
          { label: 'Open roles', value: String(analytics.openJobs || analytics.totalJobs || 0), helper: 'Currently live' },
          { label: 'Applicants', value: String(analytics.totalApplications || 0), helper: 'In pipeline' },
          { label: 'Interviews', value: String(totalInterviews), helper: 'Scheduled' }
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {compactStats.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.label}
              className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-2 font-heading text-3xl font-extrabold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon size={18} />
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid items-start gap-3 md:grid-cols-3">
        <Link
          to="/portal/hr/jobs"
          className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <p className="font-heading text-base font-bold text-navy">Job Postings</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Manage active roles and open new ones fast.</p>
        </Link>
        <Link
          to="/portal/hr/candidates"
          className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <p className="font-heading text-base font-bold text-navy">Applicants</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Review and shortlist candidates without extra steps.</p>
        </Link>
        <Link
          to="/portal/hr/interviews"
          className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <p className="font-heading text-base font-bold text-navy">Interviews</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Keep interview slots and outcomes neatly tracked.</p>
        </Link>
      </div>

      <div className="grid items-start gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-700">Hiring Pipeline</p>
            <h2 className="mt-2 font-heading text-2xl font-extrabold text-slate-900">Candidate flow</h2>
            <p className="mt-1 text-sm text-slate-500">See how applications are moving right now.</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            {pipelineColumns.map((column) => (
              <article
                key={column.key}
                className="min-w-0 rounded-[1.2rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{column.label}</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{column.count}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-navy px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                    {column.count}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {column.candidates.length > 0 ? (
                    column.candidates.map((candidate) => (
                      <div key={candidate.id} className="rounded-xl border border-white bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <p className="truncate text-sm font-semibold text-slate-900">{candidate.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{candidate.role}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex min-h-[96px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 py-4 text-center text-sm font-medium text-slate-500">
                      No candidates yet
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-700">Recent Applicants</p>
              <h2 className="mt-2 font-heading text-2xl font-extrabold text-slate-900">Latest activity</h2>
              <p className="mt-1 text-sm text-slate-500">Fresh profiles entering your hiring flow.</p>
            </div>
            <Link to="/portal/hr/candidates" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              View Candidates
            </Link>
          </div>
          <ul className="space-y-3">
            {recentApplicants.length > 0 ? (
              recentApplicants.map((applicant) => (
                <li key={applicant.id} className="flex items-start justify-between gap-4 rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3.5">
                  <div>
                    <p className="font-semibold text-slate-900">{applicant.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{applicant.role}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {applicant.experience} • {applicant.time}
                    </p>
                  </div>
                  <StatusPill value={applicant.status} />
                </li>
              ))
            ) : (
              <li className="rounded-[1.15rem] border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                No recent applications yet.
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-700">Interview Desk</p>
            <h2 className="mt-2 font-heading text-2xl font-extrabold text-slate-900">Scheduled interviews</h2>
            <p className="mt-1 text-sm text-slate-500">Candidate conversations that need attention.</p>
          </div>
          <Link to="/portal/hr/interviews" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            Open Calendar
          </Link>
        </div>
        <ul className="grid gap-3 xl:grid-cols-2">
          {state.interviews.slice(0, 4).length > 0 ? (
            state.interviews.slice(0, 4).map((interview, index) => (
              <li key={interview.id || `interview-${index}`} className="flex items-start justify-between gap-4 rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3.5">
                <div>
                  <p className="font-semibold text-slate-900">{pickCandidateName(interview, 'Candidate')}</p>
                  <p className="mt-1 text-sm text-slate-500">{pickCandidateRole(interview, 'Role')}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {formatDateTime(interview.scheduled_at || interview.scheduledAt)}
                  </p>
                </div>
                <StatusPill value={interview.status || 'scheduled'} />
              </li>
            ))
          ) : (
            <li className="rounded-[1.15rem] border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500 xl:col-span-2">
              No interviews scheduled right now.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
};

export default HrDashboardPage;
