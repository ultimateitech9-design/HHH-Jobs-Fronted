import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiGlobe,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiTarget
} from 'react-icons/fi';
import { getCurrentUser } from '../../../utils/auth';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  studentGhostButtonClassName,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import { ExternalJobCard } from './StudentExternalJobsPage';
import { getStudentJobs } from '../services/studentApi';
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

const buildCompanySourceKey = (companyName = '') => {
  const normalized = String(companyName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized ? `${normalized}_jobs` : 'hhh_jobs';
};

const mapInternalJobToExternalCard = (job = {}) => ({
  id: job.id || job._id,
  source_key: buildCompanySourceKey(job.companyName),
  company_name: job.companyName || 'HHH Jobs',
  company_logo: job.companyLogo || '',
  job_title: job.jobTitle || 'Open Role',
  is_remote: isRemoteLike(job.jobLocation),
  job_location: job.jobLocation || 'Remote',
  employment_type: job.employmentType || 'Full-time',
  category: job.category || '',
  experience_level: job.experienceLevel || '',
  salary_currency: '',
  salary_min: '',
  salary_max: '',
  tags: Array.isArray(job.skills) ? job.skills : [],
  apply_url: '',
  __kind: 'internal',
  details_id: job.id || job._id
});

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

const StudentJobsPage = ({
  forcedAudience = '',
  eyebrow = 'Student Jobs',
  title = 'Search and Apply Jobs',
  subtitle = 'Filter jobs, save opportunities, and apply directly with profile resume.',
  detailsPathBase = '/portal/student/jobs',
  embedded = false
}) => {
  const navigate = useNavigate();
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
            audience: effectiveAudience
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

  const setActionError = (text, ctaTo = '') => setActionFeedback({ type: 'error', text, ctaTo, ctaLabel: ctaTo ? 'Open Resume Section' : '' });

  const handleExternalApply = (job) => {
    const applyUrl = String(job?.apply_url || '').trim();
    if (!applyUrl) {
      setActionError('Apply link is not available for this job right now.');
      return;
    }

    openApplyDestination(applyUrl);
  };

  const handleCardAction = (job) => {
    if (job?.__kind === 'internal') {
      const detailId = job.details_id || job.id;
      if (detailId) {
        navigate(`${detailsPathBase}/${detailId}`);
      }
      return;
    }

    handleExternalApply(job);
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

      <div className="space-y-4">
        <section className="overflow-hidden rounded-[22px] border border-white/70 bg-white/92 p-2.5 shadow-[0_14px_32px_rgba(15,23,42,0.06)] backdrop-blur xl:p-3">
          <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-[minmax(0,6fr)_minmax(0,2fr)_minmax(132px,1.15fr)_minmax(126px,1.05fr)_max-content] xl:items-center">
            <div className="relative min-w-0 lg:col-span-2 xl:col-span-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                className="h-9 w-full min-w-0 rounded-[14px] border border-slate-200 bg-white px-3 pl-9 text-[13px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="Search jobs or company"
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
              />
            </div>

            <div className="relative min-w-0">
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                className="h-9 w-full min-w-0 rounded-[14px] border border-slate-200 bg-white px-3 pl-9 text-[13px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="Location"
                value={filters.location}
                onChange={(event) => updateFilter('location', event.target.value)}
              />
            </div>

            <div className="relative min-w-0">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                className="h-9 w-full min-w-0 rounded-[14px] border border-slate-200 bg-white py-2 pl-8 pr-3 text-[13px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="Category"
                value={filters.category}
                onChange={(event) => updateFilter('category', event.target.value)}
              />
            </div>

            <div className="relative min-w-0">
              <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <select
                className="h-9 w-full min-w-0 appearance-none rounded-[14px] border border-slate-200 bg-white py-2 pl-8 pr-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                value={filters.source}
                onChange={(event) => updateFilter('source', event.target.value)}
              >
                <option value="">All Sources</option>
                <option value="hhh_jobs">HHH Jobs</option>
                {jobsState.sources.map((source) => (
                  <option key={source.key} value={source.key}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2 lg:col-span-2 xl:col-span-1 xl:justify-end">
              <label className="inline-flex h-9 max-w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-[14px] border border-slate-200 bg-white px-2.5 text-[13px] font-semibold text-slate-700 transition hover:border-brand-300">
                <input
                  type="checkbox"
                  checked={filters.remote}
                  onChange={(event) => updateFilter('remote', event.target.checked)}
                  className="accent-brand-500"
                />
                Remote Only
              </label>

              {hasFilters ? (
                <button
                  type="button"
                  className="inline-flex h-9 w-fit items-center justify-center rounded-[14px] border border-red-200 bg-red-50 px-2.5 text-[13px] font-bold text-red-600 transition hover:bg-red-100"
                  onClick={() => {
                    setFilters(makeDefaultFilters(effectiveAudience));
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {jobsState.loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-52 animate-pulse rounded-[1.45rem] bg-slate-100" />
              ))}
            </div>
          ) : totalJobs > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {paginatedJobs.map((job) => {
                const cardJob = job.__kind === 'external' ? job : mapInternalJobToExternalCard(job);

                return (
                  <ExternalJobCard
                    key={`${cardJob.__kind || 'external'}-${cardJob.id}`}
                    isAuthenticated
                    job={cardJob}
                    onApply={handleCardAction}
                    sourceMap={sourceMap}
                    buttonMode="locked"
                    buttonLabel="Login to Apply"
                  />
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
