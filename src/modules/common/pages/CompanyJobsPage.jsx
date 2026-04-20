import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiBriefcase,
  FiCheckCircle,
  FiExternalLink,
  FiLayers,
  FiLock,
  FiMapPin,
  FiSearch,
  FiShield,
  FiStar,
  FiTrendingUp
} from 'react-icons/fi';

import useAuthStore from '../../../core/auth/authStore';
import SectionHeader from '../../../shared/components/SectionHeader';
import { normalizeRole } from '../../../utils/auth';
import { getPublicCompanyDetail } from '../services/companyDirectoryApi';
import { getLoginRedirectState, shouldLockJobBoards } from '../utils/publicAccess';
import {
  clearCompanyJobIntent,
  isCompanyJobIntentFresh,
  matchesCompanyJobRedirect,
  readCompanyJobIntent,
  saveCompanyJobIntent
} from '../utils/companyJobIntent';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Jobs' },
  { key: 'portal', label: 'Portal Jobs' },
  { key: 'external', label: 'Live Fetched' },
  { key: 'remote', label: 'Remote Roles' }
];

const SOURCE_COLOR_VARIANTS = [
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-violet-100 text-violet-700 border-violet-200'
];

const formatCount = (value) => Number(value || 0).toLocaleString();
const getInitials = (value = '') =>
  String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CO';
const buildCurrentPath = (location) =>
  `${location.pathname || ''}${location.search || ''}${location.hash || ''}`;
const isCandidateRole = (role) =>
  ['student', 'retired_employee'].includes(normalizeRole(role));
const getPortalJobPathByRole = (role, jobId) =>
  normalizeRole(role) === 'retired_employee'
    ? `/portal/retired/jobs/${jobId}`
    : `/portal/student/jobs/${jobId}`;
const hashSourceKey = (value = '') =>
  Array.from(String(value || '')).reduce((acc, char) => acc + char.charCodeAt(0), 0);
const getSourceColor = (sourceKey) =>
  SOURCE_COLOR_VARIANTS[hashSourceKey(sourceKey) % SOURCE_COLOR_VARIANTS.length] ||
  'bg-slate-100 text-slate-700 border-slate-200';
const formatSourceName = (value = '') =>
  String(value || '')
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Verified Source';

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
    // Ignore opener assignment failures.
  }
};

const formatPortalSalary = (job) => {
  const minValue = String(job.minPrice || '').trim();
  const maxValue = String(job.maxPrice || '').trim();
  const salaryType = String(job.salaryType || '').trim();
  if (!minValue && !maxValue) return '';
  if (minValue && maxValue) {
    return `${minValue} - ${maxValue}${salaryType ? ` / ${salaryType}` : ''}`;
  }
  return `${maxValue || minValue}${salaryType ? ` / ${salaryType}` : ''}`;
};

const formatExternalSalary = (job) => {
  const currency = String(job.salaryCurrency || 'USD').trim();
  const minValue = Number(job.salaryMin || 0);
  const maxValue = Number(job.salaryMax || 0);
  if (!minValue && !maxValue) return '';
  if (minValue && maxValue) {
    return `${currency} ${minValue.toLocaleString()} - ${maxValue.toLocaleString()}`;
  }
  return `${currency} ${(maxValue || minValue).toLocaleString()}${minValue && !maxValue ? '+' : ''}`;
};

const buildUnifiedJobs = (jobs = {}) => {
  const portalJobs = (jobs.portal || []).map((job) => ({
    id: job.id,
    portalJobId: job.id,
    sourceType: 'portal',
    sourceKey: 'portal',
    sourceLabel: 'HHH Jobs Portal',
    jobTitle: job.jobTitle,
    companyName: job.companyName,
    companyLogo: job.companyLogo,
    jobLocation: job.jobLocation,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    category: job.category,
    tags: Array.isArray(job.skills)
      ? job.skills.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4)
      : [],
    isRemote: /remote/i.test(String(job.jobLocation || '')),
    salaryText: formatPortalSalary(job),
    isFeatured: Boolean(job.isFeatured),
    postedAt: job.postingDate || job.createdAt || ''
  }));
  const externalJobs = (jobs.external || []).map((job) => ({
    id: job.id,
    sourceType: 'external',
    sourceKey: job.sourceKey,
    sourceLabel: formatSourceName(job.sourceKey),
    jobTitle: job.jobTitle,
    companyName: job.companyName,
    companyLogo: job.companyLogo,
    jobLocation: job.jobLocation,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    category: job.category,
    tags: Array.isArray(job.tags) ? job.tags.slice(0, 4) : [],
    isRemote: Boolean(job.isRemote),
    salaryText: formatExternalSalary(job),
    isFeatured: false,
    applyUrl: job.applyUrl,
    postedAt: job.postedAt || job.createdAt || ''
  }));

  return [...portalJobs, ...externalJobs].sort((left, right) => {
    if (Number(right.isFeatured) !== Number(left.isFeatured)) {
      return Number(right.isFeatured) - Number(left.isFeatured);
    }
    return new Date(right.postedAt || 0).getTime() - new Date(left.postedAt || 0).getTime();
  });
};

