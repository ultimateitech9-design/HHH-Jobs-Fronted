import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiLock,
  FiMapPin,
  FiSearch,
  FiShield,
  FiStar,
  FiTrendingUp
} from 'react-icons/fi';

import useAuthStore from '../../../core/auth/authStore';
import SectionHeader from '../../../shared/components/SectionHeader';
import { getCompanyEntryIntent } from '../utils/publicAccess';
import { getPublicCompanies } from '../services/companyDirectoryApi';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Listed Companies' },
  { key: 'premium', label: 'Premium Picks' },
  { key: 'portal', label: 'Portal Employers' },
  { key: 'live-feed', label: 'Live Fetched' }
];

const formatCount = (value) => Number(value || 0).toLocaleString();

const getInitials = (name = '') =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CO';

const statCardsFromSummary = (summary, isAuthenticated) => [
  {
    key: 'companies',
    label: 'Listed Companies',
    value: formatCount(summary?.totalCompanies || 0),
    helper: 'Curated companies with visible employer presence.'
  },
  {
    key: 'roles',
    label: isAuthenticated ? 'Unlocked Roles' : 'Private Role Boards',
    value: isAuthenticated ? formatCount(summary?.totalOpenRoles || 0) : 'Login',
    helper: isAuthenticated
      ? 'Company job boards are available after sign in.'
      : 'Jobs stay hidden until the member logs in.'
  },
  {
    key: 'premium',
    label: 'Premium Companies',
    value: formatCount(summary?.premiumCompanies || 0),
    helper: 'Priority employers with stronger hiring presence.'
  },
  {
    key: 'live',
    label: 'Live Feed Companies',
    value: formatCount(summary?.liveFeedCompanies || 0),
    helper: 'Companies verified from trusted hiring feeds.'
  }
];

