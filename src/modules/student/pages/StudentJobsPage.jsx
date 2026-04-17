import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiGlobe,
  FiMapPin,
  FiRefreshCw,
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
import { ExternalJobCard } from './StudentExternalJobsPage';
import {
  applyToJob,
  getFriendlyApplyErrorMessage,
  getStudentApplications,
  getStudentJobs,
  getStudentSavedJobs,
  removeSavedJobForStudent,
  saveJobForStudent
} from '../services/studentApi';
import { getExternalJobSources, getExternalJobs } from '../../platform/services/externalJobsApi';

const FEED_PAGE_LIMIT = 50;
const JOBS_PER_PAGE = 9;

const makeDefaultFilters = (audience = '') => ({
  search: '',
  location: '',
  employmentType: '',
  experienceLevel: '',
  category: '',
  source: '',
  remote: false,
  audience
});

const getCompanyInitials = (value = '') =>
  String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'C';

const isRemoteLike = (value = '') => /remote|work from home|wfh/i.test(String(value || ''));

const matchesText = (candidate = '', filterValue = '') => {
  if (!filterValue) return true;
  return String(candidate || '').trim().toLowerCase().includes(String(filterValue || '').trim().toLowerCase());
};

const sourceMapFromList = (sources = []) => ({
  hhh_jobs: { name: 'HHH Jobs' },
  ...Object.fromEntries(sources.map((source) => [source.key, source]))
});

const interleaveJobs = (internalJobs = [], externalJobs = []) => {
  const merged = [];
  const maxLength = Math.max(internalJobs.length, externalJobs.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (internalJobs[index]) merged.push(internalJobs[index]);
    if (externalJobs[index]) merged.push(externalJobs[index]);
  }

  return merged;
};

const fetchAllPages = async (fetcher, filters = {}) => {
  const firstResponse = await fetcher({
    ...filters,
    page: 1,
    limit: FEED_PAGE_LIMIT
  });

  if (firstResponse.error) {
    return {
      jobs: firstResponse.data?.jobs || [],
      error: firstResponse.error || 'Unable to load jobs.'
    };
  }

  const firstJobs = firstResponse.data?.jobs || [];
  const totalPages = Math.max(1, Number(firstResponse.data?.pagination?.totalPages || 1));

  if (totalPages === 1) {
    return { jobs: firstJobs, error: '' };
  }

  const responses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetcher({
        ...filters,
        page: index + 2,
        limit: FEED_PAGE_LIMIT
      })
    )
  );

  const failedResponse = responses.find((response) => response.error);
  if (failedResponse) {
    return {
      jobs: firstJobs,
      error: failedResponse.error || 'Unable to load all jobs.'
    };
  }

  return {
    jobs: [
      ...firstJobs,
      ...responses.flatMap((response) => response.data?.jobs || [])
    ],
    error: ''
  };
};

const openApplyDestination = (url) => {
  if (typeof window === 'undefined' || !url) return;

  const popup = window.open(url, '_blank');
  if (!popup) {
    window.location.assign(url);
    return;
  }

  try {
    popup.opener = null;
  } catch {
    // Ignore cross-origin opener assignment failures.
  }
};

