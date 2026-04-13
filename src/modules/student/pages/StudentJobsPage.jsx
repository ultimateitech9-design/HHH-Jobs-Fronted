import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiMapPin,
  FiSearch,
  FiTarget
} from 'react-icons/fi';
import StatusPill from '../../../shared/components/StatusPill';
import { getCurrentUser } from '../../../utils/auth';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentFieldClassName,
  studentGhostButtonClassName,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import {
  applyToJob,
  getFriendlyApplyErrorMessage,
  getStudentApplications,
  getStudentJobs,
  getStudentSavedJobs,
  removeSavedJobForStudent,
  saveJobForStudent
} from '../services/studentApi';

const makeDefaultFilters = (audience = '') => ({
  search: '',
  location: '',
  employmentType: '',
  experienceLevel: '',
  category: '',
  audience,
  page: 1,
  limit: 8
});

const getCompanyInitials = (value = '') =>
  String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'C';

const CompanyLogoBadge = ({ companyLogo, companyName }) => {
  const [logoError, setLogoError] = useState(false);

  if (companyLogo && !logoError) {
    return (
      <img
        src={companyLogo}
        alt={companyName}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-14 w-14 rounded-2xl border border-neutral-200 bg-white object-contain p-2 transition-transform group-hover:scale-105"
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-xl font-heading font-bold text-brand-700 transition-transform group-hover:scale-105">
      {getCompanyInitials(companyName)}
    </div>
  );
};

const StudentJobsPage = ({
  forcedAudience = '',
  eyebrow = 'Student Jobs',
  title = 'Search and Apply Jobs',
  subtitle = 'Filter jobs, save opportunities, and apply directly with profile resume.',
  detailsPathBase = '/portal/student/jobs',
  embedded = false
}) => {
  const resumeSectionPath = '/portal/student/profile?section=resume';
  const currentUser = useMemo(() => getCurrentUser(), []);
  const effectiveAudience = forcedAudience || (currentUser?.role === 'retired_employee' ? 'retired_employee' : '');
  const [filters, setFilters] = useState(() => makeDefaultFilters(effectiveAudience));
  const [jobsState, setJobsState] = useState({ jobs: [], pagination: null, loading: true, error: '' });
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '', ctaTo: '', ctaLabel: '' });

  useEffect(() => {
    setFilters(makeDefaultFilters(effectiveAudience));
  }, [effectiveAudience]);

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      setJobsState((current) => ({ ...current, loading: true, error: '' }));

      const response = await getStudentJobs(filters);
      if (!mounted) return;

      setJobsState({
        jobs: response.data.jobs || [],
        pagination: response.data.pagination,
        loading: false,
        error: response.error || ''
      });
    };

    loadJobs();

    return () => {
      mounted = false;
    };
  }, [filters]);

  useEffect(() => {
    let mounted = true;

    const primeData = async () => {
      const [savedResponse, applicationResponse] = await Promise.all([
        getStudentSavedJobs(),
        getStudentApplications()
      ]);

      if (!mounted) return;

      const nextSaved = new Set((savedResponse.data || []).map((item) => item.jobId || item.job_id));
      const nextApplied = new Set((applicationResponse.data || []).map((item) => item.jobId || item.job_id));

      setSavedIds(nextSaved);
      setAppliedIds(nextApplied);
    };

    primeData();

    return () => {
      mounted = false;
    };
  }, []);

  const hasFilters = useMemo(
    () => Boolean(filters.search || filters.location || filters.employmentType || filters.experienceLevel || filters.category),
    [filters]
  );

  const topStats = useMemo(() => {
    const roles = jobsState.jobs;
    const remoteCount = roles.filter((job) => /remote/i.test(String(job.jobLocation || ''))).length;

    return [
      {
        label: 'Open Roles',
        value: String(jobsState.pagination?.total || roles.length || 0),
        helper: 'Current live opportunities in this search'
      },
      {
        label: 'Saved On Page',
        value: String(roles.filter((job) => savedIds.has(job.id || job._id)).length),
        helper: 'Roles you already shortlisted'
      },
      {
        label: 'Remote Matches',
        value: String(remoteCount),
        helper: 'Visible jobs with remote-friendly location'
      }
    ];
  }, [jobsState.jobs, jobsState.pagination?.total, savedIds]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const setActionSuccess = (text) => setActionFeedback({ type: 'success', text, ctaTo: '', ctaLabel: '' });
  const setActionError = (text, ctaTo = '') => setActionFeedback({ type: 'error', text, ctaTo, ctaLabel: ctaTo ? 'Open Resume Section' : '' });
  const setApplyError = (error) => {
    const text = getFriendlyApplyErrorMessage(error);
    const rawMessage = String(error?.message || '');
    const needsResume = /resume is required/i.test(rawMessage) || /profile resume missing/i.test(text);
    setActionError(text, needsResume ? resumeSectionPath : '');
  };

  const handleSaveToggle = async (jobId) => {
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    if (savedIds.has(jobId)) {
      try {
        await removeSavedJobForStudent(jobId);
      } catch (error) {
        setActionError(error.message || 'Unable to remove saved job.');
        return;
      }

      setSavedIds((current) => {
        const copy = new Set(current);
        copy.delete(jobId);
        return copy;
      });
      setActionSuccess('Removed from saved jobs.');
      return;
    }

    try {
      await saveJobForStudent(jobId);
    } catch (error) {
      if (/already saved/i.test(String(error.message || ''))) {
        setSavedIds((current) => new Set([...current, jobId]));
        setActionSuccess('Job saved successfully.');
        return;
      }
      setActionError(error.message || 'Unable to save job.');
      return;
    }

    setSavedIds((current) => new Set([...current, jobId]));
    setActionSuccess('Job saved successfully.');
  };

  const handleApply = async (jobId) => {
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    if (appliedIds.has(jobId)) {
      setActionError('You already applied for this job.');
      return;
    }

    try {
      await applyToJob({ jobId, coverLetter: '' });
      setAppliedIds((current) => new Set([...current, jobId]));
      setActionSuccess('Application submitted successfully.');
    } catch (error) {
      if (/already applied/i.test(String(error.message || ''))) {
        setAppliedIds((current) => new Set([...current, jobId]));
        setActionError('You already applied for this job.');
        return;
      }

      setApplyError(error);
    }
  };

  return (
    <StudentPageShell
      eyebrow={eyebrow}
      badge={effectiveAudience === 'retired_employee' ? 'Retired talent' : 'Live marketplace'}
      title={title}
      subtitle={subtitle}
      stats={topStats}
      bodyClassName={embedded ? 'pb-0' : ''}
      actions={
        <>
          <Link to="/portal/student/saved-jobs" className={studentSecondaryButtonClassName}>
            <FiBookmark size={15} />
            Saved Jobs
          </Link>
          <Link to="/portal/student/applications" className={studentPrimaryButtonClassName}>
            <FiTarget size={15} />
            View Applications
          </Link>
        </>
      }
    >
      {jobsState.error ? <StudentNotice type="error" text={jobsState.error} /> : null}

      {actionFeedback.text ? (
        <StudentNotice
          type={actionFeedback.type}
          text={actionFeedback.text}
          action={actionFeedback.ctaTo ? (
            <Link to={actionFeedback.ctaTo} className={studentGhostButtonClassName}>
              {actionFeedback.ctaLabel}
            </Link>
          ) : null}
        />
      ) : null}

      <StudentSurfaceCard
        eyebrow="Job Filters"
        title="Refine the opportunity feed"
        subtitle="Use keywords, location, category, and experience filters to reduce noise and surface more relevant roles."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_repeat(3,minmax(0,0.8fr))_auto] xl:items-center">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${studentFieldClassName} pl-11`}
              placeholder="Search by title, company, skill"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </div>

          <div className="relative">
            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${studentFieldClassName} pl-11`}
              placeholder="Location"
              value={filters.location}
              onChange={(event) => updateFilter('location', event.target.value)}
            />
          </div>

          <div className="relative">
            <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${studentFieldClassName} pl-11`}
              placeholder="Employment Type"
              value={filters.employmentType}
              onChange={(event) => updateFilter('employmentType', event.target.value)}
            />
          </div>

          <input
            className={studentFieldClassName}
            placeholder="Experience Level"
            value={filters.experienceLevel}
            onChange={(event) => updateFilter('experienceLevel', event.target.value)}
          />

          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${studentFieldClassName} pl-11`}
              placeholder="Category"
              value={filters.category}
              onChange={(event) => updateFilter('category', event.target.value)}
            />
          </div>

          {hasFilters ? (
            <button
              type="button"
              className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
              onClick={() => setFilters(makeDefaultFilters(effectiveAudience))}
            >
              Clear All
            </button>
          ) : null}
        </div>
      </StudentSurfaceCard>

      {jobsState.loading ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-60 animate-pulse rounded-[1.8rem] bg-slate-100" />
          ))}
        </div>
      ) : jobsState.jobs.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {jobsState.jobs.map((job) => {
            const jobId = job.id || job._id;
            const isSaved = savedIds.has(jobId);
            const isApplied = appliedIds.has(jobId);

            return (
              <article
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_24px_52px_rgba(15,23,42,0.12)]"
                key={jobId}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,155,23,0.12),transparent_35%),linear-gradient(135deg,rgba(47,83,143,0.05),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <CompanyLogoBadge companyLogo={job.companyLogo} companyName={job.companyName} />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-heading text-[1.12rem] font-bold leading-7 text-navy transition-colors group-hover:text-brand-700">
                        {job.jobTitle}
                      </h3>
                      <p className="mt-1 truncate text-[0.92rem] font-medium text-slate-500">{job.companyName}</p>
                    </div>
                  </div>

                  <StatusPill value={job.status || 'open'} />
                </div>

                <div className="relative z-10 mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/90 px-3.5 py-3 text-sm text-slate-600">
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      <FiMapPin size={13} />
                      Location
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-5 text-slate-800">{job.jobLocation || 'Remote'}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/90 px-3.5 py-3 text-sm text-slate-600">
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      <FiBriefcase size={13} />
                      Experience
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-5 text-slate-800">{job.experienceLevel || 'Experience not specified'}</p>
                  </div>
                </div>

                <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                  {job.salaryType ? (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                      {job.minPrice || '-'} - {job.maxPrice || '-'} {job.salaryType}
                    </span>
                  ) : null}

                  {(job.targetAudience || job.audience) && String(job.targetAudience || job.audience).toLowerCase() !== 'all' ? (
                    <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
                      Audience: {String(job.targetAudience || job.audience).replace('_', ' ')}
                    </span>
                  ) : null}
                </div>

                <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                  {(job.skills || []).slice(0, 3).map((skill) => (
                    <span key={skill} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                      {skill}
                    </span>
                  ))}
                  {(job.skills || []).length > 3 ? (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                      +{job.skills.length - 3}
                    </span>
                  ) : null}
                </div>

                <div className="relative z-10 mt-auto grid gap-2 border-t border-slate-100 pt-5 sm:grid-cols-3">
                  <Link to={`${detailsPathBase}/${jobId}`} className={`w-full ${studentSecondaryButtonClassName}`}>
                    Details
                  </Link>

                  <button
                    type="button"
                    className={`w-full ${isSaved ? studentGhostButtonClassName : studentSecondaryButtonClassName}`}
                    onClick={() => handleSaveToggle(jobId)}
                    aria-label={isSaved ? 'Unsave job' : 'Save job'}
                    title={isSaved ? 'Remove from saved jobs' : 'Save this job'}
                  >
                    <FiBookmark className={isSaved ? 'fill-current' : ''} size={16} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>

                  <button
                    type="button"
                    className={isApplied ? 'inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700' : `w-full ${studentPrimaryButtonClassName}`}
                    onClick={() => handleApply(jobId)}
                    disabled={isApplied}
                  >
                    {isApplied ? (
                      <>
                        <FiCheckCircle size={15} />
                        Applied
                      </>
                    ) : 'Apply'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <StudentEmptyState
          icon={FiSearch}
          title="No jobs match your filters"
          description="Try broadening your search, switching location, or clearing filters to surface more opportunities."
          action={
            <button type="button" className={studentPrimaryButtonClassName} onClick={() => setFilters(makeDefaultFilters(effectiveAudience))}>
              Reset Filters
            </button>
          }
        />
      )}

      {jobsState.pagination && jobsState.pagination.totalPages > 1 ? (
        <div className="flex justify-center">
          <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-navy transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={jobsState.pagination.page <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              aria-label="Previous Page"
            >
              <FiChevronLeft size={18} />
            </button>

            <span className="min-w-24 text-center text-sm font-bold text-slate-600">
              Page {jobsState.pagination.page} <span className="mx-1 font-normal text-slate-400">/</span> {jobsState.pagination.totalPages}
            </span>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-navy transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={jobsState.pagination.page >= jobsState.pagination.totalPages}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              aria-label="Next Page"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </StudentPageShell>
  );
};

export default StudentJobsPage;
