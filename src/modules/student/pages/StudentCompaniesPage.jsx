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
import { getCompanySubscriptions, getPublicCompanies } from '../../common/services/companyDirectoryApi';
import { getCompanyEntryIntent } from '../../common/utils/publicAccess';
import CompanyDirectoryCard from '../../common/components/CompanyDirectoryCard';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All companies' },
  { key: 'premium', label: 'Premium' },
  { key: 'portal', label: 'Portal employers' },
  { key: 'subscribed', label: 'Subscribed companies' }
];

const COMPANIES_PER_PAGE = 12;

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

const toLookupKey = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getCompanyLookupKeys = (company = {}) =>
  [company.slug, company.name, company.id]
    .map(toLookupKey)
    .filter(Boolean);

const getSubscriptionLookupKeys = (subscription = {}) =>
  [subscription.companySlug, subscription.companyName, subscription.companyKey]
    .map(toLookupKey)
    .filter(Boolean);

const matchesCompanySubscription = (company, subscription) => {
  const companyKeys = new Set(getCompanyLookupKeys(company));
  return getSubscriptionLookupKeys(subscription).some((key) => companyKeys.has(key));
};

const buildSubscriptionOnlyCompany = (subscription = {}) => {
  const slug = toLookupKey(subscription.companySlug || subscription.companyName || subscription.companyKey);
  const name = String(subscription.companyName || subscription.companySlug || 'Subscribed company').trim();

  return {
    id: `subscription-${slug || toLookupKey(name)}`,
    slug,
    name,
    headline: 'Subscribed for company job alerts',
    categories: ['Subscribed'],
    totalJobs: 0,
    portalJobs: 0,
    portalProfile: false,
    subscription: { ...subscription, subscribed: true }
  };
};

const buildSubscribedCompanies = (companies = [], subscriptions = []) => {
  const activeSubscriptions = subscriptions.filter((subscription) => subscription?.subscribed !== false);

  return activeSubscriptions
    .map((subscription) => {
      const company = companies.find((entry) => matchesCompanySubscription(entry, subscription));
      return company
        ? { ...company, subscription: { ...subscription, subscribed: true } }
        : buildSubscriptionOnlyCompany(subscription);
    })
    .filter((company) => company.slug || company.name);
};

const StudentCompaniesPage = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    companies: [],
    subscriptions: [],
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
      const [response, subscriptionsResponse] = await Promise.all([
        getPublicCompanies(),
        getCompanySubscriptions()
      ]);
      if (!mounted) return;

      setState({
        companies: response.data?.companies || [],
        subscriptions: subscriptionsResponse.data?.subscriptions || [],
        summary: response.data?.summary || null,
        loading: false,
        error: response.error || subscriptionsResponse.error || ''
      });
    };

    loadCompanies();

    return () => {
      mounted = false;
    };
  }, []);

  const subscribedCompanies = useMemo(
    () => buildSubscribedCompanies(state.companies, state.subscriptions),
    [state.companies, state.subscriptions]
  );

  const filteredCompanies = useMemo(() => sortPortalCompaniesFirst((filter === 'subscribed' ? subscribedCompanies : state.companies).filter((company) => {
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
    return true;
  })), [filter, search, state.companies, subscribedCompanies]);

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
      companyName: company.name,
      company,
      isAuthenticated: true,
      totalJobs: company.totalJobs
    });

    if (!intent?.to) return;
    navigate(intent.to, intent.state ? { state: intent.state } : undefined);
  };

  const handleCompanySubscriptionChange = (company, subscription = {}) => {
    const nextSubscription = {
      ...subscription,
      companySlug: subscription.companySlug || company.slug || '',
      companyName: subscription.companyName || company.name || '',
      subscribed: Boolean(subscription.subscribed)
    };

    setState((current) => ({
      ...current,
      companies: current.companies.map((entry) => (
        matchesCompanySubscription(entry, nextSubscription)
          ? { ...entry, subscription: nextSubscription }
          : entry
      )),
      subscriptions: nextSubscription.subscribed
        ? [
            ...current.subscriptions.filter((entry) => !matchesCompanySubscription(company, entry)),
            nextSubscription
          ]
        : current.subscriptions.filter((entry) => !matchesCompanySubscription(company, entry))
    }));
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
                      onSubscriptionChange={handleCompanySubscriptionChange}
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
