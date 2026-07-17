import { useRef, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Grid2X2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoryCards } from './data/categoryCards';

const DESKTOP_PREVIEW_COUNT = 8;
const MOBILE_PREVIEW_COUNT = 4;

const formatCategoryHint = (keywords = []) =>
  keywords
    .slice(0, 2)
    .map((keyword) => keyword.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(' • ');

const buildCategoryPath = (searchTerm = '') => {
  const params = new URLSearchParams();
  params.set('search', searchTerm);
  return `/jobs?${params.toString()}`;
};

export function CategoryCards() {
  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef(null);

  const handleToggle = () => {
    if (!showAll) {
      setShowAll(true);
      return;
    }

    setShowAll(false);
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      sectionRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  };

  return (
    <section ref={sectionRef} aria-labelledby="job-categories-title" className="border-b border-slate-200 bg-white pb-14 pt-14 sm:pb-16 sm:pt-16">
      <div className="vw-shell">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase text-brand-700">Opportunity directory</p>
            <h2 id="job-categories-title" className="mt-2 font-heading text-3xl font-black text-navy md:text-4xl">
              Explore work by category.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Move from a broad interest to roles, companies, and skills that match your direction.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
            <Grid2X2 className="h-4 w-4 text-brand-700" aria-hidden="true" />
            {categoryCards.length} career paths
          </div>
        </div>

        <div id="home-category-grid" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map((category, index) => {
            const Icon = category.icon;
            const hideOnDesktop = !showAll && index >= DESKTOP_PREVIEW_COUNT;
            const hideOnMobileOnly = !showAll && index >= MOBILE_PREVIEW_COUNT && index < DESKTOP_PREVIEW_COUNT;
            const cardVisibility = hideOnDesktop ? 'hidden' : hideOnMobileOnly ? 'hidden sm:block' : '';
            const shouldLoadImage = showAll || index < DESKTOP_PREVIEW_COUNT;

            return (
              <Link
                key={category.title}
                to={buildCategoryPath(category.searchTerm)}
                aria-label={`Browse ${category.title} jobs in India`}
                className={`public-cinematic-card group relative min-h-[210px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-left shadow-[0_14px_30px_rgba(15,23,42,0.10)] outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${cardVisibility}`}
              >
                {shouldLoadImage ? (
                  <img
                    src={category.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-90"
                    style={{ objectPosition: category.imagePosition }}
                  />
                ) : null}
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,12,24,0.12)_0%,rgba(3,12,24,0.72)_58%,rgba(3,12,24,0.96)_100%)]" aria-hidden="true" />
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" aria-hidden="true" />

                <div className="relative z-10 flex min-h-[210px] flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-slate-950/45 text-amber-300 backdrop-blur-sm transition-transform group-hover:-translate-y-0.5 group-hover:border-amber-300/50">
                      <Icon size={21} aria-hidden="true" />
                    </div>
                    <span className="rounded-full border border-white/20 bg-slate-950/35 px-3 py-1 text-[10px] font-black uppercase text-white/85 backdrop-blur-sm">
                      Explore
                    </span>
                  </div>

                  <div>
                    <span className="font-heading text-lg font-black text-white drop-shadow-sm">{category.title}</span>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <p className="text-xs leading-5 text-slate-200">{formatCategoryHint(category.keywords)}</p>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition group-hover:border-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={showAll}
            aria-controls="home-category-grid"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-6 py-3 font-semibold text-white shadow-[0_12px_28px_rgba(15,47,82,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {showAll ? 'Show fewer categories' : 'View all categories'}
            {showAll ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
          </button>
          <Link
            to="/jobs/categories"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-navy shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
          >
            Open category directory <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
