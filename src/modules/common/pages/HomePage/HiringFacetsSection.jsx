import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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
  if (kind === 'pincode') params.set('pincode', name);
  return `/jobs?${params.toString()}`;
};

const formatGroupTitle = (count, label) => `${count >= 50 ? `${count}+` : count} ${label}`;

const FacetChip = ({ kind, item }) => (
  <Link
    to={buildFacetPath(kind, item.name)}
    className="group inline-flex min-h-[2.35rem] items-center gap-1.5 rounded-full bg-[#3f56ad] px-4 py-2 text-[0.92rem] font-medium leading-tight text-white shadow-[0_8px_18px_rgba(43,69,154,0.18)] transition hover:-translate-y-0.5 hover:bg-[#31468f] focus:outline-none focus:ring-4 focus:ring-[#3f56ad]/20"
  >
    <span>{item.name}</span>
    <span className="text-[0.75rem] text-white/78">{item.count}</span>
  </Link>
);

const FacetGroup = ({ title, kind, items }) => {
  if (!items.length) return null;

  return (
    <section className="min-w-0">
      <div className="mb-5">
        <h2 className="font-heading text-[1.55rem] font-medium tracking-normal text-slate-700 md:text-[1.85rem]">
          {title}
        </h2>
        <div className="mt-1 h-1 w-8 rounded-full bg-[#f2b51f]" />
      </div>

      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <FacetChip key={`${kind}-${item.name}`} kind={kind} item={item} />
        ))}
      </div>
    </section>
  );
};

const normalizeItems = (items = []) => (Array.isArray(items) ? items : [])
  .map((item) => ({
    name: String(item?.name || '').trim(),
    count: Number(item?.count || 0)
  }))
  .filter((item) => item.name && item.count > 0);

export function HiringFacetsSection({ facets }) {
  const roles = normalizeItems(facets?.roles);
  const sectors = normalizeItems(facets?.sectors);
  const cities = normalizeItems(facets?.cities);
  const pincodes = normalizeItems(facets?.pincodes);
  const hasAnyFacet = roles.length || sectors.length || cities.length || pincodes.length;

  if (!hasAnyFacet) return null;

  return (
    <section className="bg-white px-[4vw] py-10 md:py-12">
      <div className="mx-auto grid w-[92vw] gap-10 lg:grid-cols-2 xl:grid-cols-3">
        <FacetGroup
          title={formatGroupTitle(roles.length, 'Job Categories')}
          kind="role"
          items={roles}
        />
        <FacetGroup
          title={formatGroupTitle(sectors.length, 'Market Sectors')}
          kind="sector"
          items={sectors}
        />
        <FacetGroup
          title={formatGroupTitle(cities.length, 'Cities')}
          kind="city"
          items={cities}
        />
        {pincodes.length ? (
          <section className="min-w-0 xl:col-span-3">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-heading text-[1.45rem] font-medium tracking-normal text-slate-700 md:text-[1.7rem]">
                  {formatGroupTitle(pincodes.length, 'Pincodes')}
                </h2>
                <div className="mt-1 h-1 w-8 rounded-full bg-[#f2b51f]" />
              </div>
              <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f56ad] hover:text-[#31468f]">
                View all jobs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {pincodes.map((item) => (
                <FacetChip key={`pincode-${item.name}`} kind="pincode" item={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
