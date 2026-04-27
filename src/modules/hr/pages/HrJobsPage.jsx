import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { 
  FiBriefcase, 
  FiPlus, 
  FiCreditCard, 
  FiCheckCircle, 
  FiXCircle, 
  FiEdit2, 
  FiTrash2, 
  FiUsers, 
  FiEye, 
  FiClock, 
  FiMapPin 
} from 'react-icons/fi';
import {
  checkoutPlanCredits,
  closeHrJob,
  createHrJob,
  deleteHrJob,
  formatDateTime,
  getEmptyJobDraft,
  getHrJobs,
  getHrPricingCredits,
  getHrPricingPurchases,
  getJobDraftFromJob,
  getPricingPlanQuote,
  getPricingPlans,
  updateHrJob
} from '../services/hrApi';

const initialCheckoutForm = {
  planSlug: '',
  quantity: 1,
  provider: 'manual',
  referenceId: '',
  note: '',
  paymentStatus: 'pending'
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isFreePlan = (plan = {}) => {
  if (plan.isFree === true) return true;
  if (String(plan.slug || '').toLowerCase() === 'free') return true;
  return toSafeNumber(plan.price, 0) <= 0;
};

const getStatusColor = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'open': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'closed': return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'paid': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'free': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const HrJobsPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'post', 'billing'
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [draft, setDraft] = useState(getEmptyJobDraft());
  const [editingJobId, setEditingJobId] = useState('');
  const [saving, setSaving] = useState(false);

  const [plans, setPlans] = useState([]);
  const [creditsSummary, setCreditsSummary] = useState({ credits: [], byPlan: {}, totals: { total: 0, used: 0, remaining: 0 } });
  const [purchases, setPurchases] = useState([]);
  const [pricingError, setPricingError] = useState('');
  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  const normalizedPlans = useMemo(
    () => plans.map((plan) => ({
      ...plan,
      slug: String(plan.slug || '').trim(),
      currency: plan.currency || 'INR',
      isFreeNormalized: isFreePlan(plan)
    })),
    [plans]
  );

  const paidPlans = useMemo(() => normalizedPlans.filter((plan) => !plan.isFreeNormalized), [normalizedPlans]);

  const selectedPlan = useMemo(
    () =>
      normalizedPlans.find((plan) => plan.slug === draft.planSlug)
      || normalizedPlans.find((plan) => plan.slug === 'free')
      || normalizedPlans[0]
      || null,
    [normalizedPlans, draft.planSlug]
  );

  const checkoutPlan = useMemo(
    () => normalizedPlans.find((plan) => plan.slug === checkoutForm.planSlug) || paidPlans[0] || null,
    [normalizedPlans, paidPlans, checkoutForm.planSlug]
  );

  const selectedPlanCredits = useMemo(() => {
    if (!selectedPlan) return 0;
    return Number(creditsSummary?.byPlan?.[selectedPlan.slug]?.remaining || 0);
  }, [selectedPlan, creditsSummary]);

  const checkoutQuantity = useMemo(() => {
    const parsed = Number(checkoutForm.quantity);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.floor(parsed);
  }, [checkoutForm.quantity]);

  const planNameBySlug = useMemo(
    () => Object.fromEntries(normalizedPlans.map((plan) => [plan.slug, plan.name || plan.slug])),
    [normalizedPlans]
  );

  const requestedAudience = useMemo(() => {
    const value = new URLSearchParams(location.search).get('audience');
    return value === 'retired_employee' || value === 'all' || value === 'student' ? value : '';
  }, [location.search]);

  useEffect(() => {
    if (requestedAudience === 'retired_employee') {
      setActiveTab('post');
    }
  }, [requestedAudience]);

  const resolveDraftLocations = (jobDraft = draft) => {
    const locations = [
      ...String(jobDraft.jobLocationsInput || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      String(jobDraft.jobLocation || '').trim()
    ].filter(Boolean);

    return [...new Set(locations)];
  };

  const loadPricingState = async () => {
    const [plansRes, creditsRes, purchasesRes] = await Promise.all([
      getPricingPlans(),
      getHrPricingCredits(),
      getHrPricingPurchases({ status: '' })
    ]);

    const nextPlans = plansRes.data || [];

    setPlans(nextPlans);
    setCreditsSummary(creditsRes.data || { credits: [], byPlan: {}, totals: { total: 0, used: 0, remaining: 0 } });
    setPurchases(purchasesRes.data || []);
    setPricingError([plansRes.error, creditsRes.error, purchasesRes.error].filter(Boolean).join(' | '));

    const firstPaidPlan = nextPlans.find((plan) => !isFreePlan(plan));

    setCheckoutForm((current) => {
      const currentPlanIsValidPaid = nextPlans.some((plan) => plan.slug === current.planSlug && !isFreePlan(plan));
      return {
        ...current,
        planSlug: currentPlanIsValidPaid ? current.planSlug : (firstPaidPlan?.slug || '')
      };
    });

    const freePlan = nextPlans.find((plan) => plan.slug === 'free') || nextPlans[0];
    if (freePlan) {
      setDraft((current) => ({
        ...current,
        planSlug: nextPlans.some((plan) => plan.slug === current.planSlug) ? current.planSlug : freePlan.slug
      }));
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      const jobsRes = await getHrJobs();
      if (!mounted) return;

      setJobs(jobsRes.data || []);
      setError(jobsRes.error || '');
      setLoading(false);

      await loadPricingState();
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadQuote = async () => {
      if (!checkoutPlan || checkoutPlan.isFreeNormalized) {
        setQuote(null);
        setQuoteError('');
        return;
      }

      setQuoteLoading(true);
      setQuoteError('');

      try {
        const response = await getPricingPlanQuote({
          planSlug: checkoutPlan.slug,
          quantity: checkoutQuantity
        });

        if (!active) return;
        setQuote(response);
      } catch (quoteRequestError) {
        if (!active) return;
        setQuote(null);
        setQuoteError(String(quoteRequestError.message || 'Unable to fetch quote from backend.'));
      } finally {
        if (active) setQuoteLoading(false);
      }
    };

    loadQuote();

    return () => {
      active = false;
    };
  }, [checkoutPlan, checkoutQuantity]);

  useEffect(() => {
    if (!requestedAudience || editingJobId) return;

    setDraft((current) => ({ ...current, targetAudience: requestedAudience }));
  }, [requestedAudience, editingJobId]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === 'all') return jobs;
    return jobs.filter((job) => String(job.status || '').toLowerCase() === statusFilter);
  }, [jobs, statusFilter]);

  const updateDraftField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setEditingJobId('');
    setDraft({ ...getEmptyJobDraft(), planSlug: selectedPlan?.slug || 'free' });
    setActiveTab('jobs');
  };

  const validateDraft = () => {
    const requiredFields = ['jobTitle', 'companyName', 'salaryType', 'experienceLevel', 'employmentType', 'description'];
    const missing = requiredFields.filter((key) => !String(draft[key] || '').trim());

    if (missing.length > 0) {
      return `Missing required fields: ${missing.join(', ')}`;
    }

    const resolvedLocations = resolveDraftLocations();
    if (resolvedLocations.length === 0) {
      return 'At least one job location is required.';
    }

    if (selectedPlan) {
      const descriptionLimit = Number(selectedPlan.maxDescriptionChars || 0);
      if (descriptionLimit > 0 && String(draft.description || '').length > descriptionLimit) {
        return `Description exceeds ${selectedPlan.maxDescriptionChars} characters for ${selectedPlan.name}.`;
      }

      const locationsLimit = Number(selectedPlan.maxLocations || 0);
      if (locationsLimit > 0 && resolvedLocations.length > locationsLimit) {
        return `${selectedPlan.name} allows maximum ${selectedPlan.maxLocations} location(s).`;
      }

      if (!editingJobId && !selectedPlan.isFreeNormalized && selectedPlanCredits <= 0) {
        return `No remaining ${selectedPlan.name} credits. Purchase credits before posting.`;
      }
    }

    return '';
  };

  const handleSubmitJob = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      if (editingJobId) {
        const updated = await updateHrJob(editingJobId, draft);
        setJobs((current) => current.map((job) => ((job.id || job._id) === editingJobId ? { ...job, ...updated } : job)));
        setMessage('Job updated successfully.');
      } else {
        const created = await createHrJob(draft);
        setJobs((current) => [created, ...current]);
        setMessage(`Job created successfully on ${selectedPlan?.name || 'selected'} plan.`);
        await loadPricingState();
      }

      resetForm();
    } catch (submitError) {
      setError(String(submitError.message || 'Failed to save job.'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (job) => {
    setEditingJobId(job.id || job._id);
    setDraft(getJobDraftFromJob(job));
    setActiveTab('post');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseJob = async (jobId) => {
    setMessage('');
    setError('');

    try {
      const updated = await closeHrJob(jobId);
      setJobs((current) => current.map((job) => ((job.id || job._id) === jobId ? { ...job, ...updated } : job)));
      setMessage('Job closed successfully.');
    } catch (closeError) {
      setError(String(closeError.message || 'Unable to close job.'));
    }
  };

  const handleDeleteJob = async (jobId) => {
    if(!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;
    
    setMessage('');
    setError('');

    try {
      await deleteHrJob(jobId);
      setJobs((current) => current.filter((job) => (job.id || job._id) !== jobId));
      setMessage('Job deleted successfully.');
    } catch (deleteError) {
      setError(String(deleteError.message || 'Unable to delete job.'));
    }
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!paidPlans.length) {
      setError('No paid plans available right now. Contact admin to configure pricing plans.');
      return;
    }

    if (!checkoutPlan || checkoutPlan.isFreeNormalized) {
      setError('Select a paid plan to purchase credits.');
      return;
    }

    if (!Number.isFinite(checkoutQuantity) || checkoutQuantity < 1) {
      setError('Quantity must be at least 1.');
      return;
    }

    setCheckoutSaving(true);

    try {
      const response = await checkoutPlanCredits({
        planSlug: checkoutPlan.slug,
        quantity: checkoutQuantity,
        provider: checkoutForm.provider,
        referenceId: checkoutForm.referenceId,
        note: checkoutForm.note,
        paymentStatus: checkoutForm.paymentStatus
      });

      await loadPricingState();
      setMessage(
        response?.purchase?.status === 'paid'
          ? 'Credits purchased and activated successfully.'
          : 'Purchase created in pending state. Admin approval is required to activate credits.'
      );
      setCheckoutForm((current) => ({
        ...current,
        quantity: 1,
        referenceId: '',
        note: ''
      }));
    } catch (checkoutError) {
      const errText = String(checkoutError.message || 'Unable to create purchase.');
      setError(errText);
    } finally {
      setCheckoutSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-primary tracking-tight mb-2">Job Postings</h1>
          <p className="text-neutral-500 text-lg">Manage your active jobs, post new roles, and oversee billing.</p>
        </div>
        <div className="flex bg-neutral-100 rounded-xl p-1 w-full md:w-auto overflow-x-auto hide-scrollbar">
          <button
            onClick={() => { setActiveTab('jobs'); setEditingJobId(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'jobs' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-primary'
            }`}
          >
            <FiBriefcase size={16} /> My Jobs
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'post' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-primary'
            }`}
          >
            <FiPlus size={16} /> Post a Job
          </button>
          <button
            onClick={() => { setActiveTab('billing'); setEditingJobId(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'billing' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-primary'
            }`}
          >
            <FiCreditCard size={16} /> Billing & Credits
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-200 shadow-sm animate-fade-in">
          <FiXCircle size={20} className="shrink-0" /> <span className="font-semibold">{error}</span>
        </div>
      )}
      {message && !error && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 border border-emerald-200 shadow-sm animate-fade-in">
          <FiCheckCircle size={20} className="shrink-0" /> <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* JOBS TAB */}
      {activeTab === 'jobs' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-primary">Filter By Status:</span>
              <div className="flex bg-neutral-50 rounded-lg p-1">
                {['all', 'open', 'closed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-colors ${
                      statusFilter === filter ? 'bg-white text-brand-600 shadow-sm border border-neutral-200' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm font-bold text-neutral-500">
              {filteredJobs.length} Jobs Found
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-neutral-100"></div>)}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map(job => (
                <div key={job.id || job._id} className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-all flex flex-col group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold text-primary leading-tight mb-1 group-hover:text-brand-600 transition-colors">{job.jobTitle}</h3>
                      <p className="text-sm font-medium text-neutral-500">{job.companyName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(job.status || 'open')}`}>
                      {job.status || 'open'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6 text-sm text-neutral-600 relative z-10 font-medium">
                    <div className="flex items-center gap-2"><FiMapPin className="text-neutral-400" /> {job.jobLocation || 'Remote'}</div>
                    <div className="flex items-center gap-2"><FiBriefcase className="text-neutral-400" /> {job.experienceLevel || 'Any Experience'} • {job.employmentType || 'Full-Time'}</div>
                    <div className="flex items-center gap-2"><FiClock className="text-neutral-400" /> Valid till: {formatDateTime(job.validTill).split(' ')[0]}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 border-y border-neutral-100 py-4 relative z-10">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-brand-600 font-bold mb-1"><FiUsers /> {job.applicationsCount || 0}</div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Applicants</div>
                    </div>
                    <div className="text-center border-l border-neutral-100">
                      <div className="flex items-center justify-center gap-1 text-indigo-600 font-bold mb-1"><FiEye /> {job.viewsCount || 0}</div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Views</div>
                    </div>
                  </div>

                  <div className="mt-auto relative z-10 flex flex-wrap gap-2 justify-between">
                    <Link to={`/portal/hr/jobs/${job.id || job._id}/applicants`} className="flex-1 text-center py-2 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white font-bold rounded-xl transition-colors text-xs">
                      View Applicants
                    </Link>
                    <div className="flex gap-1 border border-neutral-200 rounded-xl p-1 shrink-0 bg-neutral-50">
                      <button onClick={() => startEdit(job)} title="Edit Job" className="p-1.5 text-neutral-500 hover:text-brand-600 rounded-lg hover:bg-white transition-colors"><FiEdit2 size={14}/></button>
                      {String(job.status).toLowerCase() !== 'closed' && (
                        <button onClick={() => handleCloseJob(job.id || job._id)} title="Close Job" className="p-1.5 text-neutral-500 hover:text-amber-600 rounded-lg hover:bg-white transition-colors"><FiXCircle size={14}/></button>
                      )}
                      <button onClick={() => handleDeleteJob(job.id || job._id)} title="Delete Job" className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-white transition-colors"><FiTrash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="bg-white rounded-3xl p-16 text-center border border-neutral-100 shadow-sm max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-brand-50 text-brand-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiBriefcase size={40} />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">No Jobs Found</h3>
              <p className="text-neutral-500 mb-8">You haven&apos;t posted any jobs matching this criteria yet.</p>
              <button onClick={() => setActiveTab('post')} className="bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-500 transition-colors">
                Post New Job
              </button>
            </div>
          )}
        </div>
      )}

      {/* POST A JOB TAB */}
      {activeTab === 'post' && (
        <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-neutral-100 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-bl-full pointer-events-none opacity-50"></div>
          
          <div className="mb-8 relative z-10">
            <h2 className="text-2xl font-extrabold text-primary mb-2 flex items-center gap-2">
              <span className="bg-brand-100 text-brand-600 w-10 h-10 flex items-center justify-center rounded-xl"><FiPlus /></span>
              {editingJobId ? 'Edit Job Posting' : 'Create New Job'}
            </h2>
            <p className="text-neutral-500 ml-12">Fill out the details below to publish your job listing.</p>
          </div>

          <form onSubmit={handleSubmitJob} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            
            <div className="space-y-1.5 md:col-span-2 p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-sm font-bold text-neutral-700 block mb-1">Pricing Plan to Use</label>
                    <select value={draft.planSlug} disabled={Boolean(editingJobId)} onChange={(e) => updateDraftField('planSlug', e.target.value)} className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-500 disabled:opacity-50 font-medium">
                      {plans.map((plan) => (
                        <option key={plan.slug} value={plan.slug}>{plan.name} ({plan.currency || 'INR'} {plan.price})</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="text-sm font-bold text-neutral-700 block mb-1">Target Audience</label>
                    <select value={draft.targetAudience} onChange={(e) => updateDraftField('targetAudience', e.target.value)} className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium">
                      <option value="all">All Candidates</option>
                      <option value="student">Only Students / Freshers</option>
                      <option value="retired_employee">Only Retired Professionals</option>
                    </select>
                 </div>
                 {selectedPlan && (
                    <div className="md:col-span-2 text-xs font-bold text-brand-700 bg-brand-50 p-3 rounded-lg flex gap-4">
                      <span>Max Locations: {selectedPlan.maxLocations}</span>
                      <span>Contact Visible: {selectedPlan.contactDetailsVisible ? 'Yes' : 'No'}</span>
                      <span>Credits Remaining: {selectedPlan.isFreeNormalized ? 'Unlimited' : selectedPlanCredits}</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Job Title</label>
              <input required value={draft.jobTitle} onChange={(e) => updateDraftField('jobTitle', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Eg. Senior React Developer" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Company Name</label>
              <input required value={draft.companyName} onChange={(e) => updateDraftField('companyName', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Eg. TechCorp Inc" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Employment Type</label>
              <select required value={draft.employmentType} onChange={(e) => updateDraftField('employmentType', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium">
                <option value="">Select Type</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Experience Level</label>
              <input required value={draft.experienceLevel} onChange={(e) => updateDraftField('experienceLevel', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Eg. 3-5 Years" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Primary Location</label>
              <input required value={draft.jobLocation} onChange={(e) => updateDraftField('jobLocation', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Eg. Bangalore" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Additional Locations (Comma separated)</label>
              <input value={draft.jobLocationsInput} onChange={(e) => updateDraftField('jobLocationsInput', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Pune, Chennai" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Min Salary (Annual)</label>
              <input type="number" value={draft.minPrice} onChange={(e) => updateDraftField('minPrice', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Eg. 500000" />
            </div>

             <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Max Salary (Annual)</label>
              <input type="number" required value={draft.maxPrice} onChange={(e) => updateDraftField('maxPrice', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Eg. 800000" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-bold text-neutral-700">Required Skills (Comma separated)</label>
              <input value={draft.skillsInput} onChange={(e) => updateDraftField('skillsInput', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="React, Node, MongoDB" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-bold text-neutral-700">Full Job Description</label>
              <textarea required rows={6} value={draft.description} onChange={(e) => updateDraftField('description', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Detailed job description and responsibilities..."></textarea>
            </div>

            <div className="md:col-span-2 pt-6 border-t border-neutral-100 flex gap-4 justify-end">
              {editingJobId && (
                <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl font-bold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors">
                  Cancel Edit
                </button>
              )}
              <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2">
                 {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingJobId ? 'Update Job Posting' : 'Publish Job')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BILLING & CREDITS TAB */}
      {activeTab === 'billing' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => {
              const planCredits = creditsSummary?.byPlan?.[plan.slug] || { total: 0, used: 0, remaining: 0 };
              const isFree = isFreePlan(plan);
              return (
                <div key={plan.slug} className={`bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${plan.slug === 'premium' ? 'border-brand-500 ring-1 ring-brand-500 scale-[1.02]' : 'border-neutral-200'}`}>
                  {plan.slug === 'premium' && <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">Popular</div>}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black text-primary">{plan.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isFree ? 'bg-neutral-100 text-neutral-600' : 'bg-amber-100 text-amber-700'}`}>{isFree ? 'Free Forever' : 'Paid Plan'}</span>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-primary">{plan.currency} {plan.price}</span>
                    <span className="text-sm font-bold text-neutral-400"> / {plan.jobValidityDays} days</span>
                  </div>
                  
                  <div className="bg-neutral-50 rounded-xl p-4 mb-4">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Available Credits</p>
                    <p className="text-2xl font-black text-brand-600">{isFree ? 'Unlimited' : planCredits.remaining}</p>
                    <p className="text-xs font-medium text-neutral-400 mt-1">Used: {isFree ? '-' : planCredits.used} of {isFree ? '-' : planCredits.total}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100">
                <h3 className="text-xl font-extrabold text-primary mb-6 flex items-center gap-2"><FiCreditCard className="text-brand-500"/> Buy Credits</h3>
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-500">Select Plan</label>
                    <select value={checkoutForm.planSlug} onChange={e => setCheckoutForm({...checkoutForm, planSlug: e.target.value})} className="w-full p-3 bg-neutral-50 rounded-xl border border-neutral-200 font-bold text-primary focus:ring-2 focus:ring-brand-500" disabled={paidPlans.length === 0}>
                      {paidPlans.map(plan => <option key={plan.slug} value={plan.slug}>{plan.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-500">Credit Quantity</label>
                    <input type="number" min="1" value={checkoutForm.quantity} onChange={e => setCheckoutForm({...checkoutForm, quantity: e.target.value})} className="w-full p-3 bg-neutral-50 rounded-xl border border-neutral-200 font-bold text-primary focus:ring-2 focus:ring-brand-500" />
                  </div>
                  
                  {quote && (
                    <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 space-y-2 text-sm mt-4">
                      <div className="flex justify-between font-medium text-neutral-600"><span>Subtotal:</span> <span>{quote.currency} {Number(quote.subtotal).toFixed(2)}</span></div>
                      <div className="flex justify-between font-medium text-emerald-600"><span>Discount:</span> <span>-{quote.currency} {Number(quote.discountAmount).toFixed(2)}</span></div>
                      <div className="flex justify-between font-medium text-neutral-600"><span>GST:</span> <span>{quote.currency} {Number(quote.gstAmount).toFixed(2)}</span></div>
                      <div className="border-t border-brand-200 pt-2 flex justify-between font-bold text-lg text-brand-700"><span>Total:</span> <span>{quote.currency} {Number(quote.totalAmount).toFixed(2)}</span></div>
                    </div>
                  )}

                  <button type="submit" disabled={checkoutSaving || paidPlans.length === 0} className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-500 transition-colors disabled:opacity-50 mt-4">
                    {checkoutSaving ? 'Processing...' : 'Checkout'}
                  </button>
                </form>
              </div>
            </div>
            
            <div className="lg:col-span-2">
               <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-neutral-100 h-full">
                  <h3 className="text-xl font-extrabold text-primary mb-6">Recent Purchases</h3>
                  {purchases.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                            <th className="pb-4 pr-4">Plan</th>
                            <th className="pb-4 px-4">Qty</th>
                            <th className="pb-4 px-4">Amount</th>
                            <th className="pb-4 px-4">Status</th>
                            <th className="pb-4 pl-4 text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {purchases.slice(0, 10).map((purchase, i) => (
                            <tr key={purchase.id || i} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
                              <td className="py-4 pr-4 font-bold text-primary">{planNameBySlug[purchase.plan_slug] || purchase.plan_slug}</td>
                              <td className="py-4 px-4 font-medium text-neutral-600">{purchase.quantity}</td>
                              <td className="py-4 px-4 font-bold text-neutral-700">{purchase.currency || 'INR'} {purchase.total_amount}</td>
                              <td className="py-4 px-4"><span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold border ${getStatusColor(purchase.status)}`}>{purchase.status}</span></td>
                              <td className="py-4 pl-4 text-right text-neutral-500">{formatDateTime(purchase.created_at || purchase.createdAt).split(' ')[0]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-500 font-medium bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                      You haven&apos;t made any purchases yet.
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrJobsPage;
