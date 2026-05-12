import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bookmark, Briefcase, Clock3, MapPin, Sparkles } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';
import { getCurrentUser } from '../../../../utils/auth';
import { getStudentSavedJobs, saveJobForStudent } from '../../../student/services/studentApi';
import { buildCompanyLogoUrl } from '../../services/companyLogoUrl';

const getCompanyMark = (name = '') =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'CO';

const FeaturedCompanyMark = ({ companyLogo, companyName, websiteUrl = '' }) => {
  const [logoError, setLogoError] = useState(false);
  const resolvedLogoUrl = buildCompanyLogoUrl(companyLogo, '', websiteUrl);

  if (resolvedLogoUrl && !logoError) {
    return (
      <img
        src={resolvedLogoUrl}
        alt={companyName}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-8 w-8 rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm"
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary text-xs font-heading font-bold text-white shadow-md shadow-navy/20">
      {getCompanyMark(companyName)}
    </div>
  );
};

function SkeletonCard() {
  return (
    <article className="min-h-[240px] animate-pulse rounded-[20px] border border-slate-200 bg-white/90 p-3 shadow-sm" aria-hidden="true">
      <div className="mb-2 flex items-start justify-between">
        <div className="h-7 w-7 rounded-xl bg-slate-200" />
        <div className="h-5 w-12 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-2/3 rounded bg-slate-300" />
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-20 rounded-full bg-slate-100" />
          <div className="h-6 w-20 rounded-full bg-slate-100" />
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
  if (job.sourceType === 'external') {
    const params = new URLSearchParams();
    if (job.sourceKey) params.set('source', job.sourceKey);
    if (job.jobTitle) params.set('search', job.jobTitle);
    const query = params.toString();
    return `/portal/student/global-jobs${query ? `?${query}` : ''}`;
  }

  const jobId = job.id || job._id;
  return jobId && !job.isFallback ? `/portal/student/jobs/${jobId}` : '/portal/student/jobs';
};

export function FeaturedJobs({
  jobs,
  loading,
  error,
  onRefresh
}) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const syncUser = () => setCurrentUser(getCurrentUser());

    window.addEventListener('auth-changed', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('auth-changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSavedJobs = async () => {
      if (!currentUser) {
        setSavedJobIds(new Set());
        return;
      }

      const response = await getStudentSavedJobs();
      if (!mounted) return;

      if (response.error) {
        return;
      }

      setSavedJobIds(new Set((response.data || []).map((item) => item.jobId || item.job_id).filter(Boolean)));
    };

    loadSavedJobs();

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const handleSaveJob = async (event, job) => {
    event.preventDefault();
    event.stopPropagation();

    const jobId = job?.id || job?._id;

    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(getJobHref(job))}`);
      return;
    }

    if (!jobId || job.sourceType === 'external' || job.isFallback) {
      setSaveMessage('Only verified HHH Jobs roles can be saved from this section.');
      return;
    }

    try {
      await saveJobForStudent(jobId);
      setSavedJobIds((current) => new Set([...current, jobId]));
      setSaveMessage('Job saved successfully.');
    } catch (saveError) {
      if (/already saved/i.test(String(saveError.message || ''))) {
        setSavedJobIds((current) => new Set([...current, jobId]));
        setSaveMessage('Job saved successfully.');
        return;
      }

      setSaveMessage(saveError.message || 'Unable to save this job right now.');
    }
  };

  return (
    <section id="jobs" className="bg-[linear-gradient(180deg,rgba(243,247,253,0.4),rgba(255,248,236,0.2))] px-4 pb-12 pt-5 md:pb-14 md:pt-6">
      <div className="container mx-auto max-w-[1420px]">
        <AnimatedSection className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-brand-700">Featured hiring</p>
            <h2 className="mt-1.5 font-heading text-[1.65rem] font-semibold tracking-[-0.04em] text-navy md:text-[2.15rem]">
              Featured <span className="gradient-text">Opportunities</span>
            </h2>
          </div>
          <Link to="/portal/student/jobs" className="inline-flex">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 transition-transform hover:translate-x-1">
              View all jobs <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </AnimatedSection>

        {error ? (
          <article className="mb-8 rounded-2xl border border-danger-200 bg-danger-50 p-6 text-danger-700">
            <h3 className="font-bold">{error}</h3>
          </article>
        ) : null}

        {saveMessage ? (
          <div className="mb-4 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-brand-700 shadow-sm">
            {saveMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : null}

        {!loading && !error && jobs.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {jobs.map((job, index) => (
              <AnimatedSection key={job.id || job._id || index} delay={index * 0.05}>
                <motion.article
                  whileHover={{ y: -3, boxShadow: '0 22px 42px -16px rgba(17, 33, 59, 0.14)' }}
                  whileTap={{ scale: 0.99 }}
                  className="group relative flex min-h-[240px] w-full flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] p-3 transition-colors hover:border-brand-200"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200/80 to-transparent" />
                  <div className="absolute -right-8 top-0 h-12 w-12 rounded-full bg-brand-50/80 blur-2xl" aria-hidden="true" />

                  <div className="relative z-10 flex flex-col">
                    <div className="mb-2 flex items-start justify-between">
                      <FeaturedCompanyMark
                        companyLogo={job.companyLogo}
                        companyName={job.companyName}
                        websiteUrl={job.companyWebsite || ''}
                      />
                      <div className="flex items-center gap-2">
                        {index % 2 === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand-100 bg-brand-50/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-brand-700">
                            <Sparkles className="h-2.5 w-2.5" /> Hot
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className={`text-slate-400 transition-colors hover:text-brand-600 ${savedJobIds.has(job.id || job._id) ? 'text-brand-600' : ''}`}
                          onClick={(event) => handleSaveJob(event, job)}
                          aria-label="Save job"
                        >
                          <Bookmark className="h-3.5 w-3.5" fill={savedJobIds.has(job.id || job._id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <h3 className="line-clamp-2 font-sans text-[0.88rem] font-medium leading-[1.15rem] text-slate-900 transition-colors group-hover:text-brand-700">
                      {job.jobTitle || 'Open Role'}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{job.companyName || 'Hiring Company'}</p>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-[18px] text-slate-600">{getJobExcerpt(job)}</p>

                    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10.5px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.jobLocation || 'India'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {job.jobType || job.employmentType || 'Full-time'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {job.experienceLevel || 'Competitive'}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/90 pt-2">
                      <span className="text-[10.5px] text-slate-500">
                        {job.sourceType === 'external' ? 'Live-feed role' : job.isFallback ? 'Verified fallback role' : 'Recently updated'}
                      </span>
                      <Link to={getJobHref(job)}>
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-700 transition-transform hover:translate-x-1">
                          Apply Now <ArrowRight className="h-3 w-3" />
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
          <article className="rounded-[24px] border border-slate-200 bg-white p-6 text-center text-slate-500">
            <h3 className="text-lg font-medium text-slate-900">No featured jobs available right now.</h3>
          </article>
        ) : null}

        <div className="mt-7 flex items-center justify-center gap-4 border-t border-slate-200 pt-6">
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
