import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, CheckCircle2, MapPin, Search, TrendingUp, X } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import rankedSearch from '../../../shared/utils/rankedSearch';

const DIRECTORY_CONFIG = {
  categories: {
    title: 'Job Categories',
    eyebrow: 'Explore by role',
    subtitle: 'Browse active hiring categories and jump into matching jobs instantly.',
    searchPlaceholder: 'Search job categories...',
    key: 'roles',
    icon: Briefcase,
    highlightLabel: 'Top role demand'
  },
  cities: {
    title: 'Cities',
    eyebrow: 'Explore by location',
    subtitle: 'Find nearby opportunities by city with fast alphabetical browsing.',
    searchPlaceholder: 'Search cities...',
    key: 'cities',
    icon: MapPin,
    highlightLabel: 'Active cities'
  },
  sectors: {
    title: 'Sectors',
    eyebrow: 'Explore by industry',
    subtitle: 'Compare industry demand and open the right sector jobs in one click.',
    searchPlaceholder: 'Search sectors...',
    key: 'sectors',
    icon: Building2,
    highlightLabel: 'Hiring sectors'
  }
};

const buildFacetPath = (type, name) => {
  const params = new URLSearchParams();
  if (type === 'categories') params.set('search', name);
  if (type === 'sectors') {
    params.set('category', name);
    params.set('sector', name);
  }
  if (type === 'cities') {
    params.set('location', name);
    params.set('city', name);
  }
  return `/jobs?${params.toString()}`;
};

const normalizeItems = (items = []) => (Array.isArray(items) ? items : [])
  .map((item) => ({
    name: String(item?.name || '').trim(),
    count: Number(item?.count ?? item?.activeCount ?? 0),
    totalCount: Number(item?.totalCount ?? item?.total_count ?? item?.count ?? item?.activeCount ?? 0)
  }))
  .filter((item) => item.name)
  .filter((item, index, list) => list.findIndex((value) => value.name.toLowerCase() === item.name.toLowerCase()) === index);

const getDirectoryLetter = (name = '') => {
  const first = String(name).trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
};

const formatCount = (value = 0) => Number(value || 0).toLocaleString('en-IN');

const sortByName = (items = []) => [...items].sort((a, b) => a.name.localeCompare(b.name));

const sortByDemand = (items = []) => [...items].sort((a, b) => {
  if (b.count !== a.count) return b.count - a.count;
  if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
  return a.name.localeCompare(b.name);
});

