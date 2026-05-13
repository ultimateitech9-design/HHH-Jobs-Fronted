import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiZap
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../../../core/notifications/notificationStore';
import { getCurrentUser } from '../../../utils/auth';
import { getExternalJobSources, getExternalJobs } from '../../platform/services/externalJobsApi';
import { ExternalJobCard } from '../pages/StudentExternalJobsPage';
import {
  getStudentJobs,
  getStudentRecommendations,
  sendStudentRecommendationDigest,
  trackStudentRecommendationView
} from '../services/studentApi';

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

const formatGeneratedAt = (value) => {
  if (!value) return 'Updated just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Updated just now';

  return `Updated ${date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  })}`;
};

const RecommendationCard = ({ recommendation, onApply }) => {
  const job = recommendation?.job || {};
  const matchedSkills = recommendation?.gapAnalysis?.matchedSkills || [];
  const missingSkills = recommendation?.gapAnalysis?.missingSkills || [];

  return (
    <article className="relative overflow-hidden rounded-[1.7rem] border border-emerald-100 bg-[linear-gradient(160deg,#ffffff_0%,#f3fbf7_52%,#eefbf4_100%)] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
              <FiZap size={11} />
              Top Match #{recommendation.rankPosition}
            </span>
            {recommendation?.trend?.label ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                <FiTrendingUp size={11} />
                {recommendation.trend.label}
              </span>
            ) : null}
          </div>
          <h3 className="mt-4 text-2xl font-black leading-tight text-navy">{job.jobTitle || 'Recommended role'}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {job.companyName || 'HHH Jobs'}{job.jobLocation ? ` • ${job.jobLocation}` : ''}
          </p>
        </div>

        <div className="shrink-0 rounded-[1.2rem] border border-emerald-200 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Match</p>
          <p className="mt-1 text-3xl font-black text-emerald-600">{recommendation.matchPercent}%</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {recommendation.explanation || 'Strong match based on your profile, activity, and current demand.'}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[1.2rem] border border-slate-200 bg-white/90 p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Why This Job</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(recommendation.whyThisJob || []).slice(0, 3).map((reason, index) => (
              <span
                key={`${job.id || job._id}-why-${index}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50/80 p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-700">Skill Gap</p>
          <p className="mt-2 text-sm font-semibold text-amber-900">
            {missingSkills.length > 0
              ? `Small gap: ${missingSkills.slice(0, 2).join(', ')}`
              : 'You already match the primary skills we detected.'}
          </p>
          {recommendation?.gapAnalysis?.courseSuggestion ? (
            <p className="mt-1 text-xs font-medium text-amber-700">
              Suggestion: {recommendation.gapAnalysis.courseSuggestion}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {matchedSkills.slice(0, 4).map((skill) => (
          <span
            key={`${job.id || job._id}-match-${skill}`}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
        <p className="text-xs font-semibold text-slate-500">
          {recommendation?.collaborative?.summary || 'AI-ranked from your profile, saved jobs, and application patterns.'}
        </p>

        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-900"
        >
          Learn & Apply
          <FiArrowRight size={14} />
        </button>
      </div>
    </article>
  );
};

const StudentMergedJobsFeed = () => {
  const navigate = useNavigate();
  const notifications = useNotificationStore((state) => state.notifications);
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
  const [recommendationState, setRecommendationState] = useState({
    loading: true,
    refreshing: false,
    error: '',
    generatedAt: null,
    recommendations: []
  });

  const recommendationSignal = useMemo(
    () =>
      notifications
        .filter((item) => item?.type === 'job_recommendation')
        .slice(0, 8)
        .map((item) => `${item.id}:${item.created_at || item.createdAt || ''}`)
        .join('|'),
    [notifications]
  );

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

  useEffect(() => {
    let mounted = true;

    const loadRecommendations = async ({ isRefresh = false } = {}) => {
      setRecommendationState((current) => ({
        ...current,
        loading: current.recommendations.length === 0 && !isRefresh,
        refreshing: isRefresh,
        error: ''
      }));

      const response = await getStudentRecommendations({ limit: 10, minMatchPercent: 55 });
      if (!mounted) return;

      setRecommendationState({
        loading: false,
        refreshing: false,
        error: response.error || '',
        generatedAt: response.data?.generatedAt || null,
        recommendations: response.data?.recommendations || []
      });
    };

    loadRecommendations({ isRefresh: recommendationSignal.length > 0 });

    return () => {
      mounted = false;
    };
  }, [recommendationSignal]);

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

  const handleCardAction = (job) => {
    if (job.__kind === 'internal') {
      navigate(`/portal/student/jobs/${job.id}`);
      return;
    }

    openApplyDestination(job.apply_url);
  };

  const handleRecommendationApply = async (recommendation) => {
    const jobId = recommendation?.job?.id || recommendation?.job?._id;
    if (!jobId) return;

    try {
      await trackStudentRecommendationView(jobId, 'homepage_recommendation');
    } catch {
      // Ignore analytics failures so applying is never blocked.
    }

    navigate(`/portal/student/jobs/${jobId}`);
  };

  const handleSendDigest = async () => {
    try {
      const result = await sendStudentRecommendationDigest(5);
      if (result?.queued) {
        toast.success('Your digest has been queued and will reach your email shortly.');
        return;
      }
      if (result?.sent) {
        toast.success('Today’s top matches were emailed to you.');
        return;
      }

      if (result?.reason === 'no_recommendations') {
        toast('No strong matches were available for today’s digest.');
        return;
      }

      toast.error('Email delivery is not configured yet for recommendation digests.');
    } catch (error) {
      toast.error(error.message || 'Unable to send recommendation digest right now.');
    }
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#12385f_42%,#f7fafc_42%,#ffffff_100%)] shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.9fr)]">
          <div className="px-6 py-6 text-white md:px-8 md:py-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/90">
              <FiZap size={12} />
              AI Recommendation Engine
            </span>
            <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight md:text-[2.45rem]">
              Your Top 10 Matches Today
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">
              Jobs are ranked from your profile, saved roles, application history, and what is trending for candidates like you.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSendDigest}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black text-navy transition hover:bg-slate-100"
              >
                Email today&apos;s 5 matches
                <FiArrowRight size={14} />
              </button>
              <span className="text-xs font-semibold text-slate-300">
                {recommendationState.refreshing ? 'Refreshing for new matching jobs...' : formatGeneratedAt(recommendationState.generatedAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] px-6 py-6 md:px-8">
            <div className="grid w-full gap-3 sm:grid-cols-3">
              <div className="rounded-[1.3rem] border border-slate-200 bg-white/90 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Vector Match</p>
                <p className="mt-2 text-2xl font-black text-navy">
                  {recommendationState.recommendations[0]?.vectorSimilarityScore
                    ? `${Math.round(recommendationState.recommendations[0].vectorSimilarityScore)}`
                    : '--'}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">Profile vs job description similarity</p>
              </div>
              <div className="rounded-[1.3rem] border border-slate-200 bg-white/90 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Skill Gaps</p>
                <p className="mt-2 text-2xl font-black text-amber-600">
                  {recommendationState.recommendations[0]?.gapAnalysis?.missingSkills?.length ?? 0}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">Small upskilling nudges highlighted</p>
              </div>
              <div className="rounded-[1.3rem] border border-slate-200 bg-white/90 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Live Feed</p>
                <p className="mt-2 text-2xl font-black text-emerald-600">{recommendationState.recommendations.length}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Current ranked matches on your feed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {recommendationState.error ? (
        <div className="rounded-[1.3rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {recommendationState.error}
        </div>
      ) : null}

      {recommendationState.loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-[1.7rem] bg-slate-100" />
          ))}
        </div>
      ) : recommendationState.recommendations.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {recommendationState.recommendations.map((recommendation) => (
            <RecommendationCard
              key={`${recommendation.job?.id || recommendation.job?._id}-${recommendation.rankPosition}`}
              recommendation={recommendation}
              onApply={() => handleRecommendationApply(recommendation)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.7rem] border border-slate-200 bg-white p-8 text-center shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <FiStar size={24} />
          </div>
          <h3 className="mt-4 text-2xl font-black text-navy">No strong matches yet</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Complete your profile, add skills, and save a few jobs to help the engine rank sharper recommendations.
          </p>
          <button
            type="button"
            onClick={() => navigate('/portal/student/profile')}
            className="mt-5 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-900"
          >
            Complete profile
          </button>
        </div>
      )}

      <section className="space-y-4 rounded-[1.9rem] border border-slate-200 bg-white/95 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] backdrop-blur xl:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black text-navy">Explore More Jobs</h3>
            <p className="mt-1 text-sm text-slate-500">Search HHH Jobs and global listings together when you want to browse wider than your ranked feed.</p>
          </div>
          {recommendationSignal ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              <FiRefreshCw size={11} />
              Real-time matches enabled
            </span>
          ) : null}
        </div>

        <section className="overflow-hidden rounded-[22px] border border-white/70 bg-slate-50/85 p-2.5 xl:p-3">
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
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
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
          <div className="mx-auto mt-2 max-w-xl rounded-[1.6rem] border border-slate-200 bg-white p-10 text-center">
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

              <div className="min-w-[96px] text-center text-[0.95rem] font-bold tracking-[-0.01em] text-navy">
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
      </section>
    </div>
  );
};

export default StudentMergedJobsFeed;
