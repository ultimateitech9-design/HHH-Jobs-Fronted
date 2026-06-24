import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, MapPin, Search, X } from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const DIRECTORY_CONFIG = {
  categories: {
    title: 'Job Categories',
    eyebrow: 'Explore by role',
    subtitle: 'Browse hiring categories and open matching jobs instantly.',
    searchPlaceholder: 'Search job categories...',
    key: 'roles',
    icon: Briefcase
  },
  cities: {
    title: 'Cities',
    eyebrow: 'Explore by location',
    subtitle: 'Find jobs by city across India with quick alphabetical browsing.',
    searchPlaceholder: 'Search cities...',
    key: 'cities',
    icon: MapPin
  },
  sectors: {
    title: 'Sectors',
    eyebrow: 'Explore by industry',
    subtitle: 'Find opportunities by sector and discover active employer demand.',
    searchPlaceholder: 'Search sectors...',
    key: 'sectors',
    icon: Building2
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
    count: Number(item?.count ?? item?.activeCount ?? 0)
  }))
  .filter((item) => item.name)
  .sort((a, b) => a.name.localeCompare(b.name));

const getDirectoryLetter = (name = '') => {
  const first = String(name).trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
};

export default function FacetDirectoryPage() {
  const location = useLocation();
  const directoryType = location.pathname.includes('/jobs/cities')
    ? 'cities'
    : location.pathname.includes('/jobs/sectors')
      ? 'sectors'
      : 'categories';
  const config = DIRECTORY_CONFIG[directoryType] || DIRECTORY_CONFIG.categories;
  const Icon = config.icon;
  const [facets, setFacets] = useState({ roles: [], cities: [], sectors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState('All');

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
          sectors: payload.sectors || []
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
  const letters = useMemo(() => {
    const availableLetters = new Set(items.map((item) => getDirectoryLetter(item.name)));
    return ['All', ...Array.from(availableLetters).sort((a, b) => a.localeCompare(b))];
  }, [items]);
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery = !normalizedQuery || item.name.toLowerCase().includes(normalizedQuery);
      const matchesLetter = activeLetter === 'All' || getDirectoryLetter(item.name) === activeLetter;
      return matchesQuery && matchesLetter;
    });
  }, [activeLetter, items, query]);
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

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <section className="border-b border-slate-200 bg-white px-[4vw] py-6">
        <div className="mx-auto w-full max-w-[1760px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3f56ad]/10 text-[#3f56ad]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3f56ad]">{config.eyebrow}</p>
                <h1 className="mt-1 font-heading text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {items.length ? `${items.length.toLocaleString('en-IN')} ${config.title}` : config.title}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-[#3f56ad]/30 hover:text-[#3f56ad]">
                Home
              </Link>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 rounded-full bg-[#3f56ad] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_20px_rgba(43,69,154,0.18)] transition hover:bg-[#31468f]"
              >
                All jobs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            {config.subtitle}
          </p>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={config.searchPlaceholder}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#3f56ad]/40 focus:bg-white focus:ring-4 focus:ring-[#3f56ad]/10"
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

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
              <span className="text-slate-900">{filteredItems.length.toLocaleString('en-IN')}</span>
              <span>shown</span>
            </div>
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
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
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
                      className="mt-5 rounded-full bg-[#3f56ad] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#31468f]"
                    >
                      Clear filters
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-5">
                  {groupedItems.map((group) => (
                    <section key={group.letter} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3f56ad]/10 text-sm font-black text-[#3f56ad]">
                          {group.letter}
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                          {group.items.length.toLocaleString('en-IN')} results
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
                              <span className="shrink-0 rounded-full bg-[#3f56ad]/10 px-2 py-0.5 text-[0.68rem] font-black text-[#3f56ad]">
                                {item.count}
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
