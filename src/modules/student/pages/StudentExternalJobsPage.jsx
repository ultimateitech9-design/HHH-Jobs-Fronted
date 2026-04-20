import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowUpRight,
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiFilter,
  FiGlobe,
  FiLock,
  FiMapPin,
  FiSearch,
  FiStar,
  FiTrendingUp
} from 'react-icons/fi';

import useAuthStore from '../../../core/auth/authStore';
import { getExternalJobCategories, getExternalJobSources, getExternalJobs } from '../../platform/services/externalJobsApi';
import { getLoginRedirectState } from '../../common/utils/publicAccess';
import {
  clearExternalApplyIntent,
  isExternalApplyIntentFresh,
  matchesExternalApplyRedirect,
  readExternalApplyIntent,
  saveExternalApplyIntent
} from '../utils/externalApplyIntent';

const SOURCE_COLOR_VARIANTS = [
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-violet-100 text-violet-700 border-violet-200'
];

const makeDefaultFilters = () => ({
  search: '',
  category: '',
  location: '',
  source: '',
  remote: false,
  page: 1,
  limit: 16
});

const formatCount = (value) => Number(value || 0).toLocaleString();

const buildFiltersFromSearchParams = (searchParams) => {
  const defaults = makeDefaultFilters();
  const page = parseInt(searchParams.get('page') || '', 10);
  const limit = parseInt(searchParams.get('limit') || '', 10);
  const remoteValue = String(searchParams.get('remote') || '').trim().toLowerCase();

  return {
    ...defaults,
    search: searchParams.get('search') || searchParams.get('company') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    source: searchParams.get('source') || '',
    remote: remoteValue === 'true' || remoteValue === '1' || remoteValue === 'yes',
    page: Number.isNaN(page) || page < 1 ? defaults.page : page,
    limit: Number.isNaN(limit) || limit < 1 ? defaults.limit : limit
  };
};

const hashSourceKey = (value = '') =>
  Array.from(String(value || '')).reduce((acc, char) => acc + char.charCodeAt(0), 0);

const getSourceColor = (sourceKey) =>
  SOURCE_COLOR_VARIANTS[hashSourceKey(sourceKey) % SOURCE_COLOR_VARIANTS.length] || 'bg-slate-100 text-slate-700 border-slate-200';

const fallbackSourceName = (sourceKey = '') =>
  String(sourceKey || '')
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Verified Source';

const buildCurrentPath = (location) => `${location.pathname || ''}${location.search || ''}${location.hash || ''}`;

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

