import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookmark,
  FiCheckCircle,
  FiChevronLeft,
  FiClock,
  FiMapPin
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { getCurrentUser } from '../../../utils/auth';
import { getLoginRedirectState } from '../../common/utils/publicAccess';
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
  formatDateTime,
  getFriendlyApplyErrorMessage,
  getStudentApplications,
  getStudentJobById,
  getStudentSavedJobs,
  removeSavedJobForStudent,
  saveJobForStudent
} from '../services/studentApi';
import { buildJobSeoPath, extractUuidFromSlug } from '../../../shared/utils/seoRoutes';

const buildCurrentPath = (location) => `${location.pathname || ''}${location.search || ''}${location.hash || ''}`;

const emptyActionFeedback = () => ({ type: '', text: '', ctaTo: '', ctaLabel: '', ctaState: null });
const formatSalaryAmount = (value) => {
  const text = String(value || '').trim();
  if (!text) return '-';
  if (text.startsWith('₹')) return text;
  const number = Number(text.replace(/,/g, ''));
  return Number.isFinite(number) ? `₹${number.toLocaleString('en-IN')}` : `₹${text}`;
};

const StudentJobDetailsPage = ({ publicMode = false }) => {
  const { jobId: jobParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const jobLookupKey = String(jobParam || '').trim();
  const user = getCurrentUser();
  const currentPath = useMemo(() => buildCurrentPath(location), [location]);
  const jobsListPath = publicMode && !user
    ? '/jobs'
    : user?.role === 'retired_employee'
      ? '/portal/retired/jobs'
      : '/portal/student/jobs';
  const resumeSectionPath = '/portal/student/profile?section=resume';
  const [state, setState] = useState({
    loading: true,
    error: '',
    job: null,
    isSaved: false,
    application: null
  });
  const [coverLetter, setCoverLetter] = useState('');
  const [actionFeedback, setActionFeedback] = useState(emptyActionFeedback);

  const setActionSuccess = (text) => setActionFeedback({ type: 'success', text, ctaTo: '', ctaLabel: '', ctaState: null });
  const setActionError = (text, ctaTo = '', ctaLabel = '', ctaState = null) => {
    setActionFeedback({
      type: 'error',
      text,
      ctaTo,
      ctaLabel: ctaLabel || (ctaTo ? 'Open Resume Section' : ''),
      ctaState
    });
  };
  const requireCandidateLogin = (ctaLabel = 'Login to Apply') => {
    setActionError(
      'Login first to continue with this job.',
      '/login',
      ctaLabel,
      getLoginRedirectState(currentPath, ctaLabel)
    );
  };
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
        const savedJobsRequest = user?.id
          ? getStudentSavedJobs()
          : Promise.resolve({ data: [], error: '' });
        const applicationsRequest = user?.id
          ? getStudentApplications()
          : Promise.resolve({ data: [], error: '' });

        const [jobResponse, savedResponse, applicationsResponse] = await Promise.all([
          getStudentJobById(jobLookupKey),
          savedJobsRequest,
          applicationsRequest
        ]);

        if (!mounted) return;

        const job = jobResponse.data;
        if (job) {
          const canonicalPath = buildJobSeoPath(jobsListPath, job);
          if (canonicalPath && location.pathname !== canonicalPath) {
            navigate(canonicalPath, { replace: true });
          }
        }

        const savedSet = new Set((savedResponse.data || []).map((item) => item.jobId || item.job_id));
        const resolvedLoadedJobId = job?.id || job?._id || jobLookupKey;
        const matchedApplication = (applicationsResponse.data || []).find((item) =>
          String(item.jobId || item.job_id || item.job?.id || '') === String(resolvedLoadedJobId)
        ) || null;

        setState({
          loading: false,
          error: job ? '' : 'Job not found.',
          job,
          isSaved: savedSet.has(resolvedLoadedJobId),
          application: matchedApplication
        });
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
  }, [jobLookupKey, jobsListPath, location.pathname, navigate, user?.id]);

  const resolvedJobId = state.job?.id || state.job?._id || extractUuidFromSlug(jobLookupKey);

  const salaryLabel = useMemo(() => {
    if (!state.job) return '-';
    const minSalary = state.job.minPrice ? formatSalaryAmount(state.job.minPrice) : '';
    const maxSalary = state.job.maxPrice ? formatSalaryAmount(state.job.maxPrice) : '';
    const salaryRange = minSalary && maxSalary ? `${minSalary} - ${maxSalary}` : minSalary || maxSalary || '-';
    return `${salaryRange} ${state.job.salaryType || ''}`.trim();
  }, [state.job]);

  const applicationStatus = String(state.application?.status || '').toLowerCase();
  const hasApplied = Boolean(state.application);

  const applicationStatusLabel = useMemo(() => {
    if (!applicationStatus) return 'Applied';
    if (applicationStatus === 'interview_scheduled') return 'Interview Scheduled';
    return applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1);
  }, [applicationStatus]);

  const applicationStatusTone = useMemo(() => {
    switch (applicationStatus) {
      case 'shortlisted':
        return 'border-indigo-200 bg-indigo-50 text-indigo-700';
      case 'interview_scheduled':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'interviewed':
        return 'border-violet-200 bg-violet-50 text-violet-700';
      case 'offered':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'hired':
        return 'border-teal-200 bg-teal-50 text-teal-700';
      case 'rejected':
        return 'border-red-200 bg-red-50 text-red-700';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }
  }, [applicationStatus]);

  const handleSaveToggle = async () => {
    if (!state.job) return;
    setActionFeedback(emptyActionFeedback());

    if (!user?.id) {
      requireCandidateLogin('Login to Save');
      return;
    }

    if (state.isSaved) {
      try {
        await removeSavedJobForStudent(resolvedJobId);
      } catch (error) {
        setActionError(error.message || 'Unable to unsave job.');
        return;
      }
      setState((current) => ({ ...current, isSaved: false }));
      setActionSuccess('Job removed from saved list.');
      return;
    }

    try {
      await saveJobForStudent(resolvedJobId);
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
    setActionFeedback(emptyActionFeedback());

    if (!user?.id) {
      requireCandidateLogin('Login to Apply');
      return;
    }

    if (hasApplied) {
      setActionSuccess('You already applied for this job.');
      return;
    }

    try {
      const application = await applyToJob({ jobId: resolvedJobId, coverLetter });
      setState((current) => ({
        ...current,
        application: application || {
          jobId: resolvedJobId,
          status: 'applied',
          appliedAt: new Date().toISOString()
        }
      }));
      setActionSuccess('Application submitted successfully.');
    } catch (error) {
      setApplyError(error);
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
      <div className="vw-shell py-16">
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
    <StudentPageShell showHero={false}>
      {actionFeedback.text ? (
        <StudentNotice
          type={actionFeedback.type}
          text={actionFeedback.text}
          action={actionFeedback.ctaTo ? (
            <Link
              to={actionFeedback.ctaTo}
              state={actionFeedback.ctaState || undefined}
              className={`${studentSecondaryButtonClassName} px-4 py-2 text-[13px]`}
            >
              {actionFeedback.ctaLabel}
            </Link>
          ) : null}
        />
      ) : null}

      <StudentSurfaceCard
        eyebrow="Job Details"
        title={state.job.jobTitle}
        subtitle={state.job.companyName}
        className="p-5 xl:p-6"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link to={jobsListPath} className={`${studentSecondaryButtonClassName} px-4 py-2.5 text-[13px]`}>
              <FiChevronLeft size={15} />
              Back
            </Link>
            <button
              type="button"
              className={`${state.isSaved ? studentSecondaryButtonClassName : studentPrimaryButtonClassName} px-4 py-2.5 text-[13px]`}
              onClick={handleSaveToggle}
            >
              <FiBookmark className={state.isSaved ? 'fill-current' : ''} size={15} />
              {state.isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              <FiMapPin size={13} />
              Location
            </p>
            <p className="mt-2 font-semibold text-slate-800">{state.job.jobLocation || 'Not specified'}</p>
          </div>
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              <FiClock size={13} />
              Employment Type
            </p>
            <p className="mt-2 font-semibold text-slate-800">{state.job.employmentType || 'Not specified'}</p>
          </div>
          <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50/80 px-3 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              <FaRupeeSign size={12} />
              Salary
            </p>
            <p className="mt-2 font-semibold text-emerald-900">{salaryLabel}</p>
          </div>
        </div>

        {(state.job.skills || []).length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {(state.job.skills || []).map((skill) => (
              <span key={skill} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {skill}
              </span>
            ))}
          </div>
        ) : null}
      </StudentSurfaceCard>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <StudentSurfaceCard
          eyebrow="About Role"
          title="Job description"
          className="p-5 xl:p-6"
        >
          <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
            {state.job.description || 'No description provided.'}
          </div>
        </StudentSurfaceCard>

        <StudentSurfaceCard
          eyebrow={hasApplied ? 'Application Status' : 'Apply'}
          title={hasApplied ? 'You already applied' : 'Send your application'}
          subtitle={hasApplied ? 'This role is already in your application pipeline.' : 'Use your profile resume and add a short message if needed.'}
          className="p-5 xl:p-6"
        >
          {hasApplied ? (
            <div className="space-y-4">
              <div className={`rounded-[1rem] border px-4 py-4 ${applicationStatusTone}`}>
                <div className="flex items-center gap-2">
                  <FiCheckCircle size={18} />
                  <p className="text-sm font-bold">{applicationStatusLabel}</p>
                </div>
                <p className="mt-2 text-sm">
                  {state.application?.appliedAt || state.application?.createdAt || state.application?.created_at
                    ? `Applied on ${formatDateTime(state.application.appliedAt || state.application.createdAt || state.application.created_at)}`
                    : 'Your application has already been submitted for this role.'}
                </p>
              </div>

              <div className="grid gap-2">
                <Link to="/portal/student/applications" className={`${studentPrimaryButtonClassName} w-full px-4 py-2.5 text-[13px]`}>
                  <FiArrowRight size={15} />
                  View applications
                </Link>
                <button type="button" className={`${studentSecondaryButtonClassName} w-full px-4 py-2.5 text-[13px]`} onClick={handleSaveToggle}>
                  <FiBookmark className={state.isSaved ? 'fill-current' : ''} size={15} />
                  {state.isSaved ? 'Saved' : 'Save for later'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Cover letter</span>
                <textarea
                  rows={5}
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  placeholder="Write a short message for the recruiter."
                  className={studentTextareaClassName}
                />
              </label>

              <div className="grid gap-2">
                <button type="button" className={`${studentPrimaryButtonClassName} w-full px-4 py-2.5 text-[13px]`} onClick={handleApply}>
                  <FiArrowRight size={15} />
                  Apply now
                </button>
                <button type="button" className={`${studentSecondaryButtonClassName} w-full px-4 py-2.5 text-[13px]`} onClick={handleSaveToggle}>
                  <FiBookmark className={state.isSaved ? 'fill-current' : ''} size={15} />
                  {state.isSaved ? 'Saved' : 'Save for later'}
                </button>
              </div>
            </div>
          )}
        </StudentSurfaceCard>
      </div>
    </StudentPageShell>
  );
};

export default StudentJobDetailsPage;
