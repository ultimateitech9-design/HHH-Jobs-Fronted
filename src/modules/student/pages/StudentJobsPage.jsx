import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiSearch, FiMapPin, FiBriefcase, FiFilter, FiBookmark, FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import { getCurrentUser } from '../../../utils/auth';
import {
  applyToJob,
  getFriendlyApplyErrorMessage,
  getStudentApplications,
  getStudentJobs,
  getStudentSavedJobs,
  removeSavedJobForStudent,
  saveJobForStudent
} from '../services/studentApi';

const makeDefaultFilters = (audience = '') => ({
  search: '',
  location: '',
  employmentType: '',
  experienceLevel: '',
  category: '',
  audience,
  page: 1,
  limit: 8
});

const getCompanyInitials = (value = '') =>
  String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'C';

const CompanyLogoBadge = ({ companyLogo, companyName }) => {
  const [logoError, setLogoError] = useState(false);

  if (companyLogo && !logoError) {
    return (
      <img
        src={companyLogo}
        alt={companyName}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="w-14 h-14 rounded-2xl border border-neutral-200 bg-white object-contain p-2 flex-shrink-0 group-hover:scale-110 transition-transform"
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 font-heading font-bold text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
      {getCompanyInitials(companyName)}
    </div>
  );
};

const StudentJobsPage = ({
  forcedAudience = '',
  eyebrow = 'Student Jobs',
  title = 'Search and Apply Jobs',
  subtitle = 'Filter jobs, save opportunities, and apply directly with profile resume.',
  detailsPathBase = '/portal/student/jobs'
}) => {
  const resumeSectionPath = '/portal/student/profile?section=resume';
  const currentUser = useMemo(() => getCurrentUser(), []);
  const effectiveAudience = forcedAudience || (currentUser?.role === 'retired_employee' ? 'retired_employee' : '');
  const [filters, setFilters] = useState(() => makeDefaultFilters(effectiveAudience));
  const [jobsState, setJobsState] = useState({ jobs: [], pagination: null, loading: true, error: '' });
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '', ctaTo: '', ctaLabel: '' });

  useEffect(() => {
    setFilters(makeDefaultFilters(effectiveAudience));
  }, [effectiveAudience]);

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      setJobsState((current) => ({ ...current, loading: true, error: '' }));

      const response = await getStudentJobs(filters);
      if (!mounted) return;

      setJobsState({
        jobs: response.data.jobs || [],
        pagination: response.data.pagination,
        loading: false,
        error: response.error || ''
      });
    };

    loadJobs();

    return () => {
      mounted = false;
    };
  }, [filters]);

  useEffect(() => {
    let mounted = true;

    const primeData = async () => {
      const [savedResponse, applicationResponse] = await Promise.all([
        getStudentSavedJobs(),
        getStudentApplications()
      ]);

      if (!mounted) return;

      const nextSaved = new Set((savedResponse.data || []).map((item) => item.jobId || item.job_id));
      const nextApplied = new Set((applicationResponse.data || []).map((item) => item.jobId || item.job_id));

      setSavedIds(nextSaved);
      setAppliedIds(nextApplied);
    };

    primeData();

    return () => {
      mounted = false;
    };
  }, []);

  const hasFilters = useMemo(
    () => Boolean(filters.search || filters.location || filters.employmentType || filters.experienceLevel || filters.category),
    [filters]
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const setActionSuccess = (text) => setActionFeedback({ type: 'success', text, ctaTo: '', ctaLabel: '' });
  const setActionError = (text, ctaTo = '') => setActionFeedback({ type: 'error', text, ctaTo, ctaLabel: ctaTo ? 'Open Resume Section' : '' });
  const setApplyError = (error) => {
    const text = getFriendlyApplyErrorMessage(error);
    const rawMessage = String(error?.message || '');
    const needsResume = /resume is required/i.test(rawMessage) || /profile resume missing/i.test(text);
    setActionError(text, needsResume ? resumeSectionPath : '');
  };

  const handleSaveToggle = async (jobId) => {
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    if (savedIds.has(jobId)) {
      try {
        await removeSavedJobForStudent(jobId);
      } catch (error) {
        setActionError(error.message || 'Unable to remove saved job.');
        return;
      }

      setSavedIds((current) => {
        const copy = new Set(current);
        copy.delete(jobId);
        return copy;
      });
      setActionSuccess('Removed from saved jobs.');
      return;
    }

    try {
      await saveJobForStudent(jobId);
    } catch (error) {
      if (/already saved/i.test(String(error.message || ''))) {
        setSavedIds((current) => new Set([...current, jobId]));
        setActionSuccess('Job saved successfully.');
        return;
      }
      setActionError(error.message || 'Unable to save job.');
      return;
    }

    setSavedIds((current) => new Set([...current, jobId]));
    setActionSuccess('Job saved successfully.');
  };

  const handleApply = async (jobId) => {
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    if (appliedIds.has(jobId)) {
      setActionError('You already applied for this job.');
      return;
    }

    try {
      await applyToJob({ jobId, coverLetter: '' });
      setAppliedIds((current) => new Set([...current, jobId]));
      setActionSuccess('Application submitted successfully.');
    } catch (error) {
      if (/already applied/i.test(String(error.message || ''))) {
        setAppliedIds((current) => new Set([...current, jobId]));
        setActionError('You already applied for this job.');
        return;
      }

      setApplyError(error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
      />

      {jobsState.error && (
        <div className="mb-6 p-4 bg-error-50 border-l-4 border-error-500 text-error-700 rounded-lg shadow-sm">
          {jobsState.error}
        </div>
      )}
      
      {actionFeedback.text && (
        <div className={`mb-6 rounded-lg border-l-4 p-4 shadow-sm ${actionFeedback.type === 'error' ? 'border-red-500 bg-red-50 text-red-700' : 'border-success-500 bg-success-50 text-success-700'}`}>
          <div className="flex flex-wrap items-center gap-2">
            {actionFeedback.type === 'error' ? <FiAlertCircle className="text-red-500" /> : <FiCheckCircle className="text-success-500" />}
            <span>{actionFeedback.text}</span>
            {actionFeedback.ctaTo ? (
              <Link to={actionFeedback.ctaTo} className="inline-flex items-center rounded-full border border-current px-3 py-1 text-xs font-bold">
                {actionFeedback.ctaLabel}
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <section className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6 mb-10 mt-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
          <div className="flex-1 w-full relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-medium"
              placeholder="Search by title, company, skill"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </div>
          <div className="flex-1 w-full relative">
            <FiMapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-medium"
              placeholder="Location"
              value={filters.location}
              onChange={(event) => updateFilter('location', event.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
          <div className="flex-1 w-full relative">
            <FiBriefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-medium"
              placeholder="Employment Type"
              value={filters.employmentType}
              onChange={(event) => updateFilter('employmentType', event.target.value)}
            />
          </div>
          <div className="flex-1 w-full">
            <input
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-medium"
              placeholder="Experience Level"
              value={filters.experienceLevel}
              onChange={(event) => updateFilter('experienceLevel', event.target.value)}
            />
          </div>
          <div className="flex-1 w-full relative">
            <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-medium"
              placeholder="Category"
              value={filters.category}
              onChange={(event) => updateFilter('category', event.target.value)}
            />
          </div>
          
          {hasFilters && (
            <div className="w-full md:w-auto mt-2 md:mt-0">
              <button 
                type="button" 
                className="w-full md:w-auto px-6 py-3 text-sm font-bold text-error-600 hover:bg-error-50 rounded-xl transition-colors" 
                onClick={() => setFilters(makeDefaultFilters(effectiveAudience))}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </section>

      {jobsState.loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-0">
        {jobsState.jobs.map((job) => {
          const jobId = job.id || job._id;
          const isSaved = savedIds.has(jobId);
          const isApplied = appliedIds.has(jobId);

          return (
            <article className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 hover:shadow-lg transition-all flex flex-col group relative overflow-hidden" key={jobId}>
              {/* Subtle background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              
              <div className="relative z-10 flex justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <CompanyLogoBadge companyLogo={job.companyLogo} companyName={job.companyName} />
                  <div>
                    <h3 className="text-xl font-bold font-heading text-primary line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {job.jobTitle}
                    </h3>
                    <p className="text-neutral-500 font-medium">
                      {job.companyName}
                    </p>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <StatusPill value={job.status || 'open'} />
                </div>
              </div>

              <div className="relative z-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600 mb-6">
                <span className="flex items-center gap-1.5 font-medium"><FiMapPin className="text-brand-400" /> {job.jobLocation}</span>
                <span className="flex items-center gap-1.5 font-medium"><FiBriefcase className="text-brand-400" /> {job.experienceLevel || 'Experience not specified'}</span>
                {job.salaryType && <span className="flex items-center gap-1.5 font-medium whitespace-nowrap px-2 py-0.5 bg-success-50 text-success-700 rounded text-xs">{job.minPrice || '-'} - {job.maxPrice || '-'} {job.salaryType || ''}</span>}
                
                {(job.targetAudience || job.audience) && String(job.targetAudience || job.audience).toLowerCase() !== 'all' && (
                  <span className="flex items-center gap-1.5 font-medium whitespace-nowrap px-2 py-0.5 bg-warning-50 text-warning-700 rounded text-xs">Audience: {String(job.targetAudience || job.audience).replace('_', ' ')}</span>
                )}
              </div>

              <div className="relative z-10 flex flex-wrap gap-2 mb-8">
                {(job.skills || []).slice(0, 5).map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-semibold">
                    {skill}
                  </span>
                ))}
                {(job.skills || []).length > 5 && (
                  <span className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 text-neutral-500 rounded-lg text-xs font-semibold">
                    +{job.skills.length - 5}
                  </span>
                )}
              </div>

              <div className="mt-auto relative z-10 flex flex-wrap items-center gap-3 pt-6 border-t border-neutral-100">
                <Link to={`${detailsPathBase}/${jobId}`} className="px-6 py-2.5 rounded-xl border-2 border-brand-100 text-brand-600 font-bold hover:bg-brand-50 hover:border-brand-200 transition-colors flex-1 text-center whitespace-nowrap">
                  View Details
                </Link>
                
                <button
                  type="button"
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isSaved ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-neutral-200 text-neutral-400 hover:text-brand-500 hover:border-brand-200 hover:bg-brand-50'}`}
                  onClick={() => handleSaveToggle(jobId)}
                  aria-label={isSaved ? "Unsave job" : "Save job"}
                  title={isSaved ? "Remove from saved jobs" : "Save this job"}
                >
                  <FiBookmark className={isSaved ? "fill-current" : ""} size={20} />
                </button>
                
                <button
                  type="button"
                  className={`px-8 py-3 rounded-xl font-bold transition-all shadow-sm flex-1 sm:flex-none ${
                    isApplied 
                      ? 'bg-success-100 text-success-700 cursor-not-allowed border border-success-200' 
                      : 'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                  onClick={() => handleApply(jobId)}
                  disabled={isApplied}
                >
                  {isApplied ? (
                    <span className="flex items-center justify-center gap-2"><FiCheckCircle /> Applied</span>
                  ) : 'Apply Now'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {(!jobsState.loading && jobsState.jobs.length === 0) && (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100 mb-8 max-w-2xl mx-auto shadow-sm mt-8">
          <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-300">
            <FiSearch size={32} />
          </div>
          <h3 className="text-2xl font-bold font-heading text-primary mb-2">No jobs found</h3>
          <p className="text-neutral-500 mb-8">Try adjusting your filters or search terms to find what you&apos;re looking for.</p>
          <button 
            type="button" 
            className="px-6 py-3 bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 transition-colors"
            onClick={() => setFilters(makeDefaultFilters(effectiveAudience))}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {jobsState.pagination && jobsState.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12 bg-white px-6 py-4 rounded-full shadow-sm border border-neutral-100 w-max mx-auto">
          <button
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-neutral-200 text-primary"
            disabled={jobsState.pagination.page <= 1}
            onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
            aria-label="Previous Page"
          >
            <FiChevronLeft size={20} />
          </button>
          
          <span className="text-sm font-bold text-neutral-600 min-w-24 text-center">
            Page {jobsState.pagination.page} <span className="font-normal text-neutral-400 mx-1">/</span> {jobsState.pagination.totalPages}
          </span>
          
          <button
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-neutral-200 text-primary"
            disabled={jobsState.pagination.page >= jobsState.pagination.totalPages}
            onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
            aria-label="Next Page"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentJobsPage;
