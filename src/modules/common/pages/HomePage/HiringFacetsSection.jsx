import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const GROUP_LIMITS = {
  role: 48,
  city: 72,
  sector: 90
};

const GROUP_DIRECTORY_PATHS = {
  role: '/jobs/categories',
  city: '/jobs/cities',
  sector: '/jobs/sectors'
};

const buildFacetPath = (kind, name) => {
  const params = new URLSearchParams();
  if (kind === 'role') params.set('search', name);
  if (kind === 'sector') {
    params.set('category', name);
    params.set('sector', name);
  }
  if (kind === 'city') {
    params.set('location', name);
    params.set('city', name);
  }
  return `/jobs?${params.toString()}`;
};

const formatGroupTitle = (count, label) => `${count} ${label}`;

const normalizeItems = (items = []) => (Array.isArray(items) ? items : [])
  .map((item) => {
    const count = Number(item?.count ?? item?.activeCount ?? 0);
    const totalCount = Number(item?.totalCount ?? item?.total_count ?? count);
    return {
      name: String(item?.name || '').trim(),
      count,
      totalCount,
      hasHiring: Boolean(item?.hasHiring ?? count > 0)
    };
  })
  .filter((item) => item.name);

const FacetChip = ({ kind, item }) => {
  const active = item.count > 0;
  const baseClassName = 'group inline-flex min-h-[2.25rem] max-w-full items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.86rem] font-semibold leading-tight transition focus:outline-none focus:ring-4 sm:px-4 sm:text-[0.92rem]';
  const activeClassName = 'bg-[#3f56ad] text-white shadow-[0_10px_22px_rgba(43,69,154,0.20)] hover:-translate-y-0.5 hover:bg-[#31468f] focus:ring-[#3f56ad]/20';
  const idleClassName = 'border border-slate-200 bg-white text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-[#3f56ad]/40 hover:text-[#31468f] focus:ring-slate-200';

  return (
    <Link
      to={buildFacetPath(kind, item.name)}
      className={`${baseClassName} ${active ? activeClassName : idleClassName}`}
    >
      <span className="truncate">{item.name}</span>
      {active ? (
        <span className={`shrink-0 rounded-full px-1.5 text-[0.68rem] ${active ? 'bg-white/15 text-white/85' : 'bg-slate-100 text-slate-500'}`}>
          {item.count}
        </span>
      ) : null}
    </Link>
  );
};

const FacetGroup = ({ title, kind, items, compact = false }) => {
  const limit = GROUP_LIMITS[kind] || 24;
  const activeItems = items.filter((item) => item.count > 0).length;
  const visibleItems = items.slice(0, limit);
  const hiddenCount = Math.max(0, items.length - visibleItems.length);

  if (!items.length) return null;

  return (
    <section className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 md:mb-5">
        <div>
          <h2 className="font-heading text-[1.52rem] font-medium tracking-normal text-slate-800 md:text-[1.85rem]">
            {title}
          </h2>
          <div className="mt-1.5 h-1 w-9 rounded-full bg-[#f2b51f]" />
        </div>
        {activeItems ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {activeItems} hiring
          </span>
        ) : null}
      </div>

      <div className={`flex flex-wrap ${compact ? 'gap-2.5' : 'gap-3'}`}>
        {visibleItems.map((item) => (
          <FacetChip key={`${kind}-${item.name}`} kind={kind} item={item} />
        ))}
      </div>

      {hiddenCount ? (
        <Link
          to={GROUP_DIRECTORY_PATHS[kind] || '/jobs'}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#3f56ad] shadow-sm transition hover:border-[#3f56ad]/40 hover:text-[#31468f] focus:outline-none focus:ring-4 focus:ring-[#3f56ad]/15"
        >
          Show {hiddenCount} more <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  );
};

export function HiringFacetsSection({ facets }) {
  const roles = useMemo(() => normalizeItems(facets?.roles), [facets?.roles]);
  const sectors = useMemo(() => normalizeItems(facets?.sectors), [facets?.sectors]);
  const cities = useMemo(() => normalizeItems(facets?.cities), [facets?.cities]);
  const hasAnyFacet = roles.length || sectors.length || cities.length;

  if (!hasAnyFacet) return null;

  return (
    <section className="bg-white px-[4vw] py-10 md:py-12">
      <div className="mx-auto w-[92vw]">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <FacetGroup
            title={formatGroupTitle(roles.length, 'Job Categories')}
            kind="role"
            items={roles}
          />
          <FacetGroup
            title={formatGroupTitle(cities.length, 'Cities')}
            kind="city"
            items={cities}
          />
        </div>

        {sectors.length ? (
          <div className="mt-10 border-t border-slate-100 pt-10">
            <FacetGroup
              title={formatGroupTitle(sectors.length, 'Sectors')}
              kind="sector"
              items={sectors}
              compact
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
