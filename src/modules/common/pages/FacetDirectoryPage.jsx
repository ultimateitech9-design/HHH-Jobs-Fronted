import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, Building2, MapPin } from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const DIRECTORY_CONFIG = {
  categories: {
    title: 'Job Categories',
    subtitle: 'Browse every category and open matching jobs.',
    key: 'roles',
    icon: Briefcase
  },
  cities: {
    title: 'Cities',
    subtitle: 'Explore jobs by city across India.',
    key: 'cities',
    icon: MapPin
  },
  sectors: {
    title: 'Sectors',
    subtitle: 'Find opportunities by hiring sector.',
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

  const items = useMemo(() => normalizeItems(facets[config.key]), [config.key, facets]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white px-[4vw] py-8 md:py-10">
        <div className="mx-auto w-[92vw]">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#3f56ad] hover:text-[#31468f]">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3f56ad]/10 text-[#3f56ad]">
                <Icon className="h-5 w-5" />
              </div>
              <h1 className="font-heading text-3xl font-semibold tracking-normal text-slate-900 md:text-4xl">
                {items.length ? `${items.length} ${config.title}` : config.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                {config.subtitle}
              </p>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-full bg-[#3f56ad] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(43,69,154,0.20)] transition hover:bg-[#31468f]"
            >
              All jobs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-[4vw] py-8 md:py-10">
        <div className="mx-auto w-[92vw]">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 24 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-full bg-white shadow-sm" />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-rose-100 bg-white p-6 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="flex flex-wrap gap-3">
              {items.map((item) => {
                const active = item.count > 0;
                return (
                  <Link
                    key={`${directoryType}-${item.name}`}
                    to={buildFacetPath(directoryType, item.name)}
                    className={`inline-flex min-h-[2.35rem] max-w-full items-center gap-1.5 rounded-full px-4 py-2 text-[0.92rem] font-semibold leading-tight transition focus:outline-none focus:ring-4 ${
                      active
                        ? 'bg-[#3f56ad] text-white shadow-[0_10px_22px_rgba(43,69,154,0.20)] hover:-translate-y-0.5 hover:bg-[#31468f] focus:ring-[#3f56ad]/20'
                        : 'border border-slate-200 bg-white text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-[#3f56ad]/40 hover:text-[#31468f] focus:ring-slate-200'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    {active ? <span className="shrink-0 rounded-full bg-white/15 px-1.5 text-[0.68rem] text-white/85">{item.count}</span> : null}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
