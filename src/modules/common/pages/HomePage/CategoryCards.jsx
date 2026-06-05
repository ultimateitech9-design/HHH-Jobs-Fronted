import { ArrowRight } from 'lucide-react';
import { categoryCards } from './data/categoryCards';

const formatCategoryHint = (keywords = []) =>
  keywords
    .slice(0, 2)
    .map((keyword) => keyword.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(' • ');

export function CategoryCards({ selectedCategory, onCategorySelect, onBrowseAll }) {
  return (
    <section id="about" className="pb-5 pt-20 md:pb-6">
      <div className="vw-shell">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-3xl font-bold text-navy md:text-4xl">
            Explore by <span className="gradient-text">Category</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categoryCards.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory?.title === category.title;

            return (
              <article
                key={category.title}
                role="button"
                tabIndex={0}
                className={`group glass-card relative min-h-[190px] cursor-pointer overflow-hidden rounded-3xl border p-6 text-center transition-transform hover:-translate-y-1 ${
                  isActive ? 'border-brand-200 bg-brand-50/70 shadow-strong shadow-brand-200/15' : 'border-slate-200/80 bg-white/90'
                }`}
                onClick={() => onCategorySelect(category.searchTerm, category)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onCategorySelect(category.searchTerm, category);
                  }
                }}
              >
                <div
                  className={`absolute inset-0 opacity-0 transition-opacity duration-500 ${
                    isActive
                      ? 'bg-gradient-to-br from-brand-100/70 via-transparent to-secondary-100/50 opacity-100'
                      : 'bg-gradient-to-br from-brand-100/50 via-transparent to-secondary-100/40 group-hover:opacity-100'
                  }`}
                />
                <div className="relative z-10">
                  <div
                    className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:rotate-3 ${
                      isActive
                        ? 'gradient-primary text-white'
                        : 'bg-brand-50 text-brand-700 group-hover:gradient-gold group-hover:text-primary'
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="font-heading font-semibold text-slate-900">{category.title}</h3>
                  <p className="mt-3 text-xs text-slate-500">{formatCategoryHint(category.keywords)}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 text-center">
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
