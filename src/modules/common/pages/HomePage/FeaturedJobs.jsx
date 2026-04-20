import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bookmark, Briefcase, Clock3, MapPin, Sparkles } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const getCompanyMark = (name = '') =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'CO';

const FeaturedCompanyMark = ({ companyLogo, companyName }) => {
  const [logoError, setLogoError] = useState(false);

  if (companyLogo && !logoError) {
    return (
      <img
        src={companyLogo}
        alt={companyName}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-10 w-10 rounded-2xl border border-slate-200 bg-white object-contain p-1.5 shadow-sm"
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary text-sm font-heading font-bold text-white shadow-lg shadow-navy/20">
      {getCompanyMark(companyName)}
    </div>
  );
};

function SkeletonCard() {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse" aria-hidden="true">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-10 w-10 rounded-2xl bg-slate-200" />
        <div className="h-6 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-3/4 rounded bg-slate-300" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-24 rounded-full bg-slate-100" />
          <div className="h-6 w-24 rounded-full bg-slate-100" />
        </div>
      </div>
    </article>
  );
}

const getJobExcerpt = (job = {}) => {
  const excerpt = String(job.description || '').trim();
  if (!excerpt) {
    return 'Clearer role expectations, verified employer visibility, and faster application movement.';
  }
  return excerpt.length > 150 ? `${excerpt.slice(0, 147).trimEnd()}...` : excerpt;
};

const getJobHref = (job = {}) => {
  const jobId = job.id || job._id;
  return jobId && !job.isFallback ? `/portal/student/jobs/${jobId}` : '/portal/student/jobs';
};

export function FeaturedJobs({
  jobs,
  loading,
  error,
  currentPage,
  totalPages,
  pagination,
  onPageChange,
  onRefresh
}) {
  return (
    <section id="jobs" className="bg-secondary-50/50 px-4 py-20">
      <div className="container mx-auto max-w-7xl">
        <AnimatedSection className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-extrabold text-navy md:text-4xl">
              Featured <span className="gradient-text">Opportunities</span>
            </h2>
            <p className="mt-3 text-slate-500">Hand-picked jobs from verified companies.</p>
          </div>
          <Link to="/portal/student/jobs" className="inline-flex">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-transform hover:translate-x-1">
              View all jobs <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </AnimatedSection>

        {error ? (
          <article className="mb-8 rounded-2xl border border-danger-200 bg-danger-50 p-6 text-danger-700">
            <h3 className="font-bold">{error}</h3>
          </article>
        ) : null}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : null}

        {!loading && !error && jobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, index) => (
              <AnimatedSection key={job.id || job._id || index} delay={index * 0.05}>
                <motion.article
                  whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(17, 33, 59, 0.1)' }}
                  whileTap={{ scale: 0.985 }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-colors hover:border-brand-200"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-100/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-4 flex items-start justify-between">
                      <FeaturedCompanyMark companyLogo={job.companyLogo} companyName={job.companyName} />
                      <div className="flex items-center gap-2">
                        {index % 2 === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-1 text-[11px] font-semibold text-gold-dark">
                            <Sparkles className="h-3 w-3" /> Hot
                          </span>
                        ) : null}
                        <button type="button" className="text-slate-400 transition-colors hover:text-brand-600">
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="line-clamp-2 min-h-[56px] font-heading text-lg font-semibold text-slate-900 transition-colors group-hover:text-brand-700">
                      {job.jobTitle || 'Open Role'}
                    </h3>
                    <p className="mt-1 line-clamp-1 min-h-[20px] text-sm text-slate-500">{job.companyName || 'Hiring Company'}</p>
                    <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-600">{getJobExcerpt(job)}</p>

                    <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.jobLocation || 'India'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {job.jobType || job.employmentType || 'Full-time'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.experienceLevel || 'Competitive'}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4">
                      <span className="text-xs text-slate-500">{job.isFallback ? 'Verified fallback role' : 'Recently updated'}</span>
                      <Link to={getJobHref(job)}>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-transform hover:translate-x-1">
                          Apply Now <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              </AnimatedSection>
            ))}
          </div>
        ) : null}

        {!loading && !error && jobs.length === 0 ? (
          <article className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            <h3 className="text-lg font-bold text-slate-900">No featured jobs available right now.</h3>
          </article>
        ) : null}

        {!loading && !error && totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Prev
            </button>
            {pagination.map((page) => (
              <button
                key={page}
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                  currentPage === page ? 'gradient-primary text-white shadow-lg shadow-navy/20' : 'bg-white text-slate-600 hover:bg-brand-50'
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        ) : null}

        <div className="mt-10 flex items-center justify-center gap-4 border-t border-slate-200 pt-8">
          <button
            type="button"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-navy"
            onClick={onRefresh}
          >
            Refresh roles
          </button>
          <div className="h-1 w-1 rounded-full bg-slate-300"></div>
          <Link to="/portal/student/jobs" className="text-sm font-semibold text-brand-700 hover:underline">
            Explore all jobs
          </Link>
        </div>
      </div>
    </section>
  );
}
