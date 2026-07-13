import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiSearch, FiShield, FiUsers } from 'react-icons/fi';

import useAuthStore from '../../../core/auth/authStore';
import CompanyDirectoryCard from '../components/CompanyDirectoryCard';
import { getPublicCompanies } from '../services/companyDirectoryApi';
import { getCompanyEntryIntent } from '../utils/publicAccess';
import GooglePagination from '../../../shared/components/GooglePagination';
import useDebouncedValue from '../../../shared/hooks/useDebouncedValue';

const COMPANIES_PAGE_SIZE = 50;

const getPortalCompanyWeight = (company = {}) =>
  Number(Boolean(company.portalProfile || Number(company.portalJobs || 0) > 0));

const sortPortalCompaniesFirst = (companies = []) =>
  [...companies].sort((left, right) => {
    const portalDelta = getPortalCompanyWeight(right) - getPortalCompanyWeight(left);
    if (portalDelta !== 0) return portalDelta;

    const jobsDelta = Number(right.totalJobs || 0) - Number(left.totalJobs || 0);
    if (jobsDelta !== 0) return jobsDelta;

    return String(left.name || '').localeCompare(String(right.name || ''));
  });

const formatCount = (value, loading) => {
  if (loading || value === null || value === undefined) return '--';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString('en-IN') : '--';
};

const CompanyCardSkeleton = () => (
  <div className="flex min-h-[260px] animate-pulse flex-col rounded-lg border border-slate-200 bg-white p-4">
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-lg bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-2">
      <div className="h-16 rounded-lg bg-slate-100" />
      <div className="h-16 rounded-lg bg-slate-100" />
    </div>
    <div className="mt-auto h-10 rounded-full bg-slate-200" />
  </div>
);

const CompaniesPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  const [directoryState, setDirectoryState] = useState({
    companies: [],
    summary: null,
    pagination: { page: 1, limit: COMPANIES_PAGE_SIZE, totalItems: 0, totalPages: 1 },
    loading: true,
    refreshing: false,
    error: ''
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 260);
  const resultsRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadCompanies = async () => {
      setDirectoryState((current) => ({
        ...current,
        loading: current.companies.length === 0,
        refreshing: current.companies.length > 0,
        error: ''
      }));
      const response = await getPublicCompanies({
        search: debouncedSearch,
        page,
        limit: COMPANIES_PAGE_SIZE,
        signal: controller.signal
      });
      if (!mounted || controller.signal.aborted) return;

      const nextPagination = response.data?.pagination || {
        page,
        limit: COMPANIES_PAGE_SIZE,
        totalItems: 0,
        totalPages: 1
      };

      setDirectoryState({
        companies: response.data?.companies || [],
        summary: response.data?.summary || null,
        pagination: nextPagination,
        loading: false,
        refreshing: false,
        error: response.error || ''
      });

      if (Number(nextPagination.page) !== page) {
        setPage(Number(nextPagination.page) || 1);
      }
    };

    loadCompanies();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [debouncedSearch, page]);

  const filteredCompanies = useMemo(() => {
    return sortPortalCompaniesFirst(directoryState.companies);
  }, [directoryState.companies]);

  const summary = directoryState.summary || {};
  const metrics = [
    {
      label: 'Employers listed',
      value: formatCount(summary.totalCompanies ?? directoryState.pagination.totalItems, directoryState.loading),
      icon: FiUsers
    },
    {
      label: 'Verified employers',
      value: formatCount(summary.verifiedEmployers, directoryState.loading),
      icon: FiShield
    },
    {
      label: 'Open roles',
      value: formatCount(summary.totalOpenRoles, directoryState.loading),
      icon: FiBriefcase
    }
  ];

  const handleOpenCompany = (company) => {
    const entryIntent = getCompanyEntryIntent({
      companySlug: company.slug,
      companyName: company.name,
      company,
      isAuthenticated,
      totalJobs: company.totalJobs
    });

    if (!entryIntent?.to) return;
    navigate(entryIntent.to, entryIntent.state ? { state: entryIntent.state } : undefined);
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <section className="public-cinematic-hero relative isolate min-h-[380px] overflow-hidden border-b border-[#d99b20]/35 bg-[#071524] text-white">
        <img
          src="/career-compass-hero-1024.webp?v=20260713"
          srcSet="/career-compass-hero-640.webp?v=20260713 640w, /career-compass-hero-1024.webp?v=20260713 1024w"
          sizes="100vw"
          alt="Employers and professionals collaborating"
          width="1024"
          height="1024"
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="public-cinematic-image absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,21,36,0.96)_0%,rgba(7,21,36,0.82)_55%,rgba(7,21,36,0.68)_100%)]" />

        <div className="vw-shell-wide relative flex min-h-[380px] flex-col justify-end py-8 sm:py-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="border-l-2 border-brand-400 pl-3 text-[11px] font-black uppercase text-brand-300">
              Company directory
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <FiShield size={13} className="text-emerald-300" />
              Verified employer profiles
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-black leading-[1.08] tracking-normal text-white sm:text-5xl">
            Meet the companies building India&apos;s next careers.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
            Explore real employers, active roles, industries, and locations before choosing where your next application should go.
          </p>

          <div className="mt-7 grid border-y border-white/15 bg-slate-950/20 sm:grid-cols-3">
            {metrics.map((metric, index) => (
              <div key={metric.label} className={`flex min-h-[76px] items-center gap-3 px-3 py-3 sm:px-5 ${index > 0 ? 'border-t border-white/15 sm:border-l sm:border-t-0' : ''}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5">
                  <metric.icon className="h-4 w-4 text-brand-300" />
                </span>
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-2xl font-black text-white">{metric.value}</p>
                  <p className="text-[10px] font-black uppercase text-white/60">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#e7ddca] bg-[#fffdf9]">
        <div className="vw-shell-wide flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search companies</span>
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search company, industry, city, or category"
              className="h-12 w-full rounded-md border border-[#ded4c2] bg-white pl-11 pr-4 text-sm font-semibold text-[#151922] outline-none transition focus:border-[#14549a] focus:ring-4 focus:ring-secondary-100"
            />
          </label>
          <p className="shrink-0 text-xs font-bold text-slate-500" aria-live="polite">
            {directoryState.loading
              ? 'Loading employers'
              : directoryState.pagination.totalItems > 0
                ? `${(((directoryState.pagination.page - 1) * COMPANIES_PAGE_SIZE) + 1).toLocaleString('en-IN')}-${Math.min(directoryState.pagination.page * COMPANIES_PAGE_SIZE, directoryState.pagination.totalItems).toLocaleString('en-IN')} of ${directoryState.pagination.totalItems.toLocaleString('en-IN')} employers`
                : '0 employers shown'}
          </p>
        </div>
      </section>

      <main ref={resultsRef} className="vw-shell-wide scroll-mt-24 py-6 sm:py-8">
        {directoryState.refreshing ? (
          <div className="mb-4 h-0.5 overflow-hidden bg-slate-100" role="status" aria-label="Refreshing company results">
            <span className="block h-full w-1/3 animate-[directory-loading_1.1s_ease-in-out_infinite] bg-[#14549a]" />
          </div>
        ) : null}

        {directoryState.error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {directoryState.error}
          </div>
        ) : null}

        {directoryState.loading ? (
          <div className={`grid items-stretch gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${directoryState.refreshing ? 'opacity-55' : 'opacity-100'}`}>
            {Array.from({ length: 8 }, (_, index) => <CompanyCardSkeleton key={index} />)}
          </div>
        ) : filteredCompanies.length > 0 ? (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCompanies.map((company) => (
              <CompanyDirectoryCard
                key={company.id || company.slug}
                company={company}
                onOpenCompany={handleOpenCompany}
                primaryLabel={isAuthenticated ? 'Open company' : 'Login to unlock'}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-xl border-y border-slate-200 py-14 text-center">
            <FiSearch className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-4 font-heading text-2xl font-black text-navy">No companies match this search</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Try a company name, industry, city, or a broader keyword.</p>
          </div>
        )}

        <GooglePagination
          page={directoryState.pagination.page}
          totalPages={directoryState.pagination.totalPages}
          onChange={setPage}
          scrollTarget={resultsRef}
          className="mt-8 border-t border-slate-200 pt-5"
        />
      </main>
    </div>
  );
};

export default CompaniesPage;
