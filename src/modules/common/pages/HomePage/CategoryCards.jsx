import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { categoryCards } from './data/categoryCards';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const formatCategoryHint = (keywords = []) =>
  keywords
    .slice(0, 2)
    .map((keyword) => keyword.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(' • ');

export function CategoryCards({ selectedCategory, onCategorySelect, onBrowseAll }) {
  return (
    <section id="about" className="px-4 pb-5 pt-20 md:pb-6">
      <div className="container mx-auto max-w-7xl">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="font-heading text-3xl font-extrabold text-navy md:text-4xl">
            Explore by <span className="gradient-text">Category</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-slate-500">
            Browse opportunities across industries that match your skills and current search intent.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categoryCards.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory?.title === category.title;

            return (
              <AnimatedSection key={category.title} delay={0.04}>
                <motion.article
                  role="button"
                  tabIndex={0}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group glass-card relative min-h-[190px] cursor-pointer overflow-hidden rounded-3xl border p-6 text-center ${
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
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.45 }}
                      className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                        isActive
                          ? 'gradient-primary text-white'
                          : 'bg-brand-50 text-brand-700 group-hover:gradient-gold group-hover:text-primary'
                      }`}
                    >
                      <Icon size={24} />
                    </motion.div>
                    <h3 className="font-heading font-semibold text-slate-900">{category.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{category.count}</p>
                    <p className="mt-3 text-xs text-slate-500">{formatCategoryHint(category.keywords)}</p>
                  </div>
                </motion.article>
              </AnimatedSection>
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