const CompanyLogoBadge = ({ companyLogo, companyName }) => {
  const [logoError, setLogoError] = useState(false);

  if (companyLogo && !logoError) {
    return (
      <img
        src={companyLogo}
        alt={companyName}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-12 w-12 rounded-xl border border-neutral-200 bg-white object-contain p-2 transition-transform group-hover:scale-105"
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-lg font-heading font-bold text-brand-700 transition-transform group-hover:scale-105">
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
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsState, setJobsState] = useState({
    jobs: [],
    loading: true,
    error: '',
    internalCount: 0,
    externalCount: 0,
    sources: []
  });
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '', ctaTo: '', ctaLabel: '' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setFilters(makeDefaultFilters(effectiveAudience));
    setCurrentPage(1);
  }, [effectiveAudience]);

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      setJobsState((current) => ({ ...current, loading: true, error: '' }));

      const isInternalOnly = filters.source === 'hhh_jobs';
      const shouldLoadInternal = !filters.source || isInternalOnly;
      const shouldLoadExternal = !isInternalOnly;

      const [internalResponse, externalResponse, sourcesResponse] = await Promise.all([
        shouldLoadInternal
          ? fetchAllPages(getStudentJobs, {
            search: filters.search,
            location: filters.location,
            category: filters.category,
            audience: effectiveAudience,
            includeUnapproved: true
          })
          : Promise.resolve({ jobs: [], error: '' }),
        shouldLoadExternal
          ? fetchAllPages(getExternalJobs, {
            search: filters.search,
            location: filters.location,
            category: filters.category,
            source: filters.source,
            remote: filters.remote
          })
          : Promise.resolve({ jobs: [], error: '' }),
        getExternalJobSources()
      ]);

      if (!mounted) return;

      const internalJobs = (internalResponse.jobs || [])
        .filter((job) => {
          if (filters.remote && !isRemoteLike(job.jobLocation)) return false;
          if (!matchesText(job.employmentType, filters.employmentType)) return false;
          if (!matchesText(job.experienceLevel, filters.experienceLevel)) return false;
          return true;
        })
        .map((job) => ({ ...job, __kind: 'internal' }));

      const externalJobs = (externalResponse.jobs || [])
        .filter((job) => {
          if (!matchesText(job.employment_type, filters.employmentType)) return false;
          if (!matchesText(job.experience_level, filters.experienceLevel)) return false;
          return true;
        })
        .map((job) => ({ ...job, __kind: 'external' }));

      setJobsState({
        jobs: interleaveJobs(internalJobs, externalJobs),
        loading: false,
        error: internalResponse.error || externalResponse.error || sourcesResponse.error || '',
        internalCount: internalJobs.length,
        externalCount: externalJobs.length,
        sources: (sourcesResponse.data || []).filter((source) => source?.is_active)
      });
    };

    loadJobs();

    return () => {
      mounted = false;
    };
  }, [effectiveAudience, filters, reloadKey]);

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

  useEffect(() => {
    const handleFocus = () => setReloadKey((current) => current + 1);
    const intervalId = window.setInterval(() => {
      setReloadKey((current) => current + 1);
    }, 30000);

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(intervalId);
    };
  }, []);

  const totalJobs = jobsState.jobs.length;
  const totalPages = Math.max(1, Math.ceil(totalJobs / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    return jobsState.jobs.slice(startIndex, startIndex + JOBS_PER_PAGE);
  }, [currentPage, jobsState.jobs]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const sourceMap = useMemo(() => sourceMapFromList(jobsState.sources), [jobsState.sources]);

  const hasFilters = useMemo(
    () => Boolean(
      filters.search
      || filters.location
      || filters.employmentType
      || filters.experienceLevel
      || filters.category
      || filters.source
      || filters.remote
    ),
    [filters]
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
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

  const handleExternalApply = (job) => {
    const applyUrl = String(job?.apply_url || '').trim();
    if (!applyUrl) {
      setActionError('Apply link is not available for this job right now.');
      return;
    }

    openApplyDestination(applyUrl);
  };

  return (
    <StudentPageShell
      showHero={false}
      bodyClassName={embedded ? 'pb-0' : ''}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-700">{eyebrow}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold text-navy">{title}</h1>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600">
              {totalJobs} roles
            </span>
          </div>
          {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={studentSecondaryButtonClassName}
            onClick={() => setReloadKey((current) => current + 1)}
          >
            <FiRefreshCw size={15} />
            Refresh
          </button>
          <Link to="/portal/student/saved-jobs" className={studentSecondaryButtonClassName}>
            <FiBookmark size={15} />
            Saved Jobs
          </Link>
          <Link to="/portal/student/applications" className={studentPrimaryButtonClassName}>
            <FiTarget size={15} />
            Applications
          </Link>
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start xl:grid-cols-[280px_minmax(0,1fr)]">
        <StudentSurfaceCard
          title="Filters"
          subtitle="HR aur scraped dono jobs yahin filter hongi."
          className="lg:sticky lg:top-24"
        >
          <div className="space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`${studentFieldClassName} pl-11`}
                placeholder="Title, company, skill"
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
                placeholder="Employment type"
                value={filters.employmentType}
                onChange={(event) => updateFilter('employmentType', event.target.value)}
              />
            </div>

            <input
              className={studentFieldClassName}
              placeholder="Experience level"
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

            <div className="relative">
              <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className={`${studentFieldClassName} appearance-none pl-11`}
                value={filters.source}
                onChange={(event) => updateFilter('source', event.target.value)}
              >
                <option value="">All sources</option>
                <option value="hhh_jobs">HHH Jobs</option>
                {jobsState.sources.map((source) => (
                  <option key={source.key} value={source.key}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={filters.remote}
                onChange={(event) => updateFilter('remote', event.target.checked)}
                className="accent-brand-500"
              />
              Remote only
            </label>

            {hasFilters ? (
              <button
                type="button"
                className="w-full rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                onClick={() => {
                  setFilters(makeDefaultFilters(effectiveAudience));
                  setCurrentPage(1);
                }}
              >
                Clear All
              </button>
            ) : null}
          </div>
        </StudentSurfaceCard>

        <div className="space-y-4">
          {jobsState.loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-52 animate-pulse rounded-[1.45rem] bg-slate-100" />
              ))}
            </div>
          ) : totalJobs > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {paginatedJobs.map((job) => {
                if (job.__kind === 'external') {
                  return (
                    <ExternalJobCard
                      key={`external-${job.id}`}
                      isAuthenticated
                      job={job}
                      onApply={handleExternalApply}
                      sourceMap={sourceMap}
                    />
                  );
                }

                const jobId = job.id || job._id;
                const isSaved = savedIds.has(jobId);
                const isApplied = appliedIds.has(jobId);
                const isAwaitingApproval = String(job.approvalStatus || '').toLowerCase() === 'pending';

                return (
                  <article
                    className="group relative flex min-h-[18.5rem] h-full flex-col overflow-hidden rounded-[1.15rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-3.5 shadow-[0_12px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] sm:min-h-[20rem]"
                    key={jobId}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,155,23,0.12),transparent_35%),linear-gradient(135deg,rgba(47,83,143,0.05),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />

                    <div className="relative z-10 flex items-start justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CompanyLogoBadge companyLogo={job.companyLogo} companyName={job.companyName} />
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 font-heading text-[0.95rem] font-bold leading-5 text-navy transition-colors group-hover:text-brand-700">
                            {job.jobTitle}
                          </h3>
                          <p className="mt-0.5 truncate text-[0.82rem] font-medium text-slate-500">{job.companyName}</p>
                        </div>
                      </div>

                      <StatusPill value={isAwaitingApproval ? job.approvalStatus : (job.status || 'open')} />
                    </div>

                    <div className="relative z-10 mt-2.5 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-[0.95rem] border border-slate-200 bg-slate-50/90 px-2.5 py-2 text-sm text-slate-600">
                        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                          <FiMapPin size={12} />
                          Location
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-800">{job.jobLocation || 'Remote'}</p>
                      </div>
                      <div className="rounded-[0.95rem] border border-slate-200 bg-slate-50/90 px-2.5 py-2 text-sm text-slate-600">
                        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                          <FiBriefcase size={12} />
                          Experience
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-800">{job.experienceLevel || 'Experience not specified'}</p>
                      </div>
                    </div>

                    <div className="relative z-10 mt-2.5 flex flex-wrap gap-1.5">
                      {job.salaryType ? (
                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">
                          {job.minPrice || '-'} - {job.maxPrice || '-'} {job.salaryType}
                        </span>
                      ) : null}

                      {isAwaitingApproval ? (
                        <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[9px] font-semibold text-amber-700">
                          Awaiting approval
                        </span>
                      ) : null}
                    </div>

                    <div className="relative z-10 mt-2.5 flex flex-wrap gap-1.5">
                      {(job.skills || []).slice(0, 1).map((skill) => (
                        <span key={skill} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-600">
                          {skill}
                        </span>
                      ))}
                      {(job.skills || []).length > 1 ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-400">
                          +{job.skills.length - 1}
                        </span>
                      ) : null}
                    </div>

                    <div className="relative z-10 mt-auto grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3">
                      <Link to={`${detailsPathBase}/${jobId}`} className={`w-full ${studentSecondaryButtonClassName} px-3 py-2 text-[12px]`}>
                        Details
                      </Link>

                      <button
                        type="button"
                        className={`w-full ${isSaved ? `${studentGhostButtonClassName} px-3 py-2 text-[12px]` : `${studentSecondaryButtonClassName} px-3 py-2 text-[12px]`}`}
                        onClick={() => handleSaveToggle(jobId)}
                        aria-label={isSaved ? 'Unsave job' : 'Save job'}
                        title={isSaved ? 'Remove from saved jobs' : 'Save this job'}
                      >
                        <FiBookmark className={isSaved ? 'fill-current' : ''} size={16} />
                        {isSaved ? 'Saved' : 'Save'}
                      </button>

                      <button
                        type="button"
                        className={
                          isApplied
                            ? 'inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-700'
                            : isAwaitingApproval
                              ? 'inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-700'
                              : `w-full ${studentPrimaryButtonClassName} px-3 py-2 text-[12px]`
                        }
                        onClick={() => handleApply(jobId)}
                        disabled={isApplied || isAwaitingApproval}
                      >
                        {isApplied ? (
                          <>
                            <FiCheckCircle size={15} />
                            Applied
                          </>
                        ) : isAwaitingApproval ? 'Pending' : 'Apply'}
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
              description="Try a different search or clear the filters."
              className="py-10"
              action={
                <button
                  type="button"
                  className={studentPrimaryButtonClassName}
                  onClick={() => {
                    setFilters(makeDefaultFilters(effectiveAudience));
                    setCurrentPage(1);
                  }}
                >
                  Reset Filters
                </button>
              }
            />
          )}
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-nowrap sm:gap-4 sm:rounded-full sm:px-6 sm:py-4">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-navy transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => page - 1)}
              aria-label="Previous Page"
            >
              <FiChevronLeft size={18} />
            </button>

            <span className="min-w-24 text-center text-sm font-bold text-slate-600">
              Page {currentPage} <span className="mx-1 font-normal text-slate-400">/</span> {totalPages}
            </span>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-navy transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
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
