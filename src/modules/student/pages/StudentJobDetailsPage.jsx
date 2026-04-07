import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiMapPin, FiBriefcase, FiDollarSign, FiClock, FiBookmark, FiCheckCircle, FiChevronLeft, FiStar, FiActivity, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import { getCurrentUser } from '../../../utils/auth';
import {
  applyToJob,
  getFriendlyApplyErrorMessage,
  getCompanyReviews,
  getStudentJobById,
  getStudentSavedJobs,
  removeSavedJobForStudent,
  runAtsCheck,
  saveJobForStudent
} from '../services/studentApi';

const StudentJobDetailsPage = () => {
  const { jobId } = useParams();
  const user = getCurrentUser();
  const jobsListPath = user?.role === 'retired_employee' ? '/portal/retired/jobs' : '/portal/student/jobs';
  const resumeSectionPath = '/portal/student/profile?section=resume';
  const [state, setState] = useState({
    loading: true,
    error: '',
    job: null,
    isSaved: false
  });
  const [coverLetter, setCoverLetter] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '', ctaTo: '', ctaLabel: '' });
  const [atsResult, setAtsResult] = useState(null);
  const [reviews, setReviews] = useState({ summary: null, rows: [] });

  const setActionSuccess = (text) => setActionFeedback({ type: 'success', text, ctaTo: '', ctaLabel: '' });
  const setActionError = (text, ctaTo = '') => setActionFeedback({ type: 'error', text, ctaTo, ctaLabel: ctaTo ? 'Open Resume Section' : '' });
  const setApplyError = (error) => {
    const text = getFriendlyApplyErrorMessage(error);
    const rawMessage = String(error?.message || '');
    const needsResume = /resume is required/i.test(rawMessage) || /profile resume missing/i.test(text);
    setActionError(text, needsResume ? resumeSectionPath : '');
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const [jobResponse, savedResponse] = await Promise.all([
          getStudentJobById(jobId),
          getStudentSavedJobs()
        ]);

        if (!mounted) return;

        const job = jobResponse.data;
        const savedSet = new Set((savedResponse.data || []).map((item) => item.jobId || item.job_id));

        setState({
          loading: false,
          error: job ? '' : 'Job not found.',
          job,
          isSaved: savedSet.has(jobId)
        });

        if (job?.companyName) {
          const reviewResponse = await getCompanyReviews(job.companyName);
          if (!mounted) return;
          setReviews({ summary: reviewResponse.data.summary, rows: reviewResponse.data.reviews || [] });
        }
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || 'Unable to load job details.'
        }));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [jobId]);

  const salaryLabel = useMemo(() => {
    if (!state.job) return '-';
    return `${state.job.minPrice || '-'} - ${state.job.maxPrice || '-'} ${state.job.salaryType || ''}`;
  }, [state.job]);

  const handleSaveToggle = async () => {
    if (!state.job) return;
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    if (state.isSaved) {
      try {
        await removeSavedJobForStudent(jobId);
      } catch (error) {
        setActionError(error.message || 'Unable to unsave job.');
        return;
      }
      setState((current) => ({ ...current, isSaved: false }));
      setActionSuccess('Job removed from saved list.');
      return;
    }

    try {
      await saveJobForStudent(jobId);
    } catch (error) {
      if (/already saved/i.test(String(error.message || ''))) {
        setState((current) => ({ ...current, isSaved: true }));
        setActionSuccess('Job saved successfully.');
        return;
      }
      setActionError(error.message || 'Unable to save job.');
      return;
    }

    setState((current) => ({ ...current, isSaved: true }));
    setActionSuccess('Job saved successfully.');
  };

  const handleApply = async () => {
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    try {
      await applyToJob({ jobId, coverLetter });
      setActionSuccess('Application submitted successfully.');
    } catch (error) {
      setApplyError(error);
    }
  };

  const handleAtsCheck = async () => {
    setActionFeedback({ type: '', text: '', ctaTo: '', ctaLabel: '' });

    try {
      const result = await runAtsCheck({ jobId, source: 'profile_resume' });
      setAtsResult(result?.result || null);
      setActionSuccess('ATS check completed.');
    } catch (error) {
      setActionError(error.message || 'Unable to run ATS check.');
    }
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!state.job) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-12 shadow-soft border border-neutral-100">
          <div className="w-20 h-20 bg-error-50 rounded-full flex items-center justify-center mx-auto mb-6 text-error-400">
            <FiCheckCircle size={32} className="rotate-45" />
          </div>
          <h3 className="text-2xl font-bold font-heading text-primary mb-4">Job Not Found</h3>
          <p className="text-neutral-500 mb-8">{state.error || "The job you're looking for doesn't exist or has been removed."}</p>
          <Link to={jobsListPath} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 transition-colors">
            <FiChevronLeft /> Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Top Navigation */}
      <div className="mb-6">
        <Link to={jobsListPath} className="inline-flex items-center gap-2 text-neutral-500 hover:text-brand-600 font-medium transition-colors">
          <FiChevronLeft /> Back to Jobs
        </Link>
      </div>

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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Job Content & Application */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-neutral-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-50 to-teal-50 rounded-bl-full opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 font-heading font-bold text-3xl flex-shrink-0 shadow-sm">
                    {state.job.companyName?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold font-heading text-primary leading-tight mb-2">
                      {state.job.jobTitle}
                    </h1>
                    <Link to="#" className="text-lg font-medium text-brand-600 hover:text-brand-700 transition-colors">
                      {state.job.companyName}
                    </Link>
                  </div>
                </div>
                <StatusPill value={state.job.status || 'open'} />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-8 mt-6">
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-100">
                  <FiMapPin className="text-brand-500" /> <span className="font-medium">{state.job.jobLocation}</span>
                </div>
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-100">
                  <FiBriefcase className="text-brand-500" /> <span className="font-medium">{state.job.experienceLevel || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-100">
                  <FiClock className="text-brand-500" /> <span className="font-medium">{state.job.employmentType || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 bg-success-50 text-success-700 px-3 py-2 rounded-lg border border-success-100">
                  <FiDollarSign /> <span className="font-bold">{salaryLabel}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                {(state.job.skills || []).map((skill) => (
                  <span key={skill} className="px-4 py-1.5 bg-brand-50 text-brand-700 font-semibold rounded-lg text-sm">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="border-t border-neutral-100 pt-8 flex flex-wrap gap-4">
                <button 
                  type="button" 
                  className="flex-1 min-w-[200px] px-8 py-3.5 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-2 text-lg" 
                  onClick={() => document.getElementById('apply-section').scrollIntoView({ behavior: 'smooth' })}
                >
                  Apply Now <FiArrowRight />
                </button>
                <button 
                  type="button" 
                  className={`px-8 py-3.5 border-2 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${state.isSaved ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600'}`} 
                  onClick={handleSaveToggle}
                >
                  <FiBookmark className={state.isSaved ? 'fill-current' : ''} />
                  {state.isSaved ? 'Saved' : 'Save Job'}
                </button>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-neutral-100">
            <h2 className="text-xl font-bold font-heading text-primary mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand-500 rounded-full inline-block"></span>
              Job Description
            </h2>
            <div className="prose prose-brand max-w-none text-neutral-600 leading-relaxed whitespace-pre-line">
              {state.job.description || 'No description provided.'}
            </div>
          </div>

          {/* Application Form */}
          <div id="apply-section" className="bg-white rounded-3xl p-8 shadow-soft border border-brand-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full pointer-events-none"></div>
            
            <h2 className="text-xl font-bold font-heading text-primary mb-2 relative z-10">
              Apply for this position
            </h2>
            <p className="text-neutral-500 mb-6 relative z-10">Use your platform profile and resume to apply instantly.</p>
            
            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                  Cover Letter <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={5}
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit for this role..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-medium resize-y"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-100">
                <button 
                  type="button" 
                  className="flex-1 px-8 py-3.5 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 hover:shadow-md transition-all flex items-center justify-center gap-2" 
                  onClick={handleApply}
                >
                  <FiCheckCircle size={18} /> Submit Application
                </button>
                <button 
                  type="button" 
                  className="px-6 py-3.5 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2" 
                  onClick={handleAtsCheck}
                >
                  <FiActivity size={18} /> ATS Check
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: ATS & Company Info */}
        <div className="space-y-8">
          
          {/* ATS Score Card */}
          {atsResult ? (
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-neutral-100">
              <h3 className="text-lg font-bold font-heading text-primary mb-6 flex items-center gap-2">
                <FiActivity className="text-brand-500" /> Resume Match Score
              </h3>
              
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="text-neutral-100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className={atsResult.score >= 70 ? 'text-success-500' : atsResult.score >= 40 ? 'text-warning-500' : 'text-error-500'}
                      strokeDasharray={`${atsResult.score}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-extrabold text-primary">{atsResult.score}</span>
                    <span className="text-xs font-bold text-neutral-400 -mt-1">/ 100</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Keywords</span>
                  <span className="font-bold text-primary">{atsResult.keywordScore}/100</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1.5">
                  <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${atsResult.keywordScore}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-sm mt-4">
                  <span className="text-neutral-500">Similarity</span>
                  <span className="font-bold text-primary">{atsResult.similarityScore}/100</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1.5">
                  <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${atsResult.similarityScore}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-sm mt-4">
                  <span className="text-neutral-500">Format</span>
                  <span className="font-bold text-primary">{atsResult.formatScore}/100</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1.5">
                  <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${atsResult.formatScore}%` }}></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 space-y-3">
                {atsResult.missingKeywords && atsResult.missingKeywords.length > 0 && (
                  <div>
                    <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Missing Keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {atsResult.missingKeywords.slice(0, 5).map(kw => (
                        <span key={kw} className="px-2 py-1 bg-error-50 text-error-600 text-[10px] font-bold rounded-md">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-brand-500 to-indigo-600 rounded-3xl p-6 shadow-soft text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiActivity size={24} />
              </div>
              <h3 className="text-lg font-bold font-heading mb-2">Check Resume Match</h3>
              <p className="text-brand-100 text-sm mb-6 leading-relaxed">Run our AI-powered ATS checker to see how well your profile matches this job description before applying.</p>
              <button 
                type="button" 
                className="w-full px-4 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-sm"
                onClick={handleAtsCheck}
              >
                Scan Resume
              </button>
            </div>
          )}

          {/* Company Reviews */}
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-neutral-100">
            <h3 className="text-lg font-bold font-heading text-primary mb-4 flex items-center justify-between">
              Company Reviews
              <div className="flex items-center gap-1 bg-warning-50 text-warning-600 px-2 py-1 rounded text-sm">
                <FiStar className="fill-current" /> {reviews.summary?.averageRating || '0.0'}
              </div>
            </h3>
            
            <p className="text-sm text-neutral-500 mb-6 pb-4 border-b border-neutral-100">
              Based on {reviews.summary?.count || 0} reviews from employees.
            </p>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {reviews.rows.length > 0 ? (
                reviews.rows.map((review) => (
                  <div key={review.id} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-primary">{review.title || 'Review'}</h4>
                      <div className="flex text-warning-400 text-xs gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} className={i < review.rating ? 'fill-current' : 'text-neutral-300'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">{review.review}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-neutral-500 text-sm">
                  <FiStar className="mx-auto text-neutral-300 mb-2" size={24} />
                  No reviews available for this company yet.
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default StudentJobDetailsPage;