export const ExternalJobCard = ({
  isAuthenticated,
  job,
  onApply,
  sourceMap,
  buttonMode = 'auto',
  buttonLabel
}) => {
  const sourceColor = getSourceColor(job.source_key);
  const sourceName = sourceMap[job.source_key]?.name || fallbackSourceName(job.source_key);
  const initials = (job.company_name || 'C').charAt(0).toUpperCase();
  const [logoError, setLogoError] = useState(false);

  const salaryText = useMemo(() => {
    if (!job.salary_min && !job.salary_max) return null;

    const currency = job.salary_currency || 'USD';

    if (job.salary_min && job.salary_max) {
      return `${currency} ${Number(job.salary_min).toLocaleString()} - ${Number(job.salary_max).toLocaleString()}`;
    }

    if (job.salary_min) {
      return `${currency} ${Number(job.salary_min).toLocaleString()}+`;
    }

    return `Up to ${currency} ${Number(job.salary_max).toLocaleString()}`;
  }, [job.salary_currency, job.salary_max, job.salary_min]);

  const previewTags = Array.isArray(job.tags) ? job.tags.slice(0, 1) : [];
  const effectiveButtonMode = buttonMode === 'auto'
    ? (isAuthenticated ? 'open' : 'locked')
    : buttonMode;
  const primaryLabel = buttonLabel || (effectiveButtonMode === 'open' ? 'Open Role' : 'Login to Apply');
  const locationText = job.job_location || 'Remote';
  const typeText = job.employment_type || 'Full-time';

  return (
    <article className="group relative flex min-h-[18.75rem] h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_24%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex h-full flex-col rounded-[1.1rem] border border-slate-200/70 bg-white/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="flex min-w-0 items-start gap-3">
          {job.company_logo && !logoError ? (
            <img
              src={job.company_logo}
              alt={job.company_name}
              className="h-11 w-11 shrink-0 rounded-[0.9rem] border border-slate-200 bg-white object-contain p-1.5 shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(145deg,#fff7ed,#ffffff_55%,#e2e8f0)] text-xs font-black text-navy shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${sourceColor}`}>
                <FiGlobe size={9} />
                <span className="truncate">{sourceName}</span>
              </span>
              {job.is_remote ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                  <FiTrendingUp size={8} />
                  Remote
                </span>
              ) : null}
            </div>
            <h3 className="mt-2 line-clamp-3 break-words font-heading text-[1rem] font-black leading-5 text-navy transition-colors group-hover:text-brand-700">
              {job.job_title}
            </h3>
            <p className="mt-1 line-clamp-1 text-[0.8rem] font-semibold text-slate-500">{job.company_name}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-600">
          <div className="min-w-0 rounded-[1rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.8))] px-2.5 py-2">
            <div className="flex items-center gap-1 text-slate-400">
              <FiMapPin size={9} />
              <span className="font-semibold uppercase tracking-[0.1em]">Location</span>
            </div>
            <p className="mt-1 line-clamp-2 break-words text-[11px] font-semibold leading-4 text-slate-700">{locationText}</p>
          </div>

          <div className="min-w-0 rounded-[1rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.8))] px-2.5 py-2">
            <div className="flex items-center gap-1 text-slate-400">
              <FiBriefcase size={9} />
              <span className="font-semibold uppercase tracking-[0.1em]">Type</span>
            </div>
            <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-700">{typeText}</p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {job.category ? (
            <span className="max-w-full truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-semibold text-slate-600">
              {job.category}
            </span>
          ) : null}
          {job.experience_level && job.experience_level !== 'Not specified' ? (
            <span className="max-w-full truncate rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-semibold text-amber-700">
              {job.experience_level}
            </span>
          ) : null}
          {salaryText ? (
            <span className="max-w-full truncate rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">
              {salaryText}
            </span>
          ) : null}
        </div>

        {previewTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {previewTags.map((tag, index) => (
              <span
                key={`${job.id}-${tag}-${index}`}
                className="max-w-full truncate rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-medium text-slate-500"
              >
                {tag}
              </span>
            ))}
            {Array.isArray(job.tags) && job.tags.length > previewTags.length ? (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-medium text-slate-400">
                +{job.tags.length - previewTags.length}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-3">
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => onApply(job, sourceName)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#f59e0b,#ff7a18)] px-3 py-2.5 text-[11px] font-black text-white shadow-[0_12px_24px_rgba(245,158,11,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(245,158,11,0.3)]"
            >
              {effectiveButtonMode === 'open' ? <FiExternalLink size={11} /> : <FiLock size={11} />}
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const StudentExternalJobsPage = ({ embedded = false }) => {
  const { user } = useAuthStore();
  const isAuthenticated = Boolean(user);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [filters, setFilters] = useState(() => buildFiltersFromSearchParams(searchParams));
  const [jobsState, setJobsState] = useState({ jobs: [], pagination: null, loading: true, error: '' });
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [resumeApplyIntent, setResumeApplyIntent] = useState(null);

  const currentPath = useMemo(() => buildCurrentPath(location), [location]);

  useEffect(() => {
    const nextFilters = buildFiltersFromSearchParams(searchParams);
    setFilters((current) => {
      const currentSerialized = JSON.stringify(current);
      const nextSerialized = JSON.stringify(nextFilters);
      return currentSerialized === nextSerialized ? current : nextFilters;
    });
  }, [searchParams, searchParamsKey]);

  useEffect(() => {
    const intent = readExternalApplyIntent();
    if (!intent) return undefined;

    if (!isExternalApplyIntentFresh(intent)) {
      clearExternalApplyIntent();
      return undefined;
    }

    if (!matchesExternalApplyRedirect(intent, currentPath) || !isAuthenticated) {
      return undefined;
    }

    clearExternalApplyIntent();
    setResumeApplyIntent(intent);
    toast.success(`Signed in. Apply is unlocked for ${intent.companyName || 'this role'}.`);
    return undefined;
  }, [currentPath, isAuthenticated]);

  const loadJobs = useCallback(async (currentFilters) => {
    setJobsState((prev) => ({ ...prev, loading: true, error: '' }));
    const response = await getExternalJobs(currentFilters);

    setJobsState({
      jobs: response.data?.jobs || [],
      pagination: response.data?.pagination || null,
      loading: false,
      error: response.error || ''
    });
  }, []);

  useEffect(() => {
    loadJobs(filters);
  }, [filters, loadJobs]);

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      const [categoryResponse, sourceResponse] = await Promise.all([
        getExternalJobCategories(),
        getExternalJobSources()
      ]);

      if (!mounted) return;

      if (!categoryResponse.error) {
        setCategories(categoryResponse.data || []);
      }

      if (!sourceResponse.error) {
        setSources((sourceResponse.data || []).filter((source) => source.is_active));
      }
    };

    loadMeta();

    return () => {
      mounted = false;
    };
  }, []);

  const hasFilters = useMemo(
    () => Boolean(filters.search || filters.category || filters.location || filters.source || filters.remote),
    [filters]
  );

  const sourceMap = useMemo(
    () => Object.fromEntries(sources.map((source) => [source.key, source])),
    [sources]
  );

  const topMetrics = useMemo(() => ([
    {
      label: 'Verified Roles',
      value: formatCount(jobsState.pagination?.total || 0),
      helper: 'Official roles live now.'
    },
    {
      label: 'Tracked Sources',
      value: formatCount(sources.length),
      helper: 'Feeds refreshed every 30 min.'
    },
    {
      label: 'Remote On Page',
      value: formatCount(jobsState.jobs.filter((job) => job.is_remote).length),
      helper: 'Remote roles in current view.'
    },
    {
      label: isAuthenticated ? 'Apply Access' : 'Apply Gate',
      value: isAuthenticated ? 'Unlocked' : 'Login',
      helper: isAuthenticated ? 'Instant company-site apply.' : 'Sign in before applying.'
    }
  ]), [isAuthenticated, jobsState.jobs, jobsState.pagination?.total, sources.length]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters(makeDefaultFilters());
  };

  const handleApply = (job, sourceName) => {
    const applyUrl = String(job?.apply_url || '').trim();

    if (!applyUrl) {
      toast.error('Apply link is not available for this job right now.');
      return;
    }

    if (!isAuthenticated) {
      saveExternalApplyIntent({
        applyUrl,
        companyName: job.company_name,
        jobTitle: job.job_title,
        sourceName,
        redirectPath: currentPath
      });

      toast('Login first to continue your application.');
      navigate('/login', {
        state: getLoginRedirectState(currentPath, 'Login to Apply')
      });
      return;
    }

    setResumeApplyIntent(null);
    openApplyDestination(applyUrl);
  };

  return (
    <div className={embedded ? 'space-y-6 pb-2' : 'mx-auto w-full max-w-[1680px] px-4 py-8 md:px-6 xl:px-8'}>
      <section className="mt-4 overflow-hidden rounded-[22px] border border-white/70 bg-white/92 p-2.5 shadow-[0_14px_32px_rgba(15,23,42,0.06)] backdrop-blur xl:p-3">
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
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
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
              {sources.map((source) => (
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

      {isAuthenticated && resumeApplyIntent?.applyUrl ? (
        <section className="mt-6 rounded-[30px] border border-brand-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.96))] p-5 shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-500">Application Ready</p>
              <h2 className="mt-2 text-2xl font-black text-navy">
                {resumeApplyIntent.jobTitle || 'Continue your application'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You are signed in now. Continue to {resumeApplyIntent.companyName || 'the company'} on the official careers site when you are ready.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const applyUrl = resumeApplyIntent.applyUrl;
                  setResumeApplyIntent(null);
                  openApplyDestination(applyUrl);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_36px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(245,158,11,0.34)]"
              >
                <FiArrowUpRight size={15} />
                Continue Application
              </button>
              <button
                type="button"
                onClick={() => setResumeApplyIntent(null)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {jobsState.error ? (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
          {jobsState.error}
        </div>
      ) : null}

      {jobsState.loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {jobsState.jobs.map((job) => (
              <ExternalJobCard
                key={job.id}
                isAuthenticated={isAuthenticated}
                job={job}
                onApply={handleApply}
                sourceMap={sourceMap}
              />
            ))}
          </div>

          {jobsState.jobs.length === 0 ? (
            <div className="mx-auto mt-10 max-w-xl rounded-[34px] border border-slate-200 bg-white p-12 text-center shadow-[0_24px_50px_rgba(15,23,42,0.06)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <FiStar size={28} />
              </div>
              <h3 className="mt-5 text-2xl font-black text-navy">No jobs match your filters</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Try broadening your search or clearing filters. Fresh verified roles keep flowing in every 30 minutes.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-900"
              >
                Reset Filters
              </button>
            </div>
          ) : null}

          {jobsState.pagination && jobsState.pagination.totalPages > 1 ? (
            <div className="mt-10 flex justify-center">
              <div className="flex w-max items-center gap-4 rounded-full border border-white/70 bg-white/90 px-6 py-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  <FiChevronLeft size={18} />
                </button>

                <span className="min-w-28 text-center text-sm font-bold text-slate-600">
                  Page {filters.page} <span className="mx-1 font-normal text-slate-400">/</span> {jobsState.pagination.totalPages}
                </span>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={filters.page >= jobsState.pagination.totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default StudentExternalJobsPage;