export default function FacetDirectoryPage() {
  const location = useLocation();
  const directoryType = location.pathname.includes('/jobs/cities')
    ? 'cities'
    : location.pathname.includes('/jobs/sectors')
      ? 'sectors'
      : 'categories';
  const config = DIRECTORY_CONFIG[directoryType] || DIRECTORY_CONFIG.categories;
  const Icon = config.icon;
  const [facets, setFacets] = useState({ roles: [], cities: [], sectors: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState('All');
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let mounted = true;

    const loadFacets = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiFetch('/jobs/meta/homepage-facets?roleLimit=800&sectorLimit=200&cityLimit=1200');
        const payload = response.ok ? await response.json().catch(() => null) : null;
        if (!mounted) return;
        if (!payload?.status) {
          setError('Unable to load this directory right now.');
          setLoading(false);
          return;
        }
        setFacets({
          roles: payload.roles || [],
          cities: payload.cities || [],
          sectors: payload.sectors || [],
          totals: payload.totals || {}
        });
        setLoading(false);
      } catch {
        if (!mounted) return;
        setError('Unable to load this directory right now.');
        setLoading(false);
      }
    };

    loadFacets();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setQuery('');
    setActiveLetter('All');
  }, [directoryType]);

  const items = useMemo(() => normalizeItems(facets[config.key]), [config.key, facets]);
  const alphabeticalItems = useMemo(() => sortByName(items), [items]);
  const popularItems = useMemo(() => sortByDemand(items).filter((item) => item.count > 0).slice(0, 10), [items]);
  const activeItemsCount = useMemo(() => items.filter((item) => item.count > 0).length, [items]);
  const totalOpenings = useMemo(() => items.reduce((sum, item) => sum + Number(item.count || 0), 0), [items]);
  const letters = useMemo(() => {
    const availableLetters = new Set(alphabeticalItems.map((item) => getDirectoryLetter(item.name)));
    return ['All', ...Array.from(availableLetters).sort((a, b) => a.localeCompare(b))];
  }, [alphabeticalItems]);
  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim();
    const queryMatchedItems = normalizedQuery
      ? rankedSearch(alphabeticalItems, normalizedQuery, [
        (item) => item.name,
        (item) => getDirectoryLetter(item.name),
        (item) => `${item.count} ${item.totalCount}`
      ])
      : alphabeticalItems;

    return queryMatchedItems.filter((item) => (
      activeLetter === 'All' || getDirectoryLetter(item.name) === activeLetter
    ));
  }, [activeLetter, alphabeticalItems, deferredQuery]);
  const groupedItems = useMemo(() => {
    const groups = new Map();
    filteredItems.forEach((item) => {
      const letter = getDirectoryLetter(item.name);
      const existing = groups.get(letter) || [];
      existing.push(item);
      groups.set(letter, existing);
    });
    return Array.from(groups.entries()).map(([letter, groupItems]) => ({ letter, items: groupItems }));
  }, [filteredItems]);
  const hasFilters = query.trim() || activeLetter !== 'All';
  const primaryTotal = items.length ? `${formatCount(items.length)} ${config.title}` : config.title;
  const statCards = [
    { label: config.highlightLabel, value: formatCount(activeItemsCount), hint: 'with live openings' },
    { label: 'Open jobs', value: formatCount(totalOpenings || facets.totals?.openJobs || 0), hint: 'from active listings' },
    { label: 'Companies', value: formatCount(facets.totals?.companies || 0), hint: 'posting jobs' }
  ];

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="border-b border-slate-200 bg-white px-[4vw] py-5 md:py-6">
        <div className="mx-auto w-full max-w-[1760px]">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(32rem,0.95fr)] xl:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3f56ad]/10 text-[#3f56ad]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3f56ad]">{config.eyebrow}</p>
                  <h1 className="mt-1 font-heading text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {primaryTotal}
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                {config.subtitle}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {statCards.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{stat.value}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={config.searchPlaceholder}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#3f56ad]/40 focus:bg-white focus:ring-4 focus:ring-[#3f56ad]/10"
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-[#3f56ad]/30 hover:text-[#3f56ad]">
                Home
              </Link>
              <Link
                to="/jobs"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#263754] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(38,55,84,0.18)] transition hover:bg-[#1e2d48]"
              >
                All jobs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {popularItems.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                Hiring now
              </span>
              {popularItems.slice(0, 8).map((item) => (
                <Link
                  key={`popular-${directoryType}-${item.name}`}
                  to={buildFacetPath(directoryType, item.name)}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#3f56ad]/35 hover:text-[#3f56ad]"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="rounded-full bg-[#3f56ad]/10 px-1.5 py-0.5 text-[0.65rem] text-[#3f56ad]">{formatCount(item.count)}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="sticky top-[calc(var(--public-navbar-height,74px)+1px)] z-20 border-b border-slate-200 bg-[#f6f8fb]/95 px-[4vw] py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" aria-label={`${config.title} alphabet filter`}>
            {letters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setActiveLetter(letter)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-black transition ${
                  activeLetter === letter
                    ? 'bg-[#3f56ad] text-white shadow-[0_8px_18px_rgba(43,69,154,0.18)]'
                    : 'border border-slate-200 bg-white text-slate-500 hover:border-[#3f56ad]/30 hover:text-[#3f56ad]'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500" aria-live="polite">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span><span className="text-slate-950">{formatCount(filteredItems.length)}</span> shown</span>
          </div>
        </div>
      </section>

      <section className="px-[4vw] py-5 md:py-7">
        <div className="mx-auto w-full max-w-[1760px]">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 24 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-xl bg-white shadow-sm" />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-rose-100 bg-white p-6 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {!loading && !error ? (
            <>
              {filteredItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <p className="text-lg font-black text-slate-900">No matching {config.title.toLowerCase()} found</p>
                  <p className="mt-2 text-sm text-slate-500">Try another search or reset the alphabet filter.</p>
                  {hasFilters ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setActiveLetter('All');
                      }}
                      className="mt-5 rounded-full bg-[#263754] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1e2d48]"
                    >
                      Clear filters
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-4">
                  {groupedItems.map((group) => (
                    <section key={group.letter} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.045)]">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3f56ad]/10 text-sm font-black text-[#3f56ad]">
                          {group.letter}
                        </h2>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          {formatCount(group.items.length)} results
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
                        {group.items.map((item) => (
                          <Link
                            key={`${directoryType}-${item.name}`}
                            to={buildFacetPath(directoryType, item.name)}
                            className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#3f56ad]/35 hover:bg-white hover:text-[#31468f] hover:shadow-[0_10px_20px_rgba(15,23,42,0.07)]"
                          >
                            <span className="min-w-0 truncate">{item.name}</span>
                            {item.count > 0 ? (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.68rem] font-black text-emerald-700">
                                {formatCount(item.count)}
                              </span>
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-[#3f56ad]" aria-hidden="true" />
                            )}
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
