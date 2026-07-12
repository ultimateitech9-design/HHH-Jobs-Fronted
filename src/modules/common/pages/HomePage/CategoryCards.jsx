import { ArrowRight } from 'lucide-react';
import { categoryCards } from './data/categoryCards';

const formatCategoryHint = (keywords = []) =>
  keywords
    .slice(0, 2)
    .map((keyword) => keyword.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(' • ');

export function CategoryCards({ selectedCategory, onCategorySelect, onBrowseAll }) {
  return (
    <section id="about" className="border-b border-slate-200 bg-white pb-14 pt-14 sm:pb-16 sm:pt-16">
      <div className="vw-shell">
        <div className="mb-9 max-w-3xl">
          <p className="text-[11px] font-black uppercase text-brand-700">Opportunity directory</p>
          <h2 className="mt-2 font-heading text-3xl font-black text-navy md:text-4xl">
            Explore work by category.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Move from a broad interest to roles, companies, and skills that match your direction.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory?.title === category.title;

            return (
              <article
                key={category.title}
                role="button"
                tabIndex={0}
                className={`public-cinematic-card group relative min-h-[170px] cursor-pointer overflow-hidden rounded-lg border p-5 text-left outline-none ${
                  isActive ? 'border-brand-300 bg-brand-50 shadow-[0_16px_36px_rgba(15,23,42,0.08)]' : 'border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]'
                }`}
                onClick={() => onCategorySelect(category.searchTerm, category)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onCategorySelect(category.searchTerm, category);
                  }
                }}
              >
                <div className="relative z-10 flex h-full flex-col">
                  <div
                    className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg transition-transform group-hover:-translate-y-0.5 ${
                      isActive
                        ? 'gradient-primary text-white'
                        : 'bg-brand-50 text-brand-700 group-hover:bg-brand-100'
                    }`}
                  >
                    <Icon size={21} />
                  </div>
                  <h3 className="font-heading text-base font-black text-slate-900">{category.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{formatCategoryHint(category.keywords)}</p>
                  <span className="mt-auto flex items-center justify-end pt-4 text-brand-700">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-navy shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
            onClick={onBrowseAll}
          >
            Browse All Categories <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
