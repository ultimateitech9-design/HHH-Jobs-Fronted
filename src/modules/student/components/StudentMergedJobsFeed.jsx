import { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiFilter, FiMapPin, FiSearch, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { ExternalJobCard } from '../pages/StudentExternalJobsPage';
import { getExternalJobSources, getExternalJobs } from '../../platform/services/externalJobsApi';
import { getStudentJobs } from '../services/studentApi';
import { getCurrentUser } from '../../../utils/auth';

const FEED_PAGE_LIMIT = 50;
const JOBS_PER_PAGE = 12;

const makeDefaultFilters = () => ({
  search: '',
  location: '',
  category: '',
  source: '',
  remote: false
});

const sourceMapFromList = (sources = []) => ({
  hhh_jobs: { name: 'HHH Jobs' },
  ...Object.fromEntries(sources.map((source) => [source.key, source]))
});

const isRemoteLike = (value = '') => /remote|work from home|wfh/i.test(String(value || ''));

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

const interleaveJobs = (internalJobs = [], externalJobs = []) => {
  const merged = [];
  const maxLength = Math.max(internalJobs.length, externalJobs.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (internalJobs[index]) merged.push(internalJobs[index]);
    if (externalJobs[index]) merged.push(externalJobs[index]);
  }

  return merged;
};

const mapInternalJobToMarketplaceCard = (job = {}) => ({
  id: job.id || job._id,
  source_key: 'hhh_jobs',
  company_name: job.companyName || 'HHH Jobs',
  company_logo: job.companyLogo || '',
  job_title: job.jobTitle || 'Job opening',
  is_remote: isRemoteLike(job.jobLocation),
  job_location: job.jobLocation || 'India',
  employment_type: job.employmentType || 'Full-time',
  category: job.category || '',
  experience_level: job.experienceLevel || '',
  salary_currency: '',
  salary_min: '',
  salary_max: '',
  tags: Array.isArray(job.skills) ? job.skills : [],
  apply_url: '',
  __kind: 'internal'
});

const getUniqueCategories = (internalJobs = [], externalJobs = []) => {
  const values = new Set();

  [...internalJobs, ...externalJobs].forEach((job) => {
    const categoryValue = job?.category || job?.category_name || '';
    if (String(categoryValue || '').trim()) {
      values.add(String(categoryValue).trim());
    }
  });

  return Array.from(values).sort((a, b) => a.localeCompare(b));
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

const StudentMergedJobsFeed = () => {
  const navigate = useNavigate();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const effectiveAudience = currentUser?.role === 'retired_employee' ? 'retired_employee' : '';
  const [filters, setFilters] = useState(makeDefaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [state, setState] = useState({
    loading: true,
    error: '',
    internalJobs: [],
    externalJobs: [],
    sources: []
  });

  useEffect(() => {
    let mounted = true;

    const loadMergedJobs = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

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
            remote: filters.remote,
            source: filters.source
          })
          : Promise.resolve({ jobs: [], error: '' }),
        getExternalJobSources()
      ]);

      if (!mounted) return;

      const internalJobs = (internalResponse.jobs || []).filter((job) => {
        if (!filters.remote) return true;
        return isRemoteLike(job.jobLocation);
      });

      setState({
        loading: false,
        error: internalResponse.error || externalResponse.error || sourcesResponse.error || '',
        internalJobs,
        externalJobs: externalResponse.jobs || [],
        sources: (sourcesResponse.data || []).filter((source) => source?.is_active)
      });
    };

    loadMergedJobs();

    return () => {
      mounted = false;
    };
  }, [effectiveAudience, filters]);

  const sourceMap = useMemo(() => sourceMapFromList(state.sources), [state.sources]);
  const categoryOptions = useMemo(
    () => getUniqueCategories(state.internalJobs, state.externalJobs),
    [state.externalJobs, state.internalJobs]
  );

  const mergedJobs = useMemo(() => {
    const internalCards = state.internalJobs.map(mapInternalJobToMarketplaceCard);
    return interleaveJobs(internalCards, state.externalJobs);
  }, [state.externalJobs, state.internalJobs]);

  const totalJobs = mergedJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalJobs / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    return mergedJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);
  }, [currentPage, mergedJobs]);
  const visibleStart = totalJobs === 0 ? 0 : ((currentPage - 1) * JOBS_PER_PAGE) + 1;
  const visibleEnd = Math.min(currentPage * JOBS_PER_PAGE, totalJobs);

  const hasFilters = useMemo(
    () => Boolean(filters.search || filters.location || filters.category || filters.source || filters.remote),
    [filters]
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(makeDefaultFilters());
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleCardAction = (job, sourceName) => {
    if (job.__kind === 'internal') {
      navigate(`/portal/student/jobs/${job.id}`);
      return;
    }

    openApplyDestination(job.apply_url);
  };

  return (
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
            <select
              className="h-9 w-full min-w-0 rounded-[14px] border border-slate-200 bg-white py-2 pl-8 pr-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={filters.category}
              onChange={(event) => updateFilter('category', event.target.value)}
            >
              <option value="">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-0">
            <select
              className="h-9 w-full min-w-0 rounded-[14px] border border-slate-200 bg-white px-3 pr-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={filters.source}
              onChange={(event) => updateFilter('source', event.target.value)}
            >
              <option value="">All Sources</option>
              <option value="hhh_jobs">HHH Jobs</option>
              {state.sources.map((source) => (
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
                onClick={resetFilters}
                className="inline-flex h-9 w-fit items-center justify-center rounded-[14px] border border-red-200 bg-red-50 px-2.5 text-[13px] font-bold text-red-600 transition hover:bg-red-100"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {state.error ? (
        <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {state.error}
        </div>
      ) : null}

      {!state.loading ? (
        <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          Showing {visibleStart}-{visibleEnd} of {totalJobs} jobs.
        </div>
      ) : null}

      {state.loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-[1.2rem] bg-slate-100" />
          ))}
        </div>
      ) : totalJobs > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {paginatedJobs.map((job) => (
            <ExternalJobCard
              key={`${job.__kind || 'external'}-${job.id}`}
              isAuthenticated
              job={job}
              onApply={handleCardAction}
              sourceMap={sourceMap}
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-2 max-w-xl rounded-[1.6rem] border border-slate-200 bg-white p-10 text-center shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <FiStar size={24} />
          </div>
          <h3 className="mt-4 text-2xl font-black text-navy">No jobs match your filters</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Try broadening search or clearing filters to bring back HHH Jobs and global roles together.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-900"
          >
            Reset Filters
          </button>
        </div>
      )}

      {!state.loading && totalPages > 1 ? (
        <div className="flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <FiChevronLeft size={14} />
          </button>

          <div className="min-w-[96px] text-center text-[0.95rem] font-extrabold tracking-[-0.01em] text-navy">
            Page {currentPage} <span className="mx-1 font-medium text-slate-400">/</span> {totalPages}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <FiChevronRight size={14} />
          </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentMergedJobsFeed;