const CompanyCard = ({ company, isAuthenticated, onOpenCompany }) => {
  const headline = company.headline || 'Hiring on HHH Jobs';
  const summaryLine =
    [company.industry, company.companySize].filter(Boolean).join(' • ') ||
    'Curated employer preview on HHH Jobs';
  const entryIntent = getCompanyEntryIntent({
    companySlug: company.slug,
    isAuthenticated,
    totalJobs: company.totalJobs
  });
  const statusBadges = [
    company.premium ? 'border-amber-200/70 bg-amber-100/15 text-amber-100' : null,
    company.verifiedEmployer ? 'border-emerald-200/70 bg-emerald-100/15 text-emerald-100' : null,
    company.liveFeed ? 'border-sky-200/70 bg-sky-100/15 text-sky-100' : null
  ].filter(Boolean);
  const statusLabels = [
    company.premium ? 'Premium' : null,
    company.verifiedEmployer ? 'Verified' : null,
    company.liveFeed ? 'Live Feed' : null
  ].filter(Boolean);

  const handleOpen = () => onOpenCompany(entryIntent);
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[34px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-2.5 shadow-[0_22px_72px_rgba(15,23,42,0.09)] backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_32px_92px_rgba(15,23,42,0.14)] focus:outline-none focus:ring-4 focus:ring-brand-100"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_28%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex h-full flex-col rounded-[30px] bg-white/88 p-1">
        <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(150deg,rgba(39,58,92,0.98)_0%,rgba(67,88,126,0.94)_52%,rgba(220,161,64,0.9)_100%)] px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(255,245,219,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_24%)] opacity-95" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {statusLabels.map((label, index) => (
                  <span
                    key={`${company.id}-${label}`}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] backdrop-blur ${statusBadges[index]}`}
                  >
                    {label === 'Premium' ? <FiStar size={11} /> : null}
                    {label === 'Verified' ? <FiCheckCircle size={11} /> : null}
                    {label === 'Live Feed' ? <FiTrendingUp size={11} /> : null}
                    {label}
                  </span>
                ))}
              </div>

              <div className="shrink-0 rounded-[20px] border border-white/20 bg-white/16 px-3 py-2.5 text-right shadow-lg shadow-black/10 backdrop-blur">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                  {isAuthenticated ? 'Open Roles' : 'Access'}
                </p>
                <p className="mt-1 text-[1.55rem] font-black leading-none text-white">
                  {isAuthenticated ? formatCount(company.totalJobs) : 'Lock'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 rounded-[20px] border border-white/20 bg-white object-contain p-2 shadow-lg shadow-black/10"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/20 bg-white/95 text-sm font-extrabold text-navy shadow-lg shadow-black/10">
                  {getInitials(company.name)}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">
                  Premium Employer Preview
                </p>
                <h3 className="mt-1.5 line-clamp-2 font-heading text-[1.32rem] font-black leading-tight text-white">
                  {company.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-white/78">
                  {headline}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/18 bg-white/16 px-3 py-2 text-[11px] text-white/86 backdrop-blur">
              {isAuthenticated ? <FiShield size={13} className="shrink-0 text-white/72" /> : <FiLock size={13} className="shrink-0 text-white/72" />}
              <span className="line-clamp-1">{entryIntent.helperText}</span>
            </div>
          </div>
        </div>

        <div className="px-1 pt-3">
          <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Company Snapshot
                </p>
                <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-700">
                  {summaryLine}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <FiBriefcase size={16} />
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-slate-600">
              {company.description ||
                'Employer identity, category mix, and access status are shown here without exposing company website details.'}
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-600">
              <FiMapPin size={13} className="text-slate-400" />
              <span className="line-clamp-1">{company.location || 'Multi-city hiring'}</span>
            </div>

            {company.categories?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {company.categories.slice(0, 3).map((category) => (
                  <span
                    key={`${company.id}-${category}`}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                  >
                    {category}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2.5 px-1 pb-1 pt-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleOpen();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(39,58,92,0.98),rgba(84,107,150,0.94))] px-5 py-3.5 text-[13px] font-black text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(15,23,42,0.24)]"
          >
            {isAuthenticated ? 'Open Hiring Lounge' : 'Login to Unlock'}
            <FiArrowRight size={15} />
          </button>

          <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-600">
            {isAuthenticated ? <FiShield size={14} /> : <FiLock size={14} />}
            {isAuthenticated ? 'Company site stays hidden on preview cards' : 'Public preview only'}
          </div>
        </div>
      </div>
    </article>
  );
};

const CompaniesPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  const [directoryState, setDirectoryState] = useState({
    companies: [],
    summary: null,
    loading: true,
    error: ''
  });
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let mounted = true;

    const loadCompanies = async () => {
      setDirectoryState((current) => ({ ...current, loading: true, error: '' }));
      const response = await getPublicCompanies();
      if (!mounted) return;

      setDirectoryState({
        companies: response.data?.companies || [],
        summary: response.data?.summary || null,
        loading: false,
        error: response.error || ''
      });
    };

    loadCompanies();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCompanies = useMemo(() => {
    return directoryState.companies.filter((company) => {
      const haystack = [
        company.name,
        company.location,
        company.industry,
        company.companySize,
        ...(company.categories || [])
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());

      if (!matchesSearch) return false;
      if (activeFilter === 'premium') return company.premium;
      if (activeFilter === 'portal') return company.portalProfile || company.portalJobs > 0;
      if (activeFilter === 'live-feed') return company.liveFeed;
      return true;
    });
  }, [activeFilter, directoryState.companies, search]);

  const featuredCompanies = useMemo(
    () => filteredCompanies.filter((company) => company.premium).slice(0, 4),
    [filteredCompanies]
  );

  const statCards = useMemo(
    () => statCardsFromSummary(directoryState.summary, isAuthenticated),
    [directoryState.summary, isAuthenticated]
  );

  const handleOpenCompany = (entryIntent) => {
    if (!entryIntent?.to) return;
    navigate(entryIntent.to, entryIntent.state ? { state: entryIntent.state } : undefined);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.24),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_24%),linear-gradient(180deg,rgba(255,248,235,0.96),rgba(248,250,252,0.72))]" />

      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-8 px-4 py-12 md:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[38px] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,248,235,0.92)_45%,rgba(240,249,255,0.9))] px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur md:px-10 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.5),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.16),transparent_22%)]" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_440px] xl:items-start">
            <div>
              <SectionHeader
                eyebrow="Company Directory"
                title="Premium Employer Preview"
                subtitle="Company cards stay public, but their role boards are now protected behind login. Website links are hidden, and the preview focuses only on employer quality and hiring identity."
              />
            </div>

            <div className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(145deg,rgba(15,23,42,0.97),rgba(30,41,59,0.96))] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
                Access Status
              </p>
              <h2 className="mt-3 font-heading text-2xl font-black">
                {isAuthenticated ? 'Hiring boards unlocked' : 'Role boards stay private'}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/72">
                {isAuthenticated
                  ? 'Open any company card to jump straight into its protected hiring lounge.'
                  : 'Guests can inspect the premium employer preview, but jobs and company actions open only after login.'}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                    Company Sites
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">Hidden from public view</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                    Job Boards
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {isAuthenticated ? 'Available now' : 'Unlock after login'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => (
              <div
                key={item.key}
                className="rounded-[28px] border border-white/80 bg-white/82 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 font-heading text-4xl font-black text-navy">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.helper}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search companies, categories, industry, location..."
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

        <section
          className={`rounded-[28px] px-5 py-4 text-sm shadow-sm ${
            isAuthenticated
              ? 'border border-emerald-200 bg-emerald-50/90 text-emerald-800'
              : 'border border-amber-200 bg-amber-50/90 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {isAuthenticated ? (
              <FiShield size={18} className="mt-0.5 shrink-0" />
            ) : (
              <FiLock size={18} className="mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {isAuthenticated
                  ? 'Cards open straight into the protected hiring lounge.'
                  : 'This is a preview layer only.'}
              </p>
              <p
                className={`mt-1 leading-6 ${
                  isAuthenticated ? 'text-emerald-700' : 'text-amber-800'
                }`}
              >
                {isAuthenticated
                  ? 'Company website links remain hidden, but job boards and role-specific company access become available after login.'
                  : 'Guests can browse the premium employer preview, but jobs and company actions unlock only after login.'}
              </p>
            </div>
          </div>
        </section>

        {directoryState.error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {directoryState.error}
          </div>
        ) : null}

        {directoryState.loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[32px] border border-slate-200 bg-white/80">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          </div>
        ) : (
          <>
            {featuredCompanies.length > 0 ? (
              <section className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">
                      Premium Spotlight
                    </p>
                    <h2 className="mt-2 font-heading text-3xl font-black text-navy">
                      Featured employer previews
                    </h2>
                  </div>
                  <div className="hidden rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 md:inline-flex">
                    {featuredCompanies.length} premium listings
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {featuredCompanies.map((company) => (
                    <CompanyCard
                      key={`featured-${company.id}`}
                      company={company}
                      isAuthenticated={isAuthenticated}
                      onOpenCompany={handleOpenCompany}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">
                    All Listed Companies
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-black text-navy">
                    {formatCount(filteredCompanies.length)} companies found
                  </h2>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-slate-500">
                  Cards below focus on employer identity, categories, and access mode. Company website
                  details stay hidden across the public preview.
                </p>
              </div>

              {filteredCompanies.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {filteredCompanies.map((company) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      isAuthenticated={isAuthenticated}
                      onOpenCompany={handleOpenCompany}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <FiSearch size={28} />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-black text-navy">
                    No listed companies match this filter
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                    Search by company name, city, industry, or category. Only active public company previews
                    are included here.
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

export default CompaniesPage;
