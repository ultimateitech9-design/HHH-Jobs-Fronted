import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiLayers,
  FiSearch,
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentSurfaceCard
} from '../components/StudentExperience';
import { getPublicCompanies } from '../../common/services/companyDirectoryApi';
import { getCompanyEntryIntent } from '../../common/utils/publicAccess';
import CompanyDirectoryCard from '../../common/components/CompanyDirectoryCard';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All companies' },
  { key: 'premium', label: 'Premium' },
  { key: 'portal', label: 'Portal employers' },
  { key: 'live-feed', label: 'Live feed' }
];

const COMPANIES_PER_PAGE = 12;

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
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE));

  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * COMPANIES_PER_PAGE;
    return filteredCompanies.slice(start, start + COMPANIES_PER_PAGE);
  }, [filteredCompanies, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

      <section className="px-1 py-2">
        <div className="mb-4">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-700">
            Companies
          </p>
          <h1 className="mt-3 text-2xl font-black text-navy">
            Portal companies
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Open a company and jump straight to its roles.
          </p>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="space-y-3">
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
      </section>

      <StudentSurfaceCard className="p-3.5 sm:p-4">
            {state.loading ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-48 animate-pulse rounded-[1rem] bg-slate-100" />
                ))}
              </div>
            ) : filteredCompanies.length > 0 ? (
              <>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedCompanies.map((company) => (
                    <CompanyDirectoryCard
                      key={company.id || company.slug}
                      company={company}
                      onOpenCompany={openCompany}
                      primaryLabel="Open company"
                    />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                      Showing {(page - 1) * COMPANIES_PER_PAGE + 1}-{Math.min(page * COMPANIES_PER_PAGE, filteredCompanies.length)} of {filteredCompanies.length}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={page === 1}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label="Previous page"
                      >
                        <FiChevronLeft size={17} />
                      </button>

                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPage(item)}
                          className={`h-9 min-w-9 rounded-full px-3 text-sm font-black transition ${
                            page === item
                              ? 'bg-navy text-white shadow-sm'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50'
                          }`}
                        >
                          {item}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        disabled={page === totalPages}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label="Next page"
                      >
                        <FiChevronRight size={17} />
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
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
