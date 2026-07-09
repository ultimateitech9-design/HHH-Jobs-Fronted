import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Hash,
  Layers,
  Map,
  MapPin,
  Navigation,
  Search,
  X
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const EMPTY_TREE = {
  states: [],
  districts: [],
  cities: [],
  localities: [],
  districtsByState: {},
  citiesByDistrict: {},
  localitiesByCity: {},
  totals: { states: 0, districts: 0, cities: 0, localities: 0, pincodes: 0, openJobs: 0 }
};

const LEVELS = {
  STATES: 'states',
  DISTRICTS: 'districts',
  CITIES: 'cities',
  LOCALITIES: 'localities'
};

const LEVEL_COPY = {
  states: {
    label: 'States',
    title: 'Select a state',
    subtitle: 'Start from state cards. Every next level uses mapped DB data.',
    empty: 'No states found yet.'
  },
  districts: {
    label: 'Districts',
    title: 'Select a district',
    subtitle: 'Districts are mapped under the selected state.',
    empty: 'No districts found for this state.'
  },
  cities: {
    label: 'Cities',
    title: 'Select a city',
    subtitle: 'Cities are mapped under the selected district.',
    empty: 'No cities found for this district.'
  },
  localities: {
    label: 'Localities',
    title: 'Open locality jobs',
    subtitle: 'Locality and pincode records come from the normalized location database.',
    empty: 'No locality or pincode records found for this city.'
  }
};

const normalizeText = (value = '') => String(value || '').trim().replace(/\s+/g, ' ');
const formatCount = (value = 0) => Number(value || 0).toLocaleString('en-IN');

const makeScopeKey = (level, parentId = '') => `${level}:${parentId || 'root'}`;

const buildDirectoryEndpoint = ({ level = LEVELS.STATES, parentId = '', query = '', limit = 120 } = {}) => {
  const params = new URLSearchParams();
  params.set('level', level);
  params.set('limit', String(limit));
  if (parentId) params.set('parentId', parentId);
  if (query) params.set('q', query);
  return `/jobs/meta/location-directory?${params.toString()}`;
};

const readLocationDirectory = async (options) => {
  const response = await apiFetch(buildDirectoryEndpoint(options), { skipAuth: true, timeoutMs: 6000 });
  const payload = response.ok ? await response.json().catch(() => null) : null;
  if (!payload?.status) throw new Error('Unable to load mapped locations right now.');
  const directory = payload.locationDirectory || {};
  return {
    items: Array.isArray(directory.items) ? directory.items : [],
    totals: { ...EMPTY_TREE.totals, ...(directory.totals || {}) }
  };
};

const buildLocationJobPath = (item = {}) => {
  const params = new URLSearchParams();
  const type = item.type || '';

  if (type === 'state') {
    params.set('stateName', item.name);
    params.set('location', item.name);
  }
  if (type === 'district') {
    params.set('stateName', item.stateName || '');
    params.set('districtName', item.name);
    params.set('location', item.name);
  }
  if (type === 'city') {
    params.set('stateName', item.stateName || '');
    params.set('districtName', item.districtName || '');
    params.set('cityName', item.name);
    params.set('location', item.name);
  }
  if (type === 'locality') {
    params.set('stateName', item.stateName || '');
    params.set('districtName', item.districtName || '');
    params.set('cityName', item.cityName || '');
    params.set('location', item.name || item.cityName || '');
    if (item.pincode) params.set('pincode', item.pincode);
  }

  [...params.keys()].forEach((key) => {
    if (!normalizeText(params.get(key))) params.delete(key);
  });

  return `/jobs${params.toString() ? `?${params.toString()}` : ''}`;
};

const getItemSubtitle = (item = {}) => [
  item.cityName,
  item.districtName,
  item.stateName,
  item.pincode
].filter(Boolean).join(' • ');

function MetricPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.12em] text-slate-400">
        <Icon className="h-3.5 w-3.5 text-[#b97900]" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-1 text-xl font-black text-slate-950">{formatCount(value)}</div>
    </div>
  );
}

function BreadcrumbButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 max-w-full items-center rounded-full px-3 text-xs font-black transition ${
        active
          ? 'bg-[#263754] text-white shadow-[0_10px_22px_rgba(38,55,84,0.18)]'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-[#263754]/30 hover:text-[#263754]'
      }`}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}

function LocationCard({ item, level, onDrill }) {
  const isTerminal = level === LEVELS.LOCALITIES || item.type === 'locality';
  const stats = [
    item.districtCount ? `${formatCount(item.districtCount)} districts` : '',
    item.cityCount ? `${formatCount(item.cityCount)} cities` : '',
    item.localityCount ? `${formatCount(item.localityCount)} localities` : '',
    item.pincodeCount ? `${formatCount(item.pincodeCount)} pincodes` : '',
    item.jobCount ? `${formatCount(item.jobCount)} jobs` : ''
  ].filter(Boolean);
  const subtitle = getItemSubtitle(item);

  return (
    <article className="group grid min-h-[132px] rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-[#b97900]/40 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              item.type === 'locality' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-[#31468f]'
            }`}>
              {item.type === 'locality' ? <Hash className="h-4 w-4" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />}
            </span>
            <h2 className="truncate text-base font-black text-slate-950">{item.name}</h2>
          </div>
          {subtitle ? (
            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {item.jobCount ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[0.68rem] font-black text-emerald-700">
            {formatCount(item.jobCount)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {stats.length > 0 ? stats.map((stat) => (
          <span key={stat} className="rounded-full bg-slate-50 px-2.5 py-1 text-[0.68rem] font-black text-slate-500">
            {stat}
          </span>
        )) : (
          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[0.68rem] font-black text-slate-500">
            mapped
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 self-end">
        <Link
          to={buildLocationJobPath(item)}
          className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-[#b97900]/40 hover:text-[#8a5a00]"
        >
          Jobs
        </Link>
        {!isTerminal ? (
          <button
            type="button"
            onClick={() => onDrill(item)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#263754] px-3 text-xs font-black text-white transition hover:bg-[#1f2f4a]"
          >
            Open <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <Link
            to={buildLocationJobPath(item)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#263754] px-3 text-xs font-black text-white transition hover:bg-[#1f2f4a]"
          >
            View jobs <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}

export default function LocationDirectoryPage() {
  const [scopeItems, setScopeItems] = useState({});
  const [scopeLoading, setScopeLoading] = useState({});
  const [scopeErrors, setScopeErrors] = useState({});
  const [totals, setTotals] = useState(EMPTY_TREE.totals);
  const [searchResult, setSearchResult] = useState({ query: '', items: [], loading: false, error: '' });
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState({
    level: LEVELS.STATES,
    state: null,
    district: null,
    city: null
  });
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeText(deferredQuery);

  const currentScope = useMemo(() => {
    if (selection.level === LEVELS.DISTRICTS) {
      return {
        level: LEVELS.DISTRICTS,
        parentId: selection.state?.id || '',
        key: makeScopeKey(LEVELS.DISTRICTS, selection.state?.id)
      };
    }
    if (selection.level === LEVELS.CITIES) {
      return {
        level: LEVELS.CITIES,
        parentId: selection.district?.id || '',
        key: makeScopeKey(LEVELS.CITIES, selection.district?.id)
      };
    }
    if (selection.level === LEVELS.LOCALITIES) {
      return {
        level: LEVELS.LOCALITIES,
        parentId: selection.city?.id || '',
        key: makeScopeKey(LEVELS.LOCALITIES, selection.city?.id)
      };
    }
    return {
      level: LEVELS.STATES,
      parentId: '',
      key: makeScopeKey(LEVELS.STATES)
    };
  }, [selection]);

  useEffect(() => {
    if (normalizedQuery) return undefined;
    if (Object.prototype.hasOwnProperty.call(scopeItems, currentScope.key)) return undefined;
    if (currentScope.level !== LEVELS.STATES && !currentScope.parentId) return undefined;

    let cancelled = false;
    setScopeLoading((current) => ({ ...current, [currentScope.key]: true }));
    setScopeErrors((current) => ({ ...current, [currentScope.key]: '' }));

    const loadDirectory = async () => {
      try {
        const directory = await readLocationDirectory({
          level: currentScope.level,
          parentId: currentScope.parentId,
          limit: currentScope.level === LEVELS.STATES ? 80 : 240
        });
        if (cancelled) return;
        setTotals(directory.totals);
        setScopeItems((current) => ({ ...current, [currentScope.key]: directory.items }));
      } catch (error) {
        if (cancelled) return;
        setScopeErrors((current) => ({
          ...current,
          [currentScope.key]: error?.message || 'Unable to load mapped locations right now.'
        }));
      } finally {
        if (!cancelled) {
          setScopeLoading((current) => ({ ...current, [currentScope.key]: false }));
        }
      }
    };

    loadDirectory();
    return () => {
      cancelled = true;
    };
  }, [currentScope, normalizedQuery, scopeItems]);

  useEffect(() => {
    const searchText = normalizedQuery;
    if (!searchText) {
      setSearchResult({ query: '', items: [], loading: false, error: '' });
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchResult((current) => ({
        ...current,
        query: searchText,
        loading: true,
        error: ''
      }));
      try {
        const directory = await readLocationDirectory({ query: searchText, limit: 120 });
        if (cancelled) return;
        setTotals(directory.totals);
        setSearchResult({ query: searchText, items: directory.items, loading: false, error: '' });
      } catch (error) {
        if (cancelled) return;
        setSearchResult({
          query: searchText,
          items: [],
          loading: false,
          error: error?.message || 'Unable to search mapped locations right now.'
        });
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedQuery]);

  const hasCurrentScope = Object.prototype.hasOwnProperty.call(scopeItems, currentScope.key);
  const currentItems = scopeItems[currentScope.key] || [];
  const visibleItems = normalizedQuery ? searchResult.items : currentItems;
  const loading = normalizedQuery
    ? searchResult.loading
    : (!hasCurrentScope || Boolean(scopeLoading[currentScope.key]));
  const error = normalizedQuery ? searchResult.error : (scopeErrors[currentScope.key] || '');
  const copy = LEVEL_COPY[selection.level] || LEVEL_COPY.states;

  const drill = (item) => {
    if (item.type === 'state') {
      setSelection({ level: LEVELS.DISTRICTS, state: item, district: null, city: null });
    } else if (item.type === 'district') {
      setSelection({ level: LEVELS.CITIES, state: { id: item.stateId, name: item.stateName, type: 'state' }, district: item, city: null });
    } else if (item.type === 'city') {
      setSelection({
        level: LEVELS.LOCALITIES,
        state: { id: item.stateId, name: item.stateName, type: 'state' },
        district: { id: item.districtId, name: item.districtName, stateId: item.stateId, stateName: item.stateName, type: 'district' },
        city: item
      });
    }
    setQuery('');
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const jumpTo = (level) => {
    if (level === LEVELS.STATES) setSelection({ level, state: null, district: null, city: null });
    if (level === LEVELS.DISTRICTS && selection.state) setSelection((current) => ({ ...current, level, district: null, city: null }));
    if (level === LEVELS.CITIES && selection.district) setSelection((current) => ({ ...current, level, city: null }));
    if (level === LEVELS.LOCALITIES && selection.city) setSelection((current) => ({ ...current, level }));
    setQuery('');
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const goBack = () => {
    if (selection.level === LEVELS.LOCALITIES) {
      jumpTo(LEVELS.CITIES);
      return;
    }
    if (selection.level === LEVELS.CITIES) {
      jumpTo(LEVELS.DISTRICTS);
      return;
    }
    if (selection.level === LEVELS.DISTRICTS) {
      jumpTo(LEVELS.STATES);
    }
  };

  const levelLabel = normalizedQuery ? 'Search results' : copy.label;
  const summaryText = normalizedQuery
    ? `${formatCount(visibleItems.length)} matches for "${normalizedQuery}"`
    : `${formatCount(visibleItems.length)} ${copy.label.toLowerCase()} shown`;

  return (
    <main className="-mt-[calc(var(--public-navbar-height,74px)+2px)] min-h-screen bg-[#f6f8fb] text-slate-950">
      <section className="border-b border-slate-200 bg-white px-[4vw] py-6">
        <div className="mx-auto w-full max-w-[1760px]">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fff4dc] text-[#9a6500]">
                  <Navigation className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#31468f]">Mapped Location Directory</p>
                  <h1 className="mt-1 font-heading text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Jobs by State, District, City and Pincode
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 md:text-base">
                Browse real DB hierarchy: state cards first, then district, city, locality and pincode records for accurate nearby job filtering.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MetricPill icon={Globe2} label="states" value={totals.states} />
              <MetricPill icon={Layers} label="districts" value={totals.districts} />
              <MetricPill icon={Map} label="cities" value={totals.cities} />
              <MetricPill icon={Hash} label="pincodes" value={totals.pincodes} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search state, district, city, locality, or pincode..."
                className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-11 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#31468f]/45 focus:ring-4 focus:ring-[#31468f]/10"
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear location search"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-[#31468f]/30 hover:text-[#31468f]">
                Home
              </Link>
              <Link to="/jobs" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#263754] px-5 text-sm font-black text-white shadow-[0_12px_26px_rgba(38,55,84,0.18)] transition hover:bg-[#1f2f4a]">
                All jobs <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <BreadcrumbButton active={selection.level === LEVELS.STATES && !normalizedQuery} onClick={() => jumpTo(LEVELS.STATES)}>
              India
            </BreadcrumbButton>
            {selection.state ? (
              <>
                <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                <BreadcrumbButton active={selection.level === LEVELS.DISTRICTS && !normalizedQuery} onClick={() => jumpTo(LEVELS.DISTRICTS)}>
                  {selection.state.name}
                </BreadcrumbButton>
              </>
            ) : null}
            {selection.district ? (
              <>
                <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                <BreadcrumbButton active={selection.level === LEVELS.CITIES && !normalizedQuery} onClick={() => jumpTo(LEVELS.CITIES)}>
                  {selection.district.name}
                </BreadcrumbButton>
              </>
            ) : null}
            {selection.city ? (
              <>
                <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                <BreadcrumbButton active={selection.level === LEVELS.LOCALITIES && !normalizedQuery} onClick={() => jumpTo(LEVELS.LOCALITIES)}>
                  {selection.city.name}
                </BreadcrumbButton>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="px-[4vw] py-6 md:py-8">
        <div className="mx-auto w-full max-w-[1760px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#31468f]">{levelLabel}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{normalizedQuery ? 'Filtered locations' : copy.title}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{normalizedQuery ? 'Search checks name, mapped location path and pincode.' : copy.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-slate-500" aria-live="polite">
              {selection.level !== LEVELS.STATES && !normalizedQuery ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-[#31468f]/30 hover:text-[#31468f]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
              ) : null}
              <span className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {summaryText}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white" />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && visibleItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-lg font-black text-slate-900">{normalizedQuery ? 'No matching mapped location found' : copy.empty}</p>
              <p className="mt-2 text-sm text-slate-500">Try another state, city, locality, or six digit pincode.</p>
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-5 rounded-full bg-[#263754] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1f2f4a]"
                >
                  Clear search
                </button>
              ) : null}
            </div>
          ) : null}

          {!loading && !error && visibleItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleItems.map((item) => (
                <LocationCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  level={normalizedQuery ? item.type : selection.level}
                  onDrill={drill}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
