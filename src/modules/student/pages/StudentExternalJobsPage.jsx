import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowUpRight,
  FiBriefcase,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiFilter,
  FiGlobe,
  FiLock,
  FiMapPin,
  FiSearch,
  FiShield,
  FiStar,
  FiTrendingUp,
  FiZap
} from 'react-icons/fi';

import useAuthStore from '../../../core/auth/authStore';
import SectionHeader from '../../../shared/components/SectionHeader';
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

const ExternalJobCard = ({ isAuthenticated, job, onApply, sourceMap }) => {
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

  const previewTags = Array.isArray(job.tags) ? job.tags.slice(0, 3) : [];
  const primaryLabel = isAuthenticated ? `Apply on ${sourceName}` : 'Login to Apply';

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_35%),linear-gradient(135deg,rgba(14,165,233,0.06),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {job.company_logo && !logoError ? (
            <img
              src={job.company_logo}
              alt={job.company_name}
              className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-contain p-1.5"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-white to-slate-100 text-sm font-black text-navy shadow-inner">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{job.company_name}</p>
            <h3 className="mt-1 line-clamp-2 text-sm font-black leading-6 text-navy transition-colors group-hover:text-brand-700">
              {job.job_title}
            </h3>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${sourceColor}`}>
            <FiGlobe size={11} />
            {sourceName}
          </span>
          {job.is_remote ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <FiTrendingUp size={11} />
              Remote
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2.5 text-[12px] text-slate-600">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <FiMapPin size={12} />
            <span className="font-semibold uppercase tracking-[0.14em]">Location</span>
          </div>
          <p className="mt-1 line-clamp-2 font-semibold text-slate-700">{job.job_location || 'Remote'}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <FiBriefcase size={12} />
            <span className="font-semibold uppercase tracking-[0.14em]">Type</span>
          </div>
          <p className="mt-1 line-clamp-1 font-semibold text-slate-700">{job.employment_type || 'Full-time'}</p>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        {job.category ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {job.category}
          </span>
        ) : null}
        {job.experience_level && job.experience_level !== 'Not specified' ? (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            {job.experience_level}
          </span>
        ) : null}
        {salaryText ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            {salaryText}
          </span>
        ) : null}
      </div>

      {previewTags.length > 0 ? (
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          {previewTags.map((tag, index) => (
            <span
              key={`${job.id}-${tag}-${index}`}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500"
            >
              {tag}
            </span>
          ))}
          {Array.isArray(job.tags) && job.tags.length > previewTags.length ? (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400">
              +{job.tags.length - previewTags.length}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 mt-auto pt-5">
        <button
          type="button"
          onClick={() => onApply(job, sourceName)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 px-4 py-3 text-sm font-black text-white shadow-[0_18px_36px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(245,158,11,0.34)]"
        >
          {isAuthenticated ? <FiExternalLink size={14} /> : <FiLock size={14} />}
          {primaryLabel}
        </button>

        <div className="mt-3 flex items-center justify-between gap-3 text-[12px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            {isAuthenticated ? <FiArrowUpRight size={13} /> : <FiShield size={13} />}
            {isAuthenticated ? 'Verified apply destination' : 'Login required before apply'}
          </span>
          <span className="font-semibold text-slate-400">{sourceName}</span>
        </div>
      </div>
    </article>
  );
};

const StudentExternalJobsPage = () => {
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
      helper: 'Official company openings available right now.'
    },
    {
      label: 'Tracked Sources',
      value: formatCount(sources.length),
      helper: 'Career feeds refreshed every 30 minutes.'
    },
    {
      label: 'Remote On Page',
      value: formatCount(jobsState.jobs.filter((job) => job.is_remote).length),
      helper: 'Current visible roles that support remote work.'
    },
    {
      label: isAuthenticated ? 'Apply Access' : 'Apply Gate',
      value: isAuthenticated ? 'Unlocked' : 'Login',
      helper: isAuthenticated ? 'You can continue to company sites instantly.' : 'Candidates must sign in before applying.'
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
    <div className="mx-auto w-full max-w-[1680px] px-4 py-8 md:px-6 xl:px-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,248,235,0.96),rgba(255,255,255,0.94)_48%,rgba(240,249,255,0.92))] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] md:p-8 xl:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,transparent,rgba(255,255,255,0.2))]" />

        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:items-start">
          <div>
            <SectionHeader
              eyebrow="Global Tech Opportunities"
              title="International & Remote Jobs"
              subtitle="A premium live jobs board with official company openings. Roles stay public for discovery, but applying is unlocked only after login, just like major job portals."
            />

            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                <FiCheckCircle size={15} />
                Auto-verified every 30 minutes
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
                <FiZap size={15} />
                Desktop layout now shows 4 cards per row
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                <FiLock size={15} />
                Apply requires login first
              </span>
            </div>

            <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50/90 px-5 py-4 text-sm text-emerald-800 shadow-sm">
              <div className="flex items-start gap-3">
                <FiShield size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Official-source roles only</p>
                  <p className="mt-1 leading-6 text-emerald-700">
                    Every visible card comes from active official company career pages or verified HHH Jobs listings. No demo job cards are shown here.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {topMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
                <p className="mt-3 font-heading text-4xl font-black text-navy">{metric.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">{metric.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)] backdrop-blur xl:p-8">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_auto_auto_auto] xl:items-center">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
              placeholder="Search title, company, keyword..."
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </div>

          <div className="relative">
            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
              placeholder="Location (e.g. Remote, USA)"
              value={filters.location}
              onChange={(event) => updateFilter('location', event.target.value)}
            />
          </div>

          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              className="min-w-[180px] rounded-full border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
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

          <select
            className="min-w-[180px] rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
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

          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-white">
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
                className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
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
          {jobsState.pagination ? (
            <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Live Role Feed</p>
                <h2 className="mt-2 font-heading text-3xl font-black text-navy">
                  {formatCount(jobsState.pagination.total)} verified international jobs
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Showing {formatCount(jobsState.jobs.length)} jobs on this page. Desktop layout is optimized for a 4-card premium grid while still staying responsive on tablet and mobile.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="mt-10 flex w-max items-center gap-4 rounded-full border border-white/70 bg-white/90 px-6 py-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
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
          ) : null}
        </>
      )}
    </div>
  );
};

export default StudentExternalJobsPage;
