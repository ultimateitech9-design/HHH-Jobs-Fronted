import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiClock,
  FiExternalLink,
  FiFileText,
  FiMapPin
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { getCurrentUser } from '../../../utils/auth';
import { getLoginRedirectState } from '../../common/utils/publicAccess';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
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
import { buildCompanyLogoUrl } from '../../common/services/companyLogoUrl';
import JobShareMenu from '../../../shared/components/jobs/JobShareMenu';
import JobSocialSeo from '../../../shared/components/jobs/JobSocialSeo';
import JobDescriptionContent from '../../../shared/components/jobs/JobDescriptionContent';
import {
  canApplyExternallyToJob,
  canApplyInternallyToJob,
  getJobExternalApplyUrl
} from '../../../shared/utils/jobApplication';

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
  const routeStateJob = location.state?.job && typeof location.state.job === 'object'
    ? location.state.job
    : null;
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
    if (jobLookupKey !== 'details' || !routeStateJob) return;

    const canonicalPath = buildJobSeoPath(jobsListPath, routeStateJob);
    if (canonicalPath && canonicalPath !== location.pathname) {
      navigate(canonicalPath, {
        replace: true,
        state: { ...location.state, job: routeStateJob }
      });
    }
  }, [jobLookupKey, jobsListPath, location.pathname, location.state, navigate, routeStateJob]);

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
            navigate(canonicalPath, {
              replace: true,
              state: { ...location.state, job }
            });
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
  }, [jobLookupKey, jobsListPath, location.pathname, location.state, navigate, user?.id]);

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
  const canApplyInternally = canApplyInternallyToJob(state.job);
  const canApplyExternally = canApplyExternallyToJob(state.job);
  const externalApplyUrl = getJobExternalApplyUrl(state.job);

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

  const canonicalPath = state.job ? buildJobSeoPath('/jobs', state.job) : '';
  const companyLogoUrl = state.job
    ? buildCompanyLogoUrl(state.job.companyLogo || state.job.company_logo, '', '')
    : '';

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
    <StudentPageShell
      showHero={false}
      bodyClassName={publicMode ? 'vw-shell-wide py-6 sm:py-8' : ''}
    >
      {publicMode ? <JobSocialSeo job={state.job} canonicalPath={canonicalPath} /> : null}

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

      <section className="relative overflow-hidden rounded-lg border border-slate-800 bg-navy text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <div className="h-1 bg-brand-500" />
        <div className="grid gap-7 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-9 lg:py-10">
          <div className="min-w-0">
            <Link to={jobsListPath} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/65 transition hover:text-white">
              <FiChevronLeft size={14} />
              Back to jobs
            </Link>

            <div className="mt-6 flex items-start gap-4 sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-white p-2 shadow-lg sm:h-20 sm:w-20">
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt={`${state.job.companyName || 'Company'} logo`} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-2xl font-black text-navy">{(state.job.companyName || 'H').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase text-brand-300">Private sector opportunity</p>
                <h1 className="mt-2 max-w-4xl font-heading text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  {state.job.jobTitle}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-sm font-bold text-white/70 sm:text-base">
                  <FiBriefcase size={15} />
                  {state.job.companyName || 'Hiring company'}
                </p>
              </div>
            </div>

            <div className="mt-7 grid border-y border-white/15 sm:grid-cols-3">
              {[
                { icon: FiMapPin, label: 'Location', value: state.job.jobLocation || 'Not specified' },
                { icon: FiBriefcase, label: 'Work type', value: state.job.employmentType || 'Not specified' },
                { icon: FaRupeeSign, label: 'Compensation', value: salaryLabel }
              ].map((item) => (
                <div key={item.label} className="border-white/15 py-3 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase text-white/50">
                    <item.icon size={12} />
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col">
            <button
              type="button"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-brand-400 lg:w-full"
              onClick={handleSaveToggle}
            >
              <FiBookmark className={state.isSaved ? 'fill-current' : ''} size={15} />
              {state.isSaved ? 'Saved' : 'Save role'}
            </button>
            <JobShareMenu
              title={`${state.job.jobTitle} at ${state.job.companyName}`}
              text={`Explore ${state.job.jobTitle} at ${state.job.companyName} on HHH Jobs.`}
              url={canonicalPath}
              buttonClassName="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-4 py-2.5 text-sm font-bold text-white transition hover:border-white/50 hover:bg-white/[0.12] lg:w-full"
            />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.65fr)]">
        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <p className="text-[11px] font-black uppercase text-brand-700">About the role</p>
            <h2 className="mt-1 text-2xl font-black text-navy">Job description</h2>
            <p className="mt-2 text-sm text-slate-500">Read the role context, responsibilities, and required capabilities before applying.</p>
          </header>

          <div className="px-5 py-6 sm:px-7 sm:py-7">
            <JobDescriptionContent>
              {state.job.description || 'No description provided.'}
            </JobDescriptionContent>

            {Array.isArray(state.job.skills) && state.job.skills.length ? (
              <section className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="flex items-center gap-2 text-base font-black text-navy">
                  <FiBriefcase className="text-brand-600" size={16} />
                  Skills for this role
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.job.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-8 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">
              {[
                { icon: FiClock, label: 'Experience', value: state.job.experienceLevel || 'Not specified' },
                { icon: FiCalendar, label: 'Posted', value: formatDateTime(state.job.postingDate || state.job.createdAt) || 'Recently' },
                { icon: FiMapPin, label: 'Work location', value: state.job.jobLocation || 'Not specified' },
                { icon: FiFileText, label: 'Employment', value: state.job.employmentType || 'Not specified' }
              ].map((item) => (
                <div key={item.label} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                  <item.icon className="mt-0.5 shrink-0 text-brand-700" size={15} />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">{item.value}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-[96px]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-black uppercase text-brand-700">{hasApplied ? 'Application status' : canApplyExternally && !canApplyInternally ? 'Company application' : 'Your application'}</p>
              <h2 className="mt-1 text-xl font-black text-navy">{hasApplied ? 'Application submitted' : canApplyExternally && !canApplyInternally ? 'Continue on company site' : 'Ready to apply?'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {hasApplied
                  ? 'Track recruiter movement from your application workspace.'
                  : canApplyExternally && !canApplyInternally
                    ? 'The company manages applications for this role on its secure careers page.'
                    : 'Your profile resume will be sent securely to the hiring team.'}
              </p>
            </div>

            <div className="space-y-4 p-5">
              {hasApplied ? (
                <>
                  <div className={`rounded-lg border px-4 py-4 ${applicationStatusTone}`}>
                    <div className="flex items-center gap-2">
                      <FiCheckCircle size={18} />
                      <p className="text-sm font-bold">{applicationStatusLabel}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6">
                      {state.application?.appliedAt || state.application?.createdAt || state.application?.created_at
                        ? `Applied on ${formatDateTime(state.application.appliedAt || state.application.createdAt || state.application.created_at)}`
                        : 'Your application has already been submitted for this role.'}
                    </p>
                  </div>
                  <Link to="/portal/student/applications" className={`${studentPrimaryButtonClassName} w-full px-4 py-2.5 text-[13px]`}>
                    View applications
                    <FiArrowRight size={15} />
                  </Link>
                </>
              ) : canApplyInternally ? (
                <>
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">Message to recruiter</span>
                    <textarea
                      rows={5}
                      value={coverLetter}
                      onChange={(event) => setCoverLetter(event.target.value)}
                      placeholder="Briefly introduce your fit for this role."
                      className={studentTextareaClassName}
                    />
                  </label>
                  <button type="button" className={`${studentPrimaryButtonClassName} w-full px-4 py-3 text-[13px]`} onClick={handleApply}>
                    Apply now
                    <FiArrowRight size={15} />
                  </button>
                </>
              ) : canApplyExternally ? (
                <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <FiExternalLink className="mt-0.5 shrink-0 text-brand-700" size={18} />
                    <div>
                      <p className="text-sm font-black text-navy">Company careers page</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">Your application will be completed directly with {state.job.companyName || 'the hiring company'}.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  The application destination is temporarily unavailable.
                </p>
              )}

              {canApplyExternally ? (
                <a
                  href={externalApplyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${canApplyInternally ? studentSecondaryButtonClassName : studentPrimaryButtonClassName} w-full px-4 py-3 text-[13px]`}
                >
                  Apply on company site
                  <FiExternalLink size={15} />
                </a>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
            <div className="flex gap-3">
              <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-700" size={17} />
              <div>
                <p className="text-sm font-black text-emerald-900">Candidate-first application</p>
                <p className="mt-1 text-xs leading-5 text-emerald-800">HHH Jobs never asks candidates to pay for applying to this role. Verify the company domain before sharing personal information.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </StudentPageShell>
  );
};

export default StudentJobDetailsPage;
