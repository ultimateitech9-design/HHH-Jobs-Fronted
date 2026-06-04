import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  FiMapPin
} from 'react-icons/fi';
import {
  checkoutRolePlan,
  closeHrJob,
  contactSalesForRolePlan,
  createHrJob,
  deleteHrJob,
  formatDateTime,
  getCurrentRolePlanSubscription,
  getEmptyJobDraft,
  getHrJobs,
  getJobDistricts,
  getJobDraftFromJob,
  getJobSectors,
  getJobStates,
  getPricingPlans,
  reopenHrJob,
  getRolePlanPurchases,
  getRolePlanSubscriptions,
  getRolePricingPlanQuote,
  getRolePricingPlans,
  verifyRolePlanAutopay,
  updateHrJob
} from '../services/hrApi';
import { openRazorpaySubscriptionCheckout } from '../../../shared/utils/razorpayCheckout';
import { hrStarterPricing } from '../../../shared/config/pricingCatalog';
import { buildJobSeoPath } from '../../../shared/utils/seoRoutes';
import {
  formatRoleTrialProgressLabel,
  isPendingRoleSubscriptionSetup,
  isUsableRoleSubscription
} from '../../../shared/utils/roleSubscriptions';

const initialRoleCheckoutForm = {
  planSlug: '',
  quantity: 1,
  couponCode: '',
  provider: 'razorpay',
  paymentStatus: 'pending'
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isFreePlan = (plan = {}) => {
  if (plan.isFree !== undefined) return Boolean(plan.isFree);
  if (String(plan.slug || '').toLowerCase() === 'free') return true;
  return false;
};

const isDisabledPostingPlan = (plan = {}) => String(plan.slug || '').toLowerCase() === 'free';
const buildHrApplicantsPath = (job = {}) => `${buildJobSeoPath('/portal/hr/jobs', job)}/applicants`;

const isPendingAutopayRoleSubscription = (subscription = null) =>
  Boolean(subscription?.role_plan_slug)
  && isPendingRoleSubscriptionSetup(subscription);

const getPlanPostingBuckets = (plan = {}, multiplier = 1) => {
  const buckets = plan?.meta?.jobPostingCredits || {};
  return [
    { slug: 'standard', label: 'Normal', value: buckets.standard },
    { slug: 'hot_vacancy', label: 'Hot Vacancy', value: buckets.hot_vacancy },
    { slug: 'premium', label: 'Premium', value: buckets.premium }
  ]
    .map((bucket) => ({
      ...bucket,
      value: Math.max(0, Number(bucket.value || 0) * Math.max(1, Number(multiplier || 1)))
    }))
    .filter((bucket) => bucket.value > 0);
};

const formatMoney = (_currency = 'INR', amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDurationLabel = (days = 0) => {
  const value = Number(days || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 days';
  if (value % 30 === 0) {
    const months = value / 30;
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  return `${value} days`;
};

const getRolePlanListPrice = (plan = {}) =>
  Number(plan?.meta?.listPrice || (plan.slug === hrStarterPricing.slug ? hrStarterPricing.listPrice : plan.price) || 0);

const getRolePlanRenewalPrice = (plan = {}) =>
  Number(plan?.meta?.trialRenewalPrice || (plan.slug === hrStarterPricing.slug ? hrStarterPricing.trialRenewalPrice : plan.price) || 0);

const getRolePlanDiscountLabel = (plan = {}) =>
  plan?.meta?.offerBadge || plan?.meta?.badgeText || '';

const getComparableRolePlanPrice = (plan = {}) =>
  getRolePlanRenewalPrice(plan) || getRolePlanListPrice(plan);

const getRolePlanChangeType = (currentPlan = null, nextPlan = null, hasExistingPlan = false, isCurrentPlan = false) => {
  if (!hasExistingPlan || !currentPlan || !nextPlan || isCurrentPlan) return 'new';
  const currentPrice = getComparableRolePlanPrice(currentPlan);
  const nextPrice = getComparableRolePlanPrice(nextPlan);
  if (nextPrice > currentPrice) return 'upgrade';
  if (nextPrice < currentPrice) return 'downgrade';
  return 'change';
};

const isContactSalesRolePlan = (plan = {}) =>
  Boolean(plan?.meta?.contactSales) || plan?.meta?.selfCheckout === false || Boolean(plan?.contactSales);

const isCurrentRoleSubscriptionPlan = (subscription = null, plan = null) => {
  if (!subscription || !plan) return false;
  if (!isUsableRoleSubscription(subscription)) return false;
  return String(subscription.role_plan_slug || '').toLowerCase() === String(plan.slug || '').toLowerCase();
};

const JOB_POSTING_DESCRIPTION_LIMIT = 250;
const TRACKED_JOB_PLAN_SLUGS = ['premium', 'hot_vacancy', 'standard'];
const AUTO_JOB_PLAN_SLUGS = ['standard', 'hot_vacancy', 'premium'];
const JOB_PLAN_PRIORITY = Object.fromEntries(TRACKED_JOB_PLAN_SLUGS.map((slug, index) => [slug, index]));

const getJobPlanSlug = (job = {}) =>
  String(job.planSlug || job.plan_slug || job.pricingPlanSlug || job.pricing_plan_slug || job.plan?.slug || '').trim().toLowerCase();

const getJobCreatedAt = (job = {}) =>
  job.createdAt || job.created_at || job.postingDate || job.posting_date || '';

const sortByJobPlanPriority = (a = {}, b = {}) => {
  const aRank = JOB_PLAN_PRIORITY[String(a.slug || '').toLowerCase()] ?? 99;
  const bRank = JOB_PLAN_PRIORITY[String(b.slug || '').toLowerCase()] ?? 99;
  if (aRank !== bRank) return aRank - bRank;
  return Number(a.sortOrder ?? a.sort_order ?? 999) - Number(b.sortOrder ?? b.sort_order ?? 999);
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'post', 'billing'
  const [billingSubTab, setBillingSubTab] = useState('subscription'); // 'subscription', 'history'

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [draft, setDraft] = useState(getEmptyJobDraft());
  const [editingJobId, setEditingJobId] = useState('');
  const [saving, setSaving] = useState(false);

  const [plans, setPlans] = useState([]);
  const [rolePlans, setRolePlans] = useState([]);
  const [roleSubscriptions, setRoleSubscriptions] = useState([]);
  const [currentRoleSubscription, setCurrentRoleSubscription] = useState(null);
  const [rolePurchases, setRolePurchases] = useState([]);
  const [rolePricingError, setRolePricingError] = useState('');
  const [roleCheckoutForm, setRoleCheckoutForm] = useState(initialRoleCheckoutForm);
  const [roleCheckoutSaving, setRoleCheckoutSaving] = useState(false);
  const [roleQuote, setRoleQuote] = useState(null);
  const [roleQuoteLoading, setRoleQuoteLoading] = useState(false);
  const [roleQuoteError, setRoleQuoteError] = useState('');
  const [sectors, setSectors] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const normalizedPlans = useMemo(
    () => plans.map((plan) => ({
      ...plan,
      slug: String(plan.slug || '').trim(),
      currency: plan.currency || 'INR',
      isFreeNormalized: isFreePlan(plan)
    })),
    [plans]
  );

  const postablePlans = useMemo(
    () => [...normalizedPlans.filter((plan) => !isDisabledPostingPlan(plan))].sort(sortByJobPlanPriority),
    [normalizedPlans]
  );

  const selectedPlan = useMemo(
    () =>
      normalizedPlans.find((plan) => plan.slug === draft.planSlug)
      || postablePlans[0]
      || null,
    [normalizedPlans, postablePlans, draft.planSlug]
  );

  const selectedRolePlan = useMemo(
    () => rolePlans.find((plan) => plan.slug === roleCheckoutForm.planSlug) || rolePlans[0] || null,
    [rolePlans, roleCheckoutForm.planSlug]
  );
  const currentRolePlan = useMemo(
    () => {
      if (!isUsableRoleSubscription(currentRoleSubscription)) return null;
      return rolePlans.find((plan) => String(plan.slug || '').toLowerCase() === String(currentRoleSubscription?.role_plan_slug || '').toLowerCase()) || null;
    },
    [rolePlans, currentRoleSubscription]
  );
  const selectedRolePlanRequiresSales = useMemo(
    () => isContactSalesRolePlan(selectedRolePlan),
    [selectedRolePlan]
  );
  const selectedRolePlanIsCurrent = useMemo(
    () => isCurrentRoleSubscriptionPlan(currentRoleSubscription, selectedRolePlan),
    [currentRoleSubscription, selectedRolePlan]
  );

  const roleCheckoutQuantity = 1;

  const roleQuoteDisplay = useMemo(() => {
    if (!selectedRolePlan || selectedRolePlanRequiresSales || selectedRolePlanIsCurrent) return null;
    const selectedChangeType = getRolePlanChangeType(
      currentRolePlan,
      selectedRolePlan,
      isUsableRoleSubscription(currentRoleSubscription),
      selectedRolePlanIsCurrent
    );
    if (selectedChangeType === 'downgrade') return null;

    const currency = roleQuote?.currency || selectedRolePlan.currency || 'INR';
    const renewalUnitPrice = getRolePlanRenewalPrice(selectedRolePlan);
    const listUnitPrice = getRolePlanListPrice(selectedRolePlan);
    const listSubtotal = listUnitPrice * roleCheckoutQuantity;
    const baseTaxableAmount = roleQuote?.subtotal ?? (renewalUnitPrice * roleCheckoutQuantity);
    const taxableAmount = roleQuote?.taxableAmount ?? baseTaxableAmount;
    const regularDiscountAmount = Math.max(listSubtotal - baseTaxableAmount, 0);
    const discountAmount = roleQuote
      ? Math.max(regularDiscountAmount + (roleQuote.couponDiscountAmount || 0), 0)
      : Math.max(listSubtotal - taxableAmount, 0);
    const gstRate = Number(roleQuote?.gstRate ?? selectedRolePlan.gstRate ?? 18);
    const gstAmount = roleQuote?.gstAmount ?? (taxableAmount * (gstRate / 100));
    const totalAmount = roleQuote?.totalAmount ?? (taxableAmount + gstAmount);

    return {
      currency,
      subtotal: listSubtotal,
      discountAmount,
      couponDiscountAmount: roleQuote?.couponDiscountAmount || 0,
      upgradeCreditAmount: roleQuote?.upgradeCreditAmount || 0,
      upgradeCredit: roleQuote?.upgradeCredit || null,
      gstAmount,
      totalAmount,
      includedJobPosts: roleQuote?.includedJobCredits ?? ((selectedRolePlan.includedJobCredits || 0) * roleCheckoutQuantity)
    };
  }, [currentRolePlan, currentRoleSubscription, selectedRolePlan, selectedRolePlanRequiresSales, selectedRolePlanIsCurrent, roleQuote, roleCheckoutQuantity]);

  const postedJobCountsByPlan = useMemo(() => {
    const counts = Object.fromEntries(TRACKED_JOB_PLAN_SLUGS.map((slug) => [slug, 0]));
    const periodStart = currentRoleSubscription?.starts_at || currentRoleSubscription?.created_at || '';
    const periodEnd = currentRoleSubscription?.ends_at || '';
    const startTime = periodStart ? new Date(periodStart).getTime() : 0;
    const endTime = periodEnd ? new Date(periodEnd).getTime() : 0;

    for (const job of jobs) {
      const slug = getJobPlanSlug(job);
      const createdAt = getJobCreatedAt(job);
      const createdTime = createdAt ? new Date(createdAt).getTime() : 0;
      if (startTime && createdTime && createdTime < startTime) continue;
      if (endTime && createdTime && createdTime > endTime) continue;
      if (counts[slug] !== undefined) counts[slug] += 1;
    }
    return counts;
  }, [jobs, currentRoleSubscription]);
  const hasUsableRecruiterPlan = useMemo(
    () => isUsableRoleSubscription(currentRoleSubscription),
    [currentRoleSubscription]
  );
  const hasExistingRecruiterPlan = useMemo(() => {
    return isUsableRoleSubscription(currentRoleSubscription);
  }, [currentRoleSubscription]);
  const selectedRolePlanChangeType = useMemo(() => {
    return getRolePlanChangeType(currentRolePlan, selectedRolePlan, hasExistingRecruiterPlan, selectedRolePlanIsCurrent);
  }, [currentRolePlan, hasExistingRecruiterPlan, selectedRolePlan, selectedRolePlanIsCurrent]);
  const selectedRolePlanNeedsSalesFollowUp = selectedRolePlanRequiresSales || selectedRolePlanChangeType === 'downgrade';
  const postingUsageByPlan = useMemo(() => {
    const usage = Object.fromEntries(TRACKED_JOB_PLAN_SLUGS.map((slug) => [slug, {
      limit: 0,
      used: postedJobCountsByPlan[slug] || 0,
      remaining: 0
    }]));

    for (const bucket of getPlanPostingBuckets(currentRolePlan)) {
      if (!usage[bucket.slug]) usage[bucket.slug] = { limit: 0, used: postedJobCountsByPlan[bucket.slug] || 0, remaining: 0 };
      usage[bucket.slug].limit = bucket.value;
      usage[bucket.slug].remaining = Math.max(bucket.value - usage[bucket.slug].used, 0);
    }

    return usage;
  }, [currentRolePlan, postedJobCountsByPlan]);
  const selectedPlanPostingUsage = useMemo(
    () => postingUsageByPlan[String(selectedPlan?.slug || '').toLowerCase()] || { limit: 0, used: 0, remaining: 0 },
    [postingUsageByPlan, selectedPlan]
  );
  const autoPostingPlan = useMemo(() => {
    const planBySlug = new Map(postablePlans.map((plan) => [String(plan.slug || '').toLowerCase(), plan]));
    const orderedPlans = AUTO_JOB_PLAN_SLUGS.map((slug) => planBySlug.get(slug)).filter(Boolean);
    return orderedPlans.find((plan) => (postingUsageByPlan[String(plan.slug || '').toLowerCase()]?.remaining || 0) > 0)
      || orderedPlans.find((plan) => (postingUsageByPlan[String(plan.slug || '').toLowerCase()]?.limit || 0) > 0)
      || orderedPlans[0]
      || postablePlans[0]
      || null;
  }, [postablePlans, postingUsageByPlan]);
  const postingTypeOptions = useMemo(() => {
    const planBySlug = new Map(postablePlans.map((plan) => [String(plan.slug || '').toLowerCase(), plan]));
    return AUTO_JOB_PLAN_SLUGS.map((slug) => planBySlug.get(slug)).filter(Boolean);
  }, [postablePlans]);

  const planNameBySlug = useMemo(
    () => Object.fromEntries(normalizedPlans.map((plan) => [plan.slug, plan.name || plan.slug])),
    [normalizedPlans]
  );
  const rolePlanNameBySlug = useMemo(
    () => Object.fromEntries(rolePlans.map((plan) => [plan.slug, plan.name || plan.slug])),
    [rolePlans]
  );
  const trackedJobPlanStats = useMemo(
    () => TRACKED_JOB_PLAN_SLUGS.map((slug) => ({
      slug,
      label: planNameBySlug[slug] || (slug === 'standard' ? 'Normal' : slug.replace(/_/g, ' ')),
      count: postedJobCountsByPlan[slug] || 0,
      limit: postingUsageByPlan[slug]?.limit || 0,
      remaining: postingUsageByPlan[slug]?.remaining || 0
    })),
    [planNameBySlug, postedJobCountsByPlan, postingUsageByPlan]
  );
  const hasPendingAutopaySetup = useMemo(
    () => isPendingAutopayRoleSubscription(currentRoleSubscription),
    [currentRoleSubscription]
  );
  const currentTrialProgressLabel = useMemo(() => {
    if (!currentRoleSubscription?.meta?.isTrial) return '';
    const endsAt = currentRoleSubscription.trial_ends_at || currentRoleSubscription.ends_at;
    if (!endsAt) return '';
    const remainingDays = Math.max(
      0,
      Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    return formatRoleTrialProgressLabel(currentRoleSubscription, remainingDays);
  }, [currentRoleSubscription]);
  const selectedRolePlanIsPendingSetup = useMemo(
    () => hasPendingAutopaySetup
      && String(currentRoleSubscription?.role_plan_slug || '').toLowerCase() === String(selectedRolePlan?.slug || '').toLowerCase(),
    [currentRoleSubscription, hasPendingAutopaySetup, selectedRolePlan]
  );
  const roleCheckoutAction = useMemo(() => {
    if (selectedRolePlanIsCurrent) {
      return {
        title: 'Current Plan Active',
        detail: 'This plan is already enabled'
      };
    }
    if (selectedRolePlanRequiresSales) {
      return {
        title: 'Contact Sales',
        detail: 'Sales team will connect for this plan'
      };
    }
    if (selectedRolePlanIsPendingSetup) {
      return {
        title: 'Complete Auto-pay Setup',
        detail: 'Then your 2 months trial will start'
      };
    }
    if (hasPendingAutopaySetup && !hasExistingRecruiterPlan) {
      return {
        title: 'Switch Plan + Enable Auto-pay',
        detail: 'Then your 2 months trial will start'
      };
    }
    if (!hasExistingRecruiterPlan) {
      return {
        title: 'Start 2 Months Trial',
        detail: 'Enable Razorpay auto-pay first'
      };
    }
    if (selectedRolePlanChangeType === 'downgrade') {
      return {
        title: 'Request Downgrade',
        detail: 'Sales team will review and switch'
      };
    }
    if (selectedRolePlanChangeType === 'upgrade') {
      return {
        title: 'Upgrade Plan',
        detail: 'Pay adjusted amount for remaining days'
      };
    }
    return {
      title: 'Change Plan',
      detail: 'No extra trial on plan change'
    };
  }, [hasExistingRecruiterPlan, hasPendingAutopaySetup, selectedRolePlanChangeType, selectedRolePlanIsCurrent, selectedRolePlanIsPendingSetup, selectedRolePlanRequiresSales]);

  const requestedAudience = useMemo(() => {
    const value = new URLSearchParams(location.search).get('audience');
    return value === 'retired_employee' || value === 'all' || value === 'student' ? value : '';
  }, [location.search]);
  const requestedTab = useMemo(() => {
    const value = new URLSearchParams(location.search).get('tab');
    return ['jobs', 'post', 'billing'].includes(value) ? value : '';
  }, [location.search]);
  const requestedBillingSubTab = useMemo(() => {
    const value = new URLSearchParams(location.search).get('billingTab');
    if (value === 'credits') return 'subscription';
    return ['subscription', 'history'].includes(value) ? value : '';
  }, [location.search]);

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab);
    } else if (requestedAudience === 'retired_employee') {
      setActiveTab('post');
    }

    if (requestedBillingSubTab) {
      setBillingSubTab(requestedBillingSubTab);
    }
  }, [requestedAudience, requestedBillingSubTab, requestedTab]);

  const resolveDraftLocations = (jobDraft = draft) => {
    const primaryLocation = String(jobDraft.jobLocation || '').trim();
    return primaryLocation ? [primaryLocation] : [];
  };

  const loadPricingState = async () => {
    const plansRes = await getPricingPlans();

    const nextPlans = plansRes.data || [];

    setPlans(nextPlans);
    if (plansRes.error) setError(plansRes.error);

    const nextPostablePlans = [...nextPlans.filter((plan) => !isDisabledPostingPlan(plan))].sort(sortByJobPlanPriority);
    const firstPostingPlan = nextPostablePlans.find((plan) => String(plan.slug || '').toLowerCase() === 'standard') || nextPostablePlans[0] || nextPlans[0];
    if (firstPostingPlan) {
      setDraft((current) => ({
        ...current,
        planSlug: current.planSlug && current.planSlug !== 'standard' && nextPlans.some((plan) => plan.slug === current.planSlug && !isDisabledPostingPlan(plan))
          ? current.planSlug
          : firstPostingPlan.slug
      }));
    }
  };

  const handleReopenJob = async (jobId) => {
    setMessage('');
    setError('');

    try {
      const updated = await reopenHrJob(jobId);
      setJobs((current) => current.map((job) => ((job.id || job._id) === jobId ? { ...job, ...updated } : job)));
      setMessage('Job re-opened successfully.');
    } catch (reopenError) {
      setError(String(reopenError.message || 'Unable to re-open job.'));
    }
  };

  const loadRolePricingState = async () => {
    const [plansRes, subscriptionsRes, currentSubscriptionRes, purchasesRes] = await Promise.all([
      getRolePricingPlans('hr'),
      getRolePlanSubscriptions({ audienceRole: 'hr' }),
      getCurrentRolePlanSubscription('hr'),
      getRolePlanPurchases({ audienceRole: 'hr' })
    ]);

    const nextPlans = plansRes.data || [];
    const currentSubscription = currentSubscriptionRes.data || null;
    const activePlanSlug = String(currentSubscription?.role_plan_slug || '').toLowerCase();
    const preferredCheckoutPlan =
      nextPlans.find((plan) => String(plan.slug || '').toLowerCase() !== activePlanSlug && !isContactSalesRolePlan(plan))
      || nextPlans.find((plan) => String(plan.slug || '').toLowerCase() !== activePlanSlug)
      || nextPlans[0]
      || null;
    setRolePlans(nextPlans);
    setRoleSubscriptions(subscriptionsRes.data || []);
    setCurrentRoleSubscription(currentSubscription);
    setRolePurchases(purchasesRes.data || []);
    setRolePricingError([plansRes.error, subscriptionsRes.error, currentSubscriptionRes.error, purchasesRes.error].filter(Boolean).join(' | '));
    setRoleCheckoutForm((current) => ({
      ...current,
      planSlug: nextPlans.some((plan) => plan.slug === current.planSlug && !isCurrentRoleSubscriptionPlan(currentSubscription, plan))
        ? current.planSlug
        : (preferredCheckoutPlan?.slug || '')
    }));
  };

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      const [jobsRes, sectorsRes, statesRes] = await Promise.all([
        getHrJobs(),
        getJobSectors(),
        getJobStates()
      ]);
      if (!mounted) return;

      setJobs(jobsRes.data || []);
      setSectors(sectorsRes.data || []);
      setStates(statesRes.data || []);
      setError(jobsRes.error || '');
      setLoading(false);

      await loadPricingState();
      await loadRolePricingState();
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadRoleQuote = async () => {
      if (!selectedRolePlan || selectedRolePlanNeedsSalesFollowUp || selectedRolePlanIsCurrent) {
        setRoleQuote(null);
        setRoleQuoteError('');
        setRoleQuoteLoading(false);
        return;
      }

      setRoleQuoteLoading(true);
      setRoleQuoteError('');

      try {
        const response = await getRolePricingPlanQuote({
          planSlug: selectedRolePlan.slug,
          quantity: roleCheckoutQuantity,
          couponCode: roleCheckoutForm.couponCode
        });
        if (!active) return;
        setRoleQuote(response);
      } catch (roleQuoteRequestError) {
        if (!active) return;
        setRoleQuote(null);
        setRoleQuoteError(String(roleQuoteRequestError.message || 'Unable to fetch recruiter plan quote.'));
      } finally {
        if (active) setRoleQuoteLoading(false);
      }
    };

    loadRoleQuote();

    return () => {
      active = false;
    };
  }, [selectedRolePlan, selectedRolePlanNeedsSalesFollowUp, selectedRolePlanIsCurrent, roleCheckoutQuantity, roleCheckoutForm.couponCode]);

  useEffect(() => {
    if (!requestedAudience || editingJobId) return;

    setDraft((current) => ({ ...current, targetAudience: requestedAudience }));
  }, [requestedAudience, editingJobId]);

  useEffect(() => {
    if (editingJobId || !autoPostingPlan) return;

    setDraft((current) => {
      const currentSlug = String(current.planSlug || '').toLowerCase();
      const currentPlanExists = postablePlans.some((plan) => String(plan.slug || '').toLowerCase() === currentSlug);
      const currentHasQuota = (postingUsageByPlan[currentSlug]?.remaining || 0) > 0;
      if (currentPlanExists && currentHasQuota) return current;
      return current.planSlug === autoPostingPlan.slug ? current : { ...current, planSlug: autoPostingPlan.slug };
    });
  }, [autoPostingPlan, editingJobId, postablePlans, postingUsageByPlan]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === 'all') return jobs;
    return jobs.filter((job) => String(job.status || '').toLowerCase() === statusFilter);
  }, [jobs, statusFilter]);

  const updateDraftField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSectorChange = (sectorId) => {
    const sector = sectors.find((item) => item.id === sectorId);
    setDraft((current) => ({
      ...current,
      sectorId,
      sectorName: sector?.name || '',
      category: sector?.name || current.category
    }));
  };

  const handleStateChange = async (stateId) => {
    const state = states.find((item) => item.id === stateId);
    setDraft((current) => ({
      ...current,
      stateId,
      stateName: state?.name || '',
      districtId: '',
      districtName: ''
    }));
    if (!stateId) {
      setDistricts([]);
      return;
    }
    const response = await getJobDistricts(stateId);
    setDistricts(response.data || []);
  };

  const handleDistrictChange = (districtId) => {
    const district = districts.find((item) => item.id === districtId);
    setDraft((current) => {
      const districtName = district?.name || '';
      const jobLocation = current.jobLocation || [districtName, current.stateName].filter(Boolean).join(', ');
      return {
        ...current,
        districtId,
        districtName,
        jobLocation
      };
    });
  };

  const resetForm = () => {
    setEditingJobId('');
    setDraft({ ...getEmptyJobDraft(), planSlug: autoPostingPlan?.slug || selectedPlan?.slug || 'standard' });
    setActiveTab('jobs');
  };

  const validateDraft = () => {
    const requiredFields = ['jobTitle', 'salaryType', 'experienceLevel', 'employmentType', 'sectorName', 'stateName', 'districtName', 'description', 'jobLocation'];
    const missing = requiredFields.filter((key) => !String(draft[key] || '').trim());

    if (missing.length > 0) {
      return `Missing required fields: ${missing.join(', ')}`;
    }

    if (!editingJobId && !hasUsableRecruiterPlan) {
      return 'Start a recruiter plan and enable Razorpay auto-pay before posting jobs.';
    }

    const resolvedLocations = resolveDraftLocations();
    if (resolvedLocations.length === 0) {
      return 'At least one job location is required.';
    }

    const descriptionLimit = Math.min(
      JOB_POSTING_DESCRIPTION_LIMIT,
      Number(selectedPlan?.maxDescriptionChars || JOB_POSTING_DESCRIPTION_LIMIT) || JOB_POSTING_DESCRIPTION_LIMIT
    );
    if (String(draft.description || '').length > descriptionLimit) {
      return `Description cannot exceed ${descriptionLimit} characters.`;
    }

    if (selectedPlan) {
      if (!editingJobId && isDisabledPostingPlan(selectedPlan)) {
        return 'Free job posting is disabled. Use your active recruiter plan.';
      }

      if (!editingJobId && selectedPlanPostingUsage.remaining <= 0) {
        return `No ${selectedPlan.name} job posts left in your current plan. Upgrade your plan to post more.`;
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
      }

      resetForm();
    } catch (submitError) {
      setError(String(submitError.message || 'Failed to save job.'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = async (job) => {
    setEditingJobId(job.id || job._id);
    const nextDraft = getJobDraftFromJob(job);
    setDraft(nextDraft);
    if (nextDraft.stateId) {
      const response = await getJobDistricts(nextDraft.stateId);
      setDistricts(response.data || []);
    }
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
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;

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

  const handleRolePlanCheckout = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!selectedRolePlan) {
      setError('No recruiter plan is available right now. Contact admin.');
      return;
    }

    if (isCurrentRoleSubscriptionPlan(currentRoleSubscription, selectedRolePlan)) {
      setMessage(`${selectedRolePlan.name || 'This plan'} is already your current plan.`);
      return;
    }

    setRoleCheckoutSaving(true);

    try {
      if (isContactSalesRolePlan(selectedRolePlan) || selectedRolePlanChangeType === 'downgrade') {
        await contactSalesForRolePlan({
          planSlug: selectedRolePlan.slug,
          audienceRole: 'hr',
          reason: selectedRolePlanChangeType === 'downgrade' ? 'downgrade_request' : 'contact_sales',
          currentPlanSlug: currentRoleSubscription?.role_plan_slug || '',
          note: selectedRolePlanChangeType === 'downgrade'
            ? `HR wants to switch from ${currentRolePlan?.name || currentRoleSubscription?.role_plan_slug || 'current plan'} to ${selectedRolePlan.name || selectedRolePlan.slug}. Please call and understand the issue before changing the plan.`
            : ''
        });
        await loadRolePricingState();
        setMessage(selectedRolePlanChangeType === 'downgrade'
          ? 'Sales team has been notified for this downgrade request. They will contact the HR before changing the plan.'
          : 'Sales team has been notified. They will contact you for Enterprise pricing and rollout.');
        return;
      }

      const response = await checkoutRolePlan({
        planSlug: selectedRolePlan.slug,
        quantity: roleCheckoutQuantity,
        couponCode: roleCheckoutForm.couponCode,
        provider: 'razorpay',
        paymentStatus: roleCheckoutForm.paymentStatus
      });

      if (response?.alreadyAuthorized) {
        await loadRolePricingState();
        await loadPricingState();
        setMessage(response?.mode === 'coupon_free_trial'
          ? 'Free trial activated with coupon. No Razorpay payment is required for this trial.'
          : response?.mode === 'zero_amount_checkout'
            ? 'Recruiter plan activated successfully. No payment was required.'
            : hasExistingRecruiterPlan
              ? 'Recruiter auto-pay is already enabled for this plan.'
              : 'Recruiter auto-pay is already enabled. The trial will move into recurring billing automatically.');
        setRoleCheckoutForm((current) => ({
          ...current,
          quantity: 1,
          couponCode: ''
        }));
        return;
      }

      if (response?.paymentSession?.subscriptionId) {
        const checkoutResult = await openRazorpaySubscriptionCheckout({
          ...response.paymentSession,
          name: 'HHH Jobs Recruiter Plan',
          description: hasExistingRecruiterPlan
            ? `Authorise Razorpay auto-pay to ${selectedRolePlanChangeType === 'downgrade' ? 'downgrade' : selectedRolePlanChangeType === 'upgrade' ? 'upgrade' : 'change'} your recruiter plan.`
            : 'Enable Razorpay auto-pay first, then start your HR free trial.'
        });

        if (checkoutResult.dismissed) {
          setMessage('Checkout was closed before recruiter auto-pay authorisation completed.');
          return;
        }

        await verifyRolePlanAutopay({
          localSubscriptionId: response.paymentSession.localSubscriptionId,
          razorpaySubscriptionId: checkoutResult.razorpaySubscriptionId,
          razorpayPaymentId: checkoutResult.razorpayPaymentId,
          razorpaySignature: checkoutResult.razorpaySignature,
          audienceRole: 'hr'
        });

        await loadRolePricingState();
        await loadPricingState();
        setMessage(hasExistingRecruiterPlan
          ? `Recruiter plan ${selectedRolePlanChangeType === 'downgrade' ? 'downgraded' : selectedRolePlanChangeType === 'upgrade' ? 'upgraded' : 'changed'} successfully. No new trial was applied.`
          : 'HR trial is active and Razorpay auto-pay is now enabled for renewal.');
        setRoleCheckoutForm((current) => ({
          ...current,
          quantity: 1,
          couponCode: ''
        }));
        return;
      }

      await loadRolePricingState();
      await loadPricingState();
      setMessage(
        response?.purchase?.status === 'paid'
          ? 'Recruiter plan activated successfully.'
          : 'Recruiter plan request created. Admin approval is required before activation.'
      );
      setRoleCheckoutForm((current) => ({
        ...current,
        quantity: 1,
        couponCode: ''
      }));
    } catch (checkoutError) {
      setError(String(checkoutError.message || 'Unable to purchase recruiter plan.'));
    } finally {
      setRoleCheckoutSaving(false);
    }
  };

  return (
    <div className="admin-ops-page">
      <header className="admin-ops-header">
        <div>
          <h1 className="admin-ops-title">Job Postings</h1>
          <p className="admin-ops-subtitle">Manage your active jobs, post new roles, and oversee billing.</p>
        </div>
        <div className="flex bg-neutral-100 rounded-xl p-1 shrink-0 overflow-x-auto hide-scrollbar">
          {[
            { key: 'jobs', label: 'My Jobs', icon: FiBriefcase, action: () => { setActiveTab('jobs'); setEditingJobId(''); } },
            { key: 'post', label: 'Post a Job', icon: FiPlus, action: () => setActiveTab('post') },
            { key: 'billing', label: 'Billing & Plans', icon: FiCreditCard, action: () => { setActiveTab('billing'); setEditingJobId(''); } }
          ].map(({ key, label, icon: Icon, action }) => (
            <button
              key={key}
              onClick={action}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-neutral-500 hover:text-slate-700'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="admin-ops-alert admin-ops-alert--error animate-fade-in">
          <FiXCircle size={20} className="shrink-0" /> <span className="font-semibold">{error}</span>
        </div>
      )}
      {message && !error && (
        <div className="admin-ops-alert admin-ops-alert--success animate-fade-in">
          <FiCheckCircle size={20} className="shrink-0" /> <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* JOBS TAB */}
      {activeTab === 'jobs' && (
        <div className="space-y-6 animate-fade-in">
          <div className="admin-ops-panel-header rounded-[1.5rem] border border-neutral-100 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-bold text-primary">Filter By Status:</span>
              <div className="flex bg-neutral-50 rounded-lg p-1">
                {['all', 'open', 'closed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-colors ${statusFilter === filter ? 'bg-white text-brand-600 shadow-sm border border-neutral-200' : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm font-bold text-neutral-500">
              {loading ? 'Loading Jobs' : `${filteredJobs.length} Jobs Found`}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-56 bg-white rounded-[1.6rem] animate-pulse border border-neutral-100"></div>)}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredJobs.map(job => (
                <article
                  key={job.id || job._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(buildHrApplicantsPath(job))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(buildHrApplicantsPath(job));
                    }
                  }}
                  className="bg-white rounded-[1.35rem] p-3.5 shadow-sm border border-neutral-100 hover:shadow-md transition-all flex flex-col group relative overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 bg-brand-50 rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative z-10 mb-2.5 flex items-start justify-between gap-2.5">
                    <div className="min-w-0 pr-1">
                      <h3 className="mb-0.5 line-clamp-2 text-[15px] font-bold leading-[1.25] text-primary transition-colors group-hover:text-brand-600">{job.jobTitle}</h3>
                      <p className="truncate text-[12px] font-medium text-neutral-500">{job.companyName}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] ${getStatusColor(job.status || 'open')}`}>
                      {job.status || 'open'}
                    </span>
                  </div>

                  <div className="relative z-10 mb-3.5 space-y-1.5 text-[12px] font-medium text-neutral-600">
                    <div className="flex items-center gap-1.5 truncate"><FiMapPin className="shrink-0 text-neutral-400" size={11} /> <span className="truncate">{job.jobLocation || 'Remote'}</span></div>
                    <div className="flex items-center gap-1.5"><FiBriefcase className="shrink-0 text-neutral-400" size={11} /> <span className="truncate">{job.experienceLevel || 'Any Experience'} &bull; {job.employmentType || 'Full-Time'}</span></div>
                  </div>

                  <div className="relative z-10 mb-3.5 grid grid-cols-2 gap-2 border-y border-neutral-100 py-2.5">
                    <div className="text-center">
                      <div className="mb-0.5 flex items-center justify-center gap-1 text-[12px] font-bold text-brand-600"><FiUsers size={11} /> {job.applicationsCount || 0}</div>
                      <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-neutral-400">Applicants</div>
                    </div>
                    <div className="text-center border-l border-neutral-100">
                      <div className="mb-0.5 flex items-center justify-center gap-1 text-[12px] font-bold text-indigo-600"><FiEye size={11} /> {job.viewsCount || 0}</div>
                      <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-neutral-400">Views</div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-auto flex items-center justify-end gap-1.5">
                    <div className="flex shrink-0 gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                      <button onClick={(event) => { event.stopPropagation(); startEdit(job); }} title="Edit Job" className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-white hover:text-brand-600"><FiEdit2 size={12} /></button>
                      {String(job.status).toLowerCase() !== 'closed' ? (
                        <button onClick={(event) => { event.stopPropagation(); handleCloseJob(job.id || job._id); }} title="Close Job" className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-white hover:text-amber-600"><FiXCircle size={12} /></button>
                      ) : (
                        <button onClick={(event) => { event.stopPropagation(); handleReopenJob(job.id || job._id); }} title="Re-open Job" className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-white hover:text-emerald-600"><FiCheckCircle size={12} /></button>
                      )}
                      <button onClick={(event) => { event.stopPropagation(); handleDeleteJob(job.id || job._id); }} title="Delete Job" className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-white hover:text-red-600"><FiTrash2 size={12} /></button>
                    </div>
                  </div>
                </article>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-neutral-700 block mb-1">Job Type</label>
                <select value={draft.planSlug} disabled={Boolean(editingJobId)} onChange={(e) => updateDraftField('planSlug', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 disabled:opacity-50 font-medium">
                  {postingTypeOptions.map((plan) => {
                    const slug = String(plan.slug || '').toLowerCase();
                    const usage = postingUsageByPlan[slug] || { remaining: 0 };
                    const disabled = !editingJobId && usage.remaining <= 0;
                    return (
                      <option key={plan.slug} value={plan.slug} disabled={disabled}>
                        {plan.name || planNameBySlug[slug] || slug.replace(/_/g, ' ')} ({usage.remaining} left)
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs font-medium text-neutral-400">Choose Normal, Hot Vacancy, or Premium from your active plan quota.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-neutral-700 block mb-1">Target Audience</label>
                <select value={draft.targetAudience} onChange={(e) => updateDraftField('targetAudience', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium">
                  <option value="all">All Candidates</option>
                  <option value="student">Only Students / Freshers</option>
                  <option value="retired_employee">Only Retired Professionals</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Job Title</label>
              <input required value={draft.jobTitle} onChange={(e) => updateDraftField('jobTitle', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Eg. Senior React Developer" />
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
              <label className="text-sm font-bold text-neutral-700">Sector</label>
              <select value={draft.sectorId} onChange={(e) => handleSectorChange(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium">
                <option value="">Select Sector</option>
                {sectors.map((sector) => (
                  <option key={sector.id || sector.name} value={sector.id}>{sector.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-neutral-700">State</label>
                <select value={draft.stateId} onChange={(e) => handleStateChange(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium">
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.id || state.name} value={state.id}>{state.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-neutral-700">City / District</label>
                {districts.length > 0 ? (
                  <select value={draft.districtId} onChange={(e) => handleDistrictChange(e.target.value)} disabled={!draft.stateId} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium disabled:opacity-60">
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district.id || district.name} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                ) : (
                  <input value={draft.districtName} onChange={(e) => updateDraftField('districtName', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Enter city or district" />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Primary Location</label>
              <input required value={draft.jobLocation} onChange={(e) => updateDraftField('jobLocation', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Eg. Bangalore" />
              <p className="text-xs font-medium text-neutral-400">Enter any city, state, remote, or work location.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Pincode</label>
              <input value={draft.pincode} onChange={(e) => updateDraftField('pincode', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Eg. 201301" inputMode="numeric" />
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
              <textarea required rows={6} maxLength={JOB_POSTING_DESCRIPTION_LIMIT} value={draft.description} onChange={(e) => updateDraftField('description', e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium" placeholder="Detailed job description and responsibilities..."></textarea>
              <p className="text-xs font-medium text-neutral-400">{String(draft.description || '').length}/{JOB_POSTING_DESCRIPTION_LIMIT} characters</p>
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

      {/* BILLING & PLANS TAB */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-fade-in">
          {/* Billing Sub-Tabs */}
          <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1 w-full sm:w-auto overflow-x-auto">
            {[
              { key: 'subscription', label: 'Subscription' },
              { key: 'history', label: 'Purchase History' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setBillingSubTab(key)}
                className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2 rounded-lg text-xs font-bold transition-all ${billingSubTab === key ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-primary'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* --- SUB-TAB: Subscription --- */}
          {billingSubTab === 'subscription' && (
            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
              {/* Left: Plan Info */}
              <div className="space-y-5">
                {/* Current Plan Banner */}
                <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Current Subscription</p>
                  <p className="mt-1.5 text-lg font-extrabold text-slate-900">
                    {hasUsableRecruiterPlan
                      ? (rolePlanNameBySlug[currentRoleSubscription.role_plan_slug] || currentRoleSubscription.role_plan_slug)
                      : isPendingAutopayRoleSubscription(currentRoleSubscription)
                        ? `${rolePlanNameBySlug[currentRoleSubscription.role_plan_slug] || currentRoleSubscription.role_plan_slug} setup pending`
                        : 'No active plan'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {isPendingAutopayRoleSubscription(currentRoleSubscription)
                      ? 'Auto-pay must be authorised before this plan becomes active.'
                      : currentRoleSubscription?.meta?.isTrial
                      ? `${currentTrialProgressLabel || 'Trial active'}${currentRoleSubscription?.trial_ends_at || currentRoleSubscription?.ends_at ? ` • Valid till ${formatDateTime(currentRoleSubscription.trial_ends_at || currentRoleSubscription.ends_at)}` : ''}`
                      : (currentRoleSubscription?.ends_at
                        ? `Active until ${formatDateTime(currentRoleSubscription.ends_at)}`
                        : 'Choose a plan to unlock recruiter-side billing.')}
                  </p>
                  {currentRoleSubscription && (
                    <p className="mt-1 text-[11px] font-semibold text-brand-700">
                      Auto-pay: {currentRoleSubscription?.autopay_enabled ? (currentRoleSubscription?.autopay_status || 'active') : 'not enabled'}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {trackedJobPlanStats.map((stat) => (
                      <div key={stat.slug} className="rounded-lg border border-white/80 bg-white/85 px-3 py-2 shadow-sm">
                        <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400">{stat.label}</p>
                        <p className="mt-0.5 text-base font-extrabold text-slate-900">{stat.count} / {stat.limit}</p>
                        <p className="text-[10px] font-semibold text-emerald-700">{stat.remaining} left</p>
                      </div>
                    ))}
                  </div>
                </div>

                {rolePricingError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">{rolePricingError}</div>
                )}

                {/* Plan Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rolePlans.map((plan) => {
                    const isActivePlan = hasUsableRecruiterPlan && currentRoleSubscription?.role_plan_slug === plan.slug;
                    const isPendingPlan = !hasUsableRecruiterPlan && isPendingAutopayRoleSubscription(currentRoleSubscription) && currentRoleSubscription?.role_plan_slug === plan.slug;
                    const contactSalesPlan = isContactSalesRolePlan(plan);
                    const planChangeType = getRolePlanChangeType(currentRolePlan, plan, hasExistingRecruiterPlan, isActivePlan);
                    const listPrice = getRolePlanListPrice(plan);
                    const renewalPrice = getRolePlanRenewalPrice(plan);
                    const discountLabel = getRolePlanDiscountLabel(plan);
                    const postingBuckets = getPlanPostingBuckets(plan);
                    const planCaseLabel = !hasExistingRecruiterPlan
                      ? `${formatDurationLabel(plan.trialDays || 0)} trial`
                      : planChangeType === 'upgrade'
                      ? 'Paid upgrade'
                      : planChangeType === 'downgrade'
                      ? 'Talk to sales'
                      : planChangeType === 'change'
                      ? 'Plan change'
                      : 'Current plan';
                    return (
                      <div key={plan.slug} className={`rounded-xl border p-4 transition-all ${isActivePlan ? 'border-brand-400 bg-brand-50/50 ring-1 ring-brand-300' : isPendingPlan ? 'border-amber-300 bg-amber-50/50' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isActivePlan ? 'bg-brand-600 text-white' : isPendingPlan ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-500'}`}>
                            {isActivePlan ? 'Active' : isPendingPlan ? 'Auto-pay pending' : (plan.billingCycle || 'monthly')}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{plan.description || 'Commercial recruiter plan'}</p>
                        <p className="text-xl font-extrabold text-slate-900">
                          {contactSalesPlan ? 'Contact Sales' : formatMoney(plan.currency, listPrice)}
                          {!contactSalesPlan && <span className="text-xs font-medium text-neutral-400 ml-1">/{formatDurationLabel(plan.durationDays)}</span>}
                        </p>
                        {!contactSalesPlan && renewalPrice < listPrice ? (
                          <p className="mt-1 text-xs font-bold text-emerald-700">
                            {hasExistingRecruiterPlan ? 'Renews at' : `After ${formatDurationLabel(plan.trialDays || 0)} trial`} {formatMoney(plan.currency, renewalPrice)}/month
                          </p>
                        ) : null}
                        {discountLabel ? (
                          <p className="mt-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                            {discountLabel}
                          </p>
                        ) : null}
                        <div className="mt-3 flex gap-2 text-[11px]">
                          {contactSalesPlan ? (
                            <span className="rounded-md bg-neutral-50 px-2 py-1 font-semibold text-neutral-600">Custom rollout</span>
                          ) : (
                            <>
                              <span className="rounded-md bg-neutral-50 px-2 py-1 font-semibold text-neutral-600">{plan.includedJobCredits || 0} job posts</span>
                              <span className="rounded-md bg-neutral-50 px-2 py-1 font-semibold text-neutral-600">
                                {planCaseLabel}
                              </span>
                            </>
                          )}
                        </div>
                        {postingBuckets.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-600">
                            {postingBuckets.map((bucket) => (
                              <span key={bucket.slug} className="rounded-md border border-neutral-200 bg-white px-2 py-1">
                                {bucket.label}: {bucket.value}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Checkout Form */}
              <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm self-start">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FiUsers size={16} className="text-brand-500" /> Start / Change Plan
                </h3>
                <form onSubmit={handleRolePlanCheckout} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 mb-1 block">Select Plan</label>
                    <select
                      value={roleCheckoutForm.planSlug}
                      onChange={(e) => setRoleCheckoutForm({ ...roleCheckoutForm, planSlug: e.target.value })}
                      className="w-full p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-brand-400"
                      disabled={rolePlans.length === 0}
                    >
                      {rolePlans.map((plan) => <option key={plan.slug} value={plan.slug}>{plan.name}</option>)}
                    </select>
                  </div>
                  {selectedRolePlanIsCurrent ? (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                      {selectedRolePlan?.name || 'This plan'} is already active on your account. Choose another plan to upgrade or change.
                    </div>
                  ) : null}
                  {!selectedRolePlanNeedsSalesFollowUp && !selectedRolePlanIsCurrent && (
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 mb-1 block">Coupon Code</label>
                      <input value={roleCheckoutForm.couponCode} onChange={(e) => setRoleCheckoutForm({ ...roleCheckoutForm, couponCode: e.target.value.toUpperCase() })} className="w-full p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-sm font-semibold uppercase text-slate-900 focus:ring-2 focus:ring-brand-400" placeholder="OPTIONAL COUPON" />
                    </div>
                  )}

                  {selectedRolePlanRequiresSales && !selectedRolePlanIsCurrent ? (
                    <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs font-medium text-brand-700">
                      Enterprise is a custom plan. Share your interest with sales for pricing, job-post limits, and rollout.
                    </div>
                  ) : null}
                  {selectedRolePlanChangeType === 'downgrade' && !selectedRolePlanIsCurrent ? (
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-700">
                      Downgrade requests go to sales first. They will check the HR account, understand the issue, and then help switch the plan.
                    </div>
                  ) : null}
                  {!selectedRolePlanNeedsSalesFollowUp && !selectedRolePlanIsCurrent && roleQuoteError && <p className="text-xs font-medium text-red-600">{roleQuoteError}</p>}
                  {!selectedRolePlanNeedsSalesFollowUp && !selectedRolePlanIsCurrent && roleQuoteLoading && <p className="text-xs text-neutral-400 animate-pulse">Refreshing quote...</p>}
                  {roleQuoteDisplay && (
                    <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-neutral-600"><span>Subtotal:</span><span>{formatMoney(roleQuoteDisplay.currency, roleQuoteDisplay.subtotal)}</span></div>
                      <div className="flex justify-between text-emerald-600"><span>Discount:</span><span>-{formatMoney(roleQuoteDisplay.currency, roleQuoteDisplay.discountAmount)}</span></div>
                      {roleQuoteDisplay.upgradeCreditAmount > 0 ? (
                        <div className="flex justify-between text-emerald-700">
                          <span>Current plan credit:</span><span>-{formatMoney(roleQuoteDisplay.currency, roleQuoteDisplay.upgradeCreditAmount)}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between text-neutral-600"><span>GST:</span><span>{formatMoney(roleQuoteDisplay.currency, roleQuoteDisplay.gstAmount)}</span></div>
                      <div className="flex justify-between text-neutral-600"><span>Job posts:</span><span>{roleQuoteDisplay.includedJobPosts}</span></div>
                      {getPlanPostingBuckets(selectedRolePlan, roleCheckoutQuantity).map((bucket) => (
                        <div key={bucket.slug} className="flex justify-between text-neutral-500">
                          <span>{bucket.label}:</span><span>{bucket.value}</span>
                        </div>
                      ))}
                      <div className="border-t border-neutral-200 pt-1.5 flex justify-between font-bold text-sm text-brand-700"><span>Total:</span><span>{formatMoney(roleQuoteDisplay.currency, roleQuoteDisplay.totalAmount)}</span></div>
                    </div>
                  )}

                  <p className="text-[11px] text-neutral-400">
                    {selectedRolePlanIsCurrent
                      ? 'Your current plan stays active until its listed expiry date.'
                      : selectedRolePlanRequiresSales
                      ? 'No auto-pay is started for Enterprise. A sales lead is created for manual follow-up.'
                      : roleQuoteDisplay && Number(roleQuoteDisplay.totalAmount || 0) <= 0
                      ? 'This coupon makes the checkout free. The trial activates without Razorpay payment.'
                      : selectedRolePlanIsPendingSetup
                      ? 'Auto-pay is still pending for this plan. Complete Razorpay authorisation to start the trial.'
                      : hasPendingAutopaySetup && !hasExistingRecruiterPlan
                      ? 'A previous trial setup is pending. Authorising now will switch the pending setup to the selected plan.'
                      : hasExistingRecruiterPlan
                      ? selectedRolePlanChangeType === 'downgrade'
                        ? 'No payment is collected for downgrade here. Sales gets the HR details and will follow up before switching the plan.'
                        : selectedRolePlanChangeType === 'upgrade'
                        ? 'Existing recruiters upgrade without another free trial. Razorpay auto-pay authorisation is required for the new plan.'
                        : 'Existing recruiters change plans without another free trial. Razorpay auto-pay authorisation is required for the new plan.'
                      : 'Checkout authorises Razorpay auto-pay first. Your free trial starts only after authorisation succeeds.'}
                  </p>

                  <button
                    type="submit"
                    disabled={roleCheckoutSaving || rolePlans.length === 0 || selectedRolePlanIsCurrent}
                    className="flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
                  >
                    {roleCheckoutSaving ? (
                      <span className="text-sm font-bold leading-tight">Processing...</span>
                    ) : (
                      <>
                        <span className="block max-w-full whitespace-normal break-words text-sm font-bold leading-tight">
                          {roleCheckoutAction.title}
                        </span>
                        <span className="block max-w-full whitespace-normal break-words text-[11px] font-semibold leading-tight text-white/85">
                          {roleCheckoutAction.detail}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- SUB-TAB: Purchase History --- */}
          {billingSubTab === 'history' && (
            <div className="space-y-6">
              {/* Recruiter Plan Purchases */}
              <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Recruiter Plan Purchases</h3>
                <p className="text-xs text-neutral-400 mb-4">Visible to admin, sales, and accounts for reconciliation.</p>
                {rolePurchases.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left">
                      <thead>
                        <tr className="border-b border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          <th className="pb-3 pr-3">Plan</th>
                          <th className="pb-3 px-3">Qty</th>
                          <th className="pb-3 px-3">Coupon</th>
                          <th className="pb-3 px-3">Amount</th>
                          <th className="pb-3 px-3">Status</th>
                          <th className="pb-3 pl-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {rolePurchases.slice(0, 15).map((purchase, index) => (
                          <tr key={purchase.id || index} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                            <td className="py-3 pr-3 font-bold text-slate-800">{rolePlanNameBySlug[purchase.role_plan_slug] || purchase.role_plan_slug}</td>
                            <td className="py-3 px-3 text-neutral-600">{purchase.quantity}</td>
                            <td className="py-3 px-3 text-neutral-600">{purchase.coupon_code || '-'}</td>
                            <td className="py-3 px-3 font-semibold text-slate-700">{formatMoney(purchase.currency, purchase.total_amount)}</td>
                            <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(purchase.status)}`}>{purchase.status}</span></td>
                            <td className="py-3 pl-3 text-right text-neutral-500">{formatDateTime(purchase.created_at || purchase.createdAt).split(' ')[0]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs font-medium text-neutral-400 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">No recruiter plan purchases yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HrJobsPage;
