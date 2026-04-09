import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiActivity,
  FiAlertCircle,
  FiArrowRight,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiChevronLeft,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiStar
} from 'react-icons/fi';
import StatusPill from '../../../shared/components/StatusPill';
import { getCurrentUser } from '../../../utils/auth';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName,
  studentTextareaClassName
} from '../components/StudentExperience';
import {
  applyToJob,
  getCompanyReviews,
  getFriendlyApplyErrorMessage,
  getStudentJobById,
  getStudentSavedJobs,
  removeSavedJobForStudent,
  runAtsCheck,
  saveJobForStudent
} from '../services/studentApi';

const StudentJobDetailsPage = () => {
  const { jobId } = useParams();
  const user = getCurrentUser();
  const jobsListPath = user?.role === 'retired_employee' ? '/portal/retired/jobs' : '/portal/student/jobs';
  const resumeSectionPath = '/portal/student/profile?section=resume';
  const [state, setState] = useState({
    loading: true,
    error: '',
    job: null,
    isSaved: false
  });
  const [coverLetter, setCoverLetter] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '', ctaTo: '', ctaLabel: '' });
  const [atsResult, setAtsResult] = useState(null);
  const [reviews, setReviews] = useState({ summary: null, rows: [] });

  const setActionSuccess = (text) => setActionFeedback({ type: 'success', text, ctaTo: '', ctaLabel: '' });
  const setActionError = (text, ctaTo = '') => setActionFeedback({ type: 'error', text, ctaTo, ctaLabel: ctaTo ? 'Open Resume Section' : '' });
  const setApplyError = (error) => {
    const text = getFriendlyApplyErrorMessage(error);
    const rawMessage = String(error?.message || '');
    const needsResume = /resume is required/i.test(rawMessage) || /profile resume missing/i.test(text);
    setActionError(text, needsResume ? resumeSectionPath : '');
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const [jobResponse, savedResponse] = await Promise.all([
          getStudentJobById(jobId),
          getStudentSavedJobs()
        ]);

        if (!mounted) return;

        const job = jobResponse.data;
        const savedSet = new Set((savedResponse.data || []).map((item) => item.jobId || item.job_id));

        setState({
          loading: false,
          error: job ? '' : 'Job not found.',
          job,
          isSaved: savedSet.has(jobId)
        });

        if (job?.companyName) {
          const reviewResponse = await getCompanyReviews(job.companyName);
          if (!mounted) return;
          setReviews({ summary: reviewResponse.data.summary, rows: reviewResponse.data.reviews || [] });
        }
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || 'Unable to load job details.'
        }));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [jobId]);

  const salaryLabel = useMemo(() => {
    if (!state.job) return '-';
    return `${state.job.minPrice || '-'} - ${state.job.maxPrice || '-'} ${state.job.salaryType || ''}`;
  }, [state.job]);

  const pageStats = useMemo(() => ([
    {
      label: 'Location',
      value: state.job?.jobLocation || 'Remote',
      helper: 'Current work location'
    },
    {
      label: 'Experience',
      value: state.job?.experienceLevel || 'Flexible',
      helper: 'Expected seniority level'
    },
    {
      label: 'Salary',
      value: salaryLabel,
      helper: 'Published compensation range'
    }
  ]), [salaryLabel, state.job?.experienceLevel, state.job?.jobLocation]);

  const handleSaveToggle = async () => {
    if (!state.job) return;
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    if (state.isSaved) {
      try {
        await removeSavedJobForStudent(jobId);
      } catch (error) {
        setActionError(error.message || 'Unable to unsave job.');
        return;
      }
      setState((current) => ({ ...current, isSaved: false }));
      setActionSuccess('Job removed from saved list.');
      return;
    }

    try {
      await saveJobForStudent(jobId);
    } catch (error) {
      if (/already saved/i.test(String(error.message || ''))) {
        setState((current) => ({ ...current, isSaved: true }));
        setActionSuccess('Job saved successfully.');
        return;
      }
      setActionError(error.message || 'Unable to save job.');
      return;
    }

    setState((current) => ({ ...current, isSaved: true }));
    setActionSuccess('Job saved successfully.');
  };

  const handleApply = async () => {
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    try {
      await applyToJob({ jobId, coverLetter });
      setActionSuccess('Application submitted successfully.');
    } catch (error) {
      setApplyError(error);
    }
  };

  const handleAtsCheck = async () => {
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    try {
      const result = await runAtsCheck({ jobId, source: 'profile_resume' });
      setAtsResult(result?.result || null);
      setActionSuccess('ATS check completed.');
    } catch (error) {
      setActionError(error.message || 'Unable to run ATS check.');
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      </div>
    );
  }

  if (!state.job) {
    return (
      <div className="mx-auto max-w-4xl py-16">
        <StudentEmptyState
          icon={FiAlertCircle}
          title="Job not found"
          description={state.error || "The role you're looking for is unavailable right now."}
          action={
            <Link to={jobsListPath} className={studentPrimaryButtonClassName}>
              <FiChevronLeft size={15} />
              Back to Jobs
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <StudentPageShell
      eyebrow="Job Details"
      badge={state.job.companyName}
      title={state.job.jobTitle}
      subtitle="Review the role, check ATS fit, and send an application with a more polished, context-rich flow."
      stats={pageStats}
      actions={
        <>
          <Link to={jobsListPath} className={studentSecondaryButtonClassName}>
            <FiChevronLeft size={15} />
            Back to Jobs
          </Link>
          <button type="button" className={state.isSaved ? studentSecondaryButtonClassName : studentPrimaryButtonClassName} onClick={handleSaveToggle}>
            <FiBookmark className={state.isSaved ? 'fill-current' : ''} size={15} />
            {state.isSaved ? 'Saved' : 'Save Job'}
          </button>
        </>
      }
    >
      {actionFeedback.text ? (
        <StudentNotice
          type={actionFeedback.type}
          text={actionFeedback.text}
          action={actionFeedback.ctaTo ? (
            <Link to={actionFeedback.ctaTo} className={studentSecondaryButtonClassName}>
              {actionFeedback.ctaLabel}
            </Link>
          ) : null}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <StudentSurfaceCard
            eyebrow="Role Snapshot"
            title="Core job information"
            subtitle="A quick read before you decide whether to apply immediately or tune your profile first."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <FiMapPin size={13} />
                  Location
                </p>
                <p className="mt-2 font-semibold text-slate-800">{state.job.jobLocation || 'Not specified'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <FiBriefcase size={13} />
                  Experience
                </p>
                <p className="mt-2 font-semibold text-slate-800">{state.job.experienceLevel || 'Not specified'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <FiClock size={13} />
                  Employment Type
                </p>
                <p className="mt-2 font-semibold text-slate-800">{state.job.employmentType || 'Not specified'}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  <FiDollarSign size={13} />
                  Salary
                </p>
                <p className="mt-2 font-semibold text-emerald-900">{salaryLabel}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(state.job.skills || []).map((skill) => (
                <span key={skill} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
          </StudentSurfaceCard>

          <StudentSurfaceCard
            eyebrow="Description"
            title="What the company needs"
          >
            <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
              {state.job.description || 'No description provided.'}
            </div>
          </StudentSurfaceCard>

          <StudentSurfaceCard
            eyebrow="Apply"
            title="Apply for this position"
            subtitle="Use your platform profile and resume to send a cleaner, recruiter-ready application."
          >
            <div className="space-y-5">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Cover Letter</span>
                <textarea
                  rows={6}
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  placeholder="Introduce yourself, mention your strongest projects, and explain why this role is the right fit."
                  className={studentTextareaClassName}
                />
              </label>

              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                <button type="button" className={studentPrimaryButtonClassName} onClick={handleApply}>
                  <FiArrowRight size={15} />
                  Submit Application
                </button>
                <button type="button" className={studentSecondaryButtonClassName} onClick={handleAtsCheck}>
                  <FiActivity size={15} />
                  ATS Check
                </button>
              </div>
            </div>
          </StudentSurfaceCard>
        </div>

        <div className="space-y-6">
          {atsResult ? (
            <StudentSurfaceCard
              eyebrow="ATS Result"
              title="Resume Match Score"
              subtitle="A quick ATS view of how strongly your current profile resume maps to this role."
            >
              <div className="rounded-[1.8rem] border border-brand-200 bg-brand-50/70 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700">Overall Score</p>
                <p className="mt-3 font-heading text-6xl font-black text-navy">{atsResult.score}</p>
                <p className="mt-2 text-sm text-slate-500">/ 100 fit score</p>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  { label: 'Keywords', value: atsResult.keywordScore },
                  { label: 'Similarity', value: atsResult.similarityScore },
                  { label: 'Format', value: atsResult.formatScore }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">{item.label}</span>
                      <span className="font-bold text-navy">{item.value}/100</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-secondary-500" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {(atsResult.missingKeywords || []).length > 0 ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Missing Keywords</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {atsResult.missingKeywords.slice(0, 6).map((keyword) => (
                      <span key={keyword} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </StudentSurfaceCard>
          ) : (
            <StudentSurfaceCard
              eyebrow="ATS Result"
              title="Check resume fit before you apply"
            >
              <StudentEmptyState
                icon={FiActivity}
                title="No ATS result yet"
                description="Run a quick ATS scan to see whether your current resume language is aligned with this role."
                className="border-none bg-slate-50/80"
              />
            </StudentSurfaceCard>
          )}

          <StudentSurfaceCard
            eyebrow="Company Reviews"
            title="Candidate sentiment"
            subtitle={`Based on ${reviews.summary?.count || 0} review(s) for ${state.job.companyName}.`}
          >
            {reviews.rows.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <span className="text-sm font-semibold text-amber-800">Average rating</span>
                  <span className="inline-flex items-center gap-2 text-lg font-black text-amber-800">
                    <FiStar className="fill-current" />
                    {reviews.summary?.averageRating || '0.0'}
                  </span>
                </div>

                {reviews.rows.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-navy">{review.title || 'Candidate review'}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{review.review}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        <FiStar className="fill-current" />
                        {review.rating}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <StudentEmptyState
                icon={FiStar}
                title="No reviews available yet"
                description="This company has not received candidate reviews in the portal yet."
                className="border-none bg-slate-50/80"
              />
            )}
          </StudentSurfaceCard>
        </div>
      </div>
    </StudentPageShell>
  );
};

export default StudentJobDetailsPage;