const CompanyJobCard = ({ canOpenPortalJobs, isAuthenticated, job, onAction }) => {
  const initials = getInitials(job.companyName);
  const sourceColor =
    job.sourceType === 'portal'
      ? 'bg-navy/10 text-navy border-navy/10'
      : getSourceColor(job.sourceKey);
  let primaryLabel = 'Login to View Job';
  if (job.sourceType === 'external') primaryLabel = isAuthenticated ? `Apply on ${job.sourceLabel}` : 'Login to Apply';
  else if (isAuthenticated && canOpenPortalJobs) primaryLabel = 'Open Portal Job';
  else if (isAuthenticated) primaryLabel = 'Candidate Access Only';

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_34%),linear-gradient(135deg,rgba(14,165,233,0.06),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.companyName}
              className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-contain p-1.5"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-white to-slate-100 text-sm font-black text-navy shadow-inner">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {job.companyName}
            </p>
            <h3 className="mt-1 line-clamp-2 text-sm font-black leading-6 text-navy">
              {job.jobTitle}
            </h3>
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${sourceColor}`}
        >
          {job.sourceType === 'portal' ? <FiBriefcase size={11} /> : <FiTrendingUp size={11} />}
          {job.sourceLabel}
        </div>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2.5 text-[12px] text-slate-600">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <FiMapPin size={12} />
            <span className="font-semibold uppercase tracking-[0.14em]">Location</span>
          </div>
          <p className="mt-1 line-clamp-2 font-semibold text-slate-700">
            {job.jobLocation || 'Remote'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <FiBriefcase size={12} />
            <span className="font-semibold uppercase tracking-[0.14em]">Type</span>
          </div>
          <p className="mt-1 line-clamp-1 font-semibold text-slate-700">
            {job.employmentType || 'Full-time'}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        {job.category ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {job.category}
          </span>
        ) : null}
        {job.experienceLevel && job.experienceLevel !== 'Not specified' ? (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            {job.experienceLevel}
          </span>
        ) : null}
        {job.salaryText ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            {job.salaryText}
          </span>
        ) : null}
        {job.isFeatured ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            Featured
          </span>
        ) : null}
      </div>

      {job.tags?.length ? (
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          {job.tags.map((tag, index) => (
            <span
              key={`${job.id}-${tag}-${index}`}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative z-10 mt-auto pt-5">
        <button
          type="button"
          onClick={() => onAction(job)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 px-4 py-3 text-sm font-black text-white shadow-[0_18px_36px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(245,158,11,0.34)]"
        >
          {job.sourceType === 'external' && isAuthenticated ? (
            <FiExternalLink size={14} />
          ) : (
            <FiLock size={14} />
          )}
          {primaryLabel}
        </button>
      </div>
    </article>
  );
};

const CompanyJobsPage = () => {
  const { companySlug } = useParams();
  const { user } = useAuthStore();
  const isAuthenticated = Boolean(user);
  const isJobBoardLocked = shouldLockJobBoards(isAuthenticated);
  const userRole = normalizeRole(user?.role);
  const canOpenPortalJobs = isCandidateRole(userRole);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = useMemo(
    () => buildCurrentPath(location),
    [location.hash, location.pathname, location.search]
  );
  const loginRedirectState = useMemo(
    () => getLoginRedirectState(currentPath),
    [currentPath]
  );

  const [detailState, setDetailState] = useState({
    company: null,
    jobs: { total: 0, portal: [], external: [] },
    loading: true,
    error: ''
  });
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [resumeIntent, setResumeIntent] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadCompany = async () => {
      setDetailState((current) => ({ ...current, loading: true, error: '' }));
      const response = await getPublicCompanyDetail(companySlug);
      if (!mounted) return;
      setDetailState({
        company: response.data?.company || null,
        jobs: response.data?.jobs || { total: 0, portal: [], external: [] },
        loading: false,
        error: response.error || ''
      });
    };
    loadCompany();
    return () => {
      mounted = false;
    };
  }, [companySlug]);

  useEffect(() => {
    const intent = readCompanyJobIntent();
    if (!intent) return;
    if (!isCompanyJobIntentFresh(intent)) {
      clearCompanyJobIntent();
      return;
    }
    if (!matchesCompanyJobRedirect(intent, currentPath) || !isAuthenticated) return;
    clearCompanyJobIntent();
    setResumeIntent(intent);
    toast.success(`Signed in. Jobs are unlocked for ${intent.companyName || 'this company'}.`);
  }, [currentPath, isAuthenticated]);

  const company = detailState.company;
  const allJobs = useMemo(() => buildUnifiedJobs(detailState.jobs), [detailState.jobs]);
  const filteredJobs = useMemo(
    () =>
      allJobs.filter((job) => {
        const haystack = [
          job.jobTitle,
          job.jobLocation,
          job.category,
          job.sourceLabel,
          ...(job.tags || [])
        ]
          .join(' ')
          .toLowerCase();
        const matchesSearch =
          !search.trim() || haystack.includes(search.trim().toLowerCase());
        if (!matchesSearch) return false;
        if (activeFilter === 'portal') return job.sourceType === 'portal';
        if (activeFilter === 'external') return job.sourceType === 'external';
        if (activeFilter === 'remote') return job.isRemote;
        return true;
      }),
    [activeFilter, allJobs, search]
  );

  const handleJobAction = (job) => {
    if (!isAuthenticated) {
      saveCompanyJobIntent({
        redirectPath: currentPath,
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        jobType: job.sourceType,
        applyUrl: job.applyUrl,
        portalJobId: job.portalJobId
      });
      toast('Login first to unlock this company job.');
      navigate('/login', { state: loginRedirectState });
      return;
    }

    if (job.sourceType === 'external') {
      setResumeIntent(null);
      openApplyDestination(job.applyUrl);
      return;
    }

    if (!canOpenPortalJobs) {
      toast.error('Sign in with a candidate account to open portal job details.');
      return;
    }

    setResumeIntent(null);
    navigate(getPortalJobPathByRole(userRole, job.portalJobId || job.id));
  };

  if (detailState.loading) {
    return (
      <div className="mx-auto flex min-h-[360px] max-w-[1680px] items-center justify-center px-4 py-12 md:px-6 xl:px-8">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      </div>
    );
  }

  if (detailState.error || !company) {
    return (
      <div className="mx-auto max-w-[1680px] px-4 py-12 md:px-6 xl:px-8">
        <div className="rounded-[32px] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 shadow-sm">
          {detailState.error || 'Company not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[540px] bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.24),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_24%),linear-gradient(180deg,rgba(255,248,235,0.95),rgba(248,250,252,0.68))]" />

      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-4 py-10 md:px-6 xl:px-8">
        <Link
          to="/companies"
          className="inline-flex w-max items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
        >
          <FiArrowLeft size={15} />
          Back to Companies
        </Link>

        <section className="rounded-[36px] border border-white/70 bg-white/88 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:px-8 xl:px-10">
          <div>
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {company.sponsored ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
                    <FiStar size={12} />
                    Sponsor Company
                  </span>
                ) : null}
                {company.premium ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
                    <FiStar size={12} />
                    Premium Company
                  </span>
                ) : null}
                {company.verifiedEmployer ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    <FiCheckCircle size={12} />
                    Verified Employer
                  </span>
                ) : null}
                {company.liveFeed ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                    <FiTrendingUp size={12} />
                    Live Hiring Feed
                  </span>
                ) : null}
              </div>

              <div className="flex items-start gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-[24px] border border-slate-200 bg-white object-contain p-2"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-amber-100 via-white to-slate-100 text-lg font-extrabold text-navy shadow-inner">
                    {getInitials(company.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <SectionHeader
                    eyebrow="Company Hiring Lounge"
                    title={company.name}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
                {company.location ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2">
                    <FiMapPin size={14} />
                    {company.location}
                  </span>
                ) : null}
                {company.companySize ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2">
                    <FiLayers size={14} />
                    {company.companySize}
                  </span>
                ) : null}
                {company.industry ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2">
                    <FiBriefcase size={14} />
                    {company.industry}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2">
                  {isAuthenticated ? <FiShield size={14} /> : <FiLock size={14} />}
                  {isAuthenticated ? 'Jobs unlocked' : 'Login required for jobs'}
                </span>
              </div>

              {company.categories?.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {company.categories.map((category) => (
                    <span
                      key={`${company.id}-${category}`}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={isAuthenticated ? '/jobs' : '/login'}
                  state={isAuthenticated ? undefined : loginRedirectState}
                  className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-navy/90"
                >
                  {isAuthenticated ? 'Browse All Jobs' : 'Login to Unlock Jobs'}
                  <FiArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {isJobBoardLocked ? (
          <section className="rounded-[34px] border border-amber-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.96))] px-6 py-7 shadow-[0_24px_60px_rgba(245,158,11,0.14)]">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px] xl:items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-600">
                  Private Role Board
                </p>
                <h2 className="mt-3 font-heading text-3xl font-black text-navy">
                  Login before this company job board opens
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  Search, filters, and every role card for {company.name} now stay behind login. Public
                  visitors only see the company preview while the actual job board remains protected.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/login"
                    state={loginRedirectState}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_36px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(245,158,11,0.34)]"
                  >
                    <FiLock size={15} />
                    Login to Unlock Jobs
                  </Link>
                  <Link
                    to="/sign-up"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    Create Account
                    <FiArrowUpRight size={15} />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Locked Features
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Search, filters, and role actions stay hidden.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Website Privacy
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Company site links and hosts are not shown publicly.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_auto] xl:items-center">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search job title, category, location, source..."
                    className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setActiveFilter(option.key)}
                      className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                        activeFilter === option.key
                          ? 'bg-navy text-white shadow-lg shadow-slate-900/10'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/90 px-5 py-4 text-sm text-emerald-800 shadow-sm">
              <div className="flex items-start gap-3">
                <FiShield size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Company role board is unlocked.</p>
                  <p className="mt-1 leading-6 text-emerald-700">
                    Search, filters, external apply actions, and portal job handoffs are active for
                    logged-in members.
                  </p>
                </div>
              </div>
            </section>

            {isAuthenticated && resumeIntent ? (
              <section className="rounded-[30px] border border-brand-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.96))] p-5 shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-500">
                      Job Action Ready
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-navy">
                      {resumeIntent.jobTitle || 'Continue with this company'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {resumeIntent.jobType === 'external'
                        ? `You are signed in now. Continue to ${resumeIntent.companyName || company.name} through the verified apply destination when you are ready.`
                        : `You are signed in now. Open the portal role for ${resumeIntent.companyName || company.name} from the candidate dashboard.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const nextIntent = resumeIntent;
                        setResumeIntent(null);
                        if (nextIntent.jobType === 'external') {
                          openApplyDestination(nextIntent.applyUrl);
                          return;
                        }
                        if (!canOpenPortalJobs) {
                          toast.error(
                            'Sign in with a candidate account to open portal job details.'
                          );
                          return;
                        }
                        navigate(getPortalJobPathByRole(userRole, nextIntent.portalJobId));
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_36px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(245,158,11,0.34)]"
                    >
                      <FiArrowUpRight size={15} />
                      {resumeIntent.jobType === 'external'
                        ? 'Continue Application'
                        : 'Open Portal Job'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeIntent(null)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="space-y-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">
                    Company Job Board
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-black text-navy">
                    {formatCount(filteredJobs.length)} jobs found for {company.name}
                  </h2>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-slate-500">
                  This page combines portal jobs and verified live-fetched openings for one company in
                  a premium protected layout.
                </p>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {filteredJobs.map((job) => (
                    <CompanyJobCard
                      key={`${job.sourceType}-${job.id}`}
                      canOpenPortalJobs={canOpenPortalJobs}
                      isAuthenticated={isAuthenticated}
                      job={job}
                      onAction={handleJobAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <FiSearch size={28} />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-black text-navy">
                    No jobs match this filter
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                    {allJobs.length > 0
                      ? 'Search by title, skill, category, source, or location. Only active jobs for this company are shown here.'
                      : company.sponsored
                        ? 'This sponsor company does not have any active jobs yet. As soon as it posts jobs, all of them will appear here automatically.'
                        : 'This company does not have any active jobs right now.'}
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyJobsPage;
