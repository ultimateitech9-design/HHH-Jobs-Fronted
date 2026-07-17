import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark, Briefcase, Clock3, MapPin, Sparkles } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';
import { getCurrentUser } from '../../../../utils/auth';
import { getStudentSavedJobs, saveJobForStudent } from '../../../student/services/studentApi';
import { buildCompanyLogoUrl } from '../../services/companyLogoUrl';
import { buildJobSeoPath } from '../../../../shared/utils/seoRoutes';

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
        className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1.5 shadow-sm"
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-primary text-xs font-heading font-bold text-white shadow-md shadow-navy/20">
      {getCompanyMark(companyName)}
    </div>
  );
};

function SkeletonCard() {
  return (
    <article className="min-h-[292px] animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-hidden="true">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-200" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-2.5 w-16 rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-9 w-9 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-4/5 rounded bg-slate-300" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
        <div className="h-10 rounded-md bg-slate-100" />
        <div className="flex gap-2">
          <div className="h-7 w-24 rounded-full bg-slate-100" />
          <div className="h-7 w-24 rounded-full bg-slate-100" />
        </div>
      </div>
    </article>
  );
}

const getJobExcerpt = (job = {}) => {
  const excerpt = String(job.description || '').trim();
  if (!excerpt) {
    return 'Role details are available from the hiring source.';
  }
  return excerpt.length > 150 ? `${excerpt.slice(0, 147).trimEnd()}...` : excerpt;
};

const buildPublicJobsPath = (job = {}) => {
  const params = new URLSearchParams();
  if (job.sourceKey) params.set('source', job.sourceKey);
  if (job.jobTitle) params.set('search', job.jobTitle);
  if (job.companyName) params.set('company', job.companyName);
  if (job.jobLocation) params.set('location', job.jobLocation);
  return `/jobs${params.toString() ? `?${params.toString()}` : ''}`;
};

const getJobHref = (job = {}, isAuthenticated = false, currentUser = null) => {
  if (job.sourceType === 'external') {
    return job.companyWebsite || buildPublicJobsPath(job);
  }

  const jobId = job.id || job._id;
  if (jobId && !job.isFallback) {
    const basePath = isAuthenticated
      ? currentUser?.role === 'retired_employee'
        ? '/portal/retired/jobs'
        : '/portal/student/jobs'
      : '/jobs';
    return buildJobSeoPath(basePath, job);
  }

  return buildPublicJobsPath(job);
};

export function FeaturedJobs({
  jobs,
  loading,
  error
}) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [saveMessage, setSaveMessage] = useState('');
  const jobsIndexPath = '/jobs';
  const isStudentViewer = currentUser?.role === 'student' || currentUser?.role === 'retired_employee';

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
      navigate(`/login?redirect=${encodeURIComponent(getJobHref(job, false, currentUser))}`);
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
    <section id="jobs" className="bg-[linear-gradient(180deg,rgba(243,247,253,0.4),rgba(255,248,236,0.2))] pb-12 pt-5 md:pb-14 md:pt-6">
      <div className="vw-shell">
        <AnimatedSection className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-brand-700">Featured hiring</p>
            <h2 className="mt-1.5 font-heading text-[1.65rem] font-semibold tracking-[-0.04em] text-navy md:text-[2.15rem]">
              Featured <span className="gradient-text">Opportunities</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Curated openings from active employers, with the essentials ready for a faster decision.
            </p>
          </div>
          <Link
            to={jobsIndexPath}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <span className="inline-flex items-center gap-2">
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
          <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : null}

        {!loading && !error && jobs.length > 0 ? (
          <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
            {jobs.map((job, index) => (
              <AnimatedSection key={job.id || job._id || index} delay={index * 0.05} className="h-full">
                <article
                  className="group relative flex h-full min-h-[292px] w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-[0_12px_28px_-24px_rgba(17,33,59,0.5)] transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_24px_46px_-22px_rgba(17,33,59,0.3)] focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100"
                >
                  <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-[linear-gradient(90deg,#d99b20,#14549a)] transition-transform duration-300 group-hover:scale-x-100 group-focus-within:scale-x-100" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FeaturedCompanyMark
                          companyLogo={job.companyLogo}
                          companyName={job.companyName}
                          websiteUrl={job.companyWebsite || ''}
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-xs font-semibold text-slate-700">
                            {job.companyName || 'Company not provided'}
                          </p>
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                            <Sparkles className="h-3 w-3 text-[#d99b20]" />
                            {job.sourceType === 'external' ? 'Live feed' : 'Featured role'}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${savedJobIds.has(job.id || job._id) ? 'border-brand-200 bg-brand-50 text-brand-700' : ''}`}
                          onClick={(event) => handleSaveJob(event, job)}
                          aria-label="Save job"
                          aria-pressed={savedJobIds.has(job.id || job._id)}
                          title="Save job"
                        >
                          <Bookmark className="h-4 w-4" fill={savedJobIds.has(job.id || job._id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <h3 className="line-clamp-2 min-h-[3rem] font-heading text-base font-semibold leading-6 text-navy transition-colors group-hover:text-brand-700">
                      {job.jobTitle || 'Role title not provided'}
                    </h3>
                    <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-slate-600">{getJobExcerpt(job)}</p>

                    <div className="mt-4 space-y-3 text-xs text-slate-600">
                      <span className="flex min-w-0 items-start gap-2" title={job.jobLocation || 'Location not provided'}>
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                        <span className="line-clamp-1">
                          {job.jobLocation || 'Location not provided'}
                        </span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                          <Clock3 className="h-3 w-3 text-brand-600" />
                          {job.jobType || job.employmentType || 'Type not provided'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                          <Briefcase className="h-3 w-3 text-brand-600" />
                          {job.experienceLevel || 'Experience not provided'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                      <span className="text-[11px] font-medium text-slate-500">
                        {job.sourceType === 'external' ? 'Live-feed role' : 'Recently updated'}
                      </span>
                      <Link
                        to={getJobHref(job, isStudentViewer, currentUser)}
                        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md bg-navy px-3 text-xs font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          View role <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              </AnimatedSection>
            ))}
          </div>
        ) : null}

        {!loading && !error && jobs.length === 0 ? (
          <article className="rounded-[24px] border border-slate-200 bg-white p-6 text-center text-slate-500">
            <h3 className="text-lg font-medium text-slate-900">No featured jobs available right now.</h3>
          </article>
        ) : null}
      </div>
    </section>
  );
}
