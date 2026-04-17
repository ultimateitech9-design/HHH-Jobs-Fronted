import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiFilter,
  FiLayers,
  FiMapPin,
  FiSearch,
  FiStar
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentSurfaceCard,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import { getPublicCompanies } from '../../common/services/companyDirectoryApi';
import { getCompanyEntryIntent } from '../../common/utils/publicAccess';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All companies' },
  { key: 'premium', label: 'Premium' },
  { key: 'portal', label: 'Portal employers' },
  { key: 'live-feed', label: 'Live feed' }
];

const getInitials = (name = '') =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CO';

const StudentCompaniesPage = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    companies: [],
    summary: null,
    loading: true,
    error: ''
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let mounted = true;

    const loadCompanies = async () => {
      const response = await getPublicCompanies();
      if (!mounted) return;

      setState({
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

  const filteredCompanies = useMemo(() => state.companies.filter((company) => {
    const haystack = [
      company.name,
      company.location,
      company.industry,
      company.companySize,
      ...(company.categories || [])
    ].join(' ').toLowerCase();

    const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'premium') return company.premium;
    if (filter === 'portal') return company.portalProfile || company.portalJobs > 0;
    if (filter === 'live-feed') return company.liveFeed;
    return true;
  }), [filter, search, state.companies]);

  const counts = useMemo(() => ({
    total: filteredCompanies.length,
    premium: filteredCompanies.filter((company) => company.premium).length,
    portal: filteredCompanies.filter((company) => company.portalProfile || company.portalJobs > 0).length,
    live: filteredCompanies.filter((company) => company.liveFeed).length
  }), [filteredCompanies]);

  const openCompany = (company) => {
    const intent = getCompanyEntryIntent({
      companySlug: company.slug,
      isAuthenticated: true,
      totalJobs: company.totalJobs
    });

    if (!intent?.to) return;
    navigate(intent.to, intent.state ? { state: intent.state } : undefined);
  };

  return (
    <div className="space-y-4 pb-6">
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}

      <StudentSurfaceCard
        eyebrow="Companies"
        title="Portal companies"
        subtitle="Open a company and jump straight to its roles."
        className="p-4 md:p-5 xl:p-5"
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                {counts.total} visible
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Premium {counts.premium}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Portal {counts.portal}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Live {counts.live}
              </span>
            </div>

            <div className="relative w-full md:max-w-[380px]">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company, industry, or location"
                className="w-full rounded-[0.95rem] border border-slate-200 bg-white px-4 py-2.5 pl-11 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <Link to="/portal/student/jobs" className={`${studentSecondaryButtonClassName} w-full px-4 py-2 text-[13px] md:w-auto`}>
              Browse jobs
            </Link>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              {FILTER_OPTIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold transition ${
                    filter === item.key
                      ? 'bg-navy text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
                  }`}
                >
                  <FiFilter size={13} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </StudentSurfaceCard>

      <StudentSurfaceCard className="p-5 xl:p-6">
            {state.loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-56 animate-pulse rounded-[1.25rem] bg-slate-100" />
                ))}
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCompanies.map((company) => (
                  <article
                    key={company.id || company.slug}
                    className="flex min-w-0 h-full flex-col rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-[0_12px_26px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="h-12 w-12 rounded-xl border border-slate-200 bg-white object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-base font-black text-brand-700">
                            {getInitials(company.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-extrabold text-navy">{company.name}</h3>
                          <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-slate-500">
                            {company.headline || company.industry || 'Hiring on HHH Jobs'}
                          </p>
                        </div>
                      </div>

                      {company.premium ? (
                        <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                          <FiStar size={12} />
                          Premium
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-600">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Open roles</p>
                        <p className="mt-1.5 text-xl font-extrabold text-navy">{Number(company.totalJobs || 0)}</p>
                      </div>
                      <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-600">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          <FiMapPin size={13} />
                          Location
                        </p>
                        <p className="mt-1.5 line-clamp-2 font-semibold text-slate-800">{company.location || 'Multi-city hiring'}</p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
                      {company.description || 'Open this company to see its available roles and hiring page.'}
                    </p>

                    {company.categories?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {company.categories.slice(0, 2).map((category) => (
                          <span
                            key={`${company.id || company.slug}-${category}`}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                          >
                            {category}
                          </span>
                        ))}
                        {company.categories.length > 2 ? (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                            +{company.categories.length - 2}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap">
                      <button type="button" className={`${studentPrimaryButtonClassName} w-full px-4 py-2.5 text-[13px] sm:w-auto`} onClick={() => openCompany(company)}>
                        Open company
                        <FiArrowRight size={14} />
                      </button>
                      <Link to="/portal/student/jobs" className={`${studentSecondaryButtonClassName} w-full px-4 py-2.5 text-[13px] sm:w-auto`}>
                        Browse jobs
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <StudentEmptyState
                icon={FiLayers}
                title="No companies found"
                description="Try a different search or filter to see more companies from your portal directory."
                className="border-none bg-slate-50/80"
              />
            )}
      </StudentSurfaceCard>
    </div>
  );
};

export default StudentCompaniesPage;
