// ── Centralized Plan Configuration ──────────────────────────────────────────
// Single source of truth for all plan tiers, features, trials, and pricing
// across HR, Campus Connect, and Student roles.

// ── Trial Periods (days) ────────────────────────────────────────────────────
export const TRIAL_DAYS = Object.freeze({
  hr: 30,
  campus_connect: 30,
  student: 15
});

// ── Plan Tier Levels ────────────────────────────────────────────────────────
// Numeric tier used for feature gating comparisons.
// Higher tier = more features unlocked.
export const PLAN_TIERS = Object.freeze({
  free:                0,
  // HR tiers
  hr_starter:          1,
  hr_professional:     2,
  hr_enterprise:       3,
  // Student tiers
  student_basic:       1,
  student_plus:        2,
  student_premium:     3,
  // Campus Connect tiers
  campus_basic:        1,
  campus_professional: 2,
  campus_enterprise:   3
});

// ── Tier Display Names ──────────────────────────────────────────────────────
export const TIER_NAMES = ['Free', 'Starter', 'Professional', 'Enterprise'];

export const getPlanTierName = (tier) => TIER_NAMES[tier] || 'Free';

// ── Feature Requirements ────────────────────────────────────────────────────
// Maps feature keys to the minimum tier level required to access them.
export const FEATURE_REQUIREMENTS = Object.freeze({
  // HR features
  'hr.candidate_search':        1,
  'hr.candidate_interest':      1,
  'hr.candidate_bulk_interest': 2,
  'hr.candidate_resume_view':   1,
  'hr.campus_drives':           2,
  'hr.ats_full':                2,
  'hr.analytics_advanced':      2,
  'hr.job_post_hot_vacancy':    2,
  'hr.job_post_classified':     1,
  'hr.shortlist_unlimited':     2,
  'hr.message_templates':       1,
  'hr.interview_scheduling':    1,
  'hr.priority_listing':        3,
  'hr.dedicated_account_mgr':   3,
  'hr.api_access':              3,
  // Student features
  'student.auto_apply':           1,
  'student.resume_builder':       1,
  'student.mock_interview':       1,
  'student.skill_assessments':    1,
  'student.salary_insights':      0,
  'student.video_resume':         2,
  'student.priority_application': 2,
  'student.ai_suggestions':      1,
  'student.external_jobs':        1,
  'student.career_counseling':    2,
  'student.company_insights':     2,
  'student.unlimited_ats':        3,
  // Campus Connect features
  'campus.drive_creation':       1,
  'campus.company_connections':  1,
  'campus.bulk_student_upload':  2,
  'campus.analytics_advanced':   2,
  'campus.reports_export':       2,
  'campus.unlimited_drives':     3,
  'campus.priority_placement':   3,
  'campus.dedicated_support':    3
});

// ── Plan Catalog ────────────────────────────────────────────────────────────
// Complete plan definitions for each role. Prices are in INR.
// `trialDays` controls the free trial window for the first subscription.
// `durationDays` is the billing cycle length after trial.
// `features` is the list displayed on plan cards.

export const HR_PLANS = Object.freeze([
  {
    slug: 'hr_starter',
    name: 'Starter',
    tier: 1,
    price: 0,
    priceAfterTrial: 999,
    durationDays: 30,
    trialDays: TRIAL_DAYS.hr,
    billingCycle: 'month',
    includedJobCredits: 3,
    isFeatured: false,
    tagline: '1 month free trial',
    features: [
      'Post up to 3 jobs',
      'Candidate search & filters',
      'Send interest to candidates',
      'Resume viewing',
      'Classified job posting',
      'Message templates',
      'Interview scheduling'
    ]
  },
  {
    slug: 'hr_professional',
    name: 'Professional',
    tier: 2,
    price: 2499,
    priceAfterTrial: 2499,
    durationDays: 30,
    trialDays: TRIAL_DAYS.hr,
    billingCycle: 'month',
    includedJobCredits: 15,
    isFeatured: true,
    tagline: 'Most popular for recruiters',
    features: [
      'Everything in Starter',
      'Post up to 15 jobs',
      'Bulk interest messaging',
      'Campus drive access',
      'Full ATS pipeline',
      'Advanced analytics',
      'Hot vacancy posting',
      'Unlimited shortlisting'
    ]
  },
  {
    slug: 'hr_enterprise',
    name: 'Enterprise',
    tier: 3,
    price: 7999,
    priceAfterTrial: 7999,
    durationDays: 30,
    trialDays: TRIAL_DAYS.hr,
    billingCycle: 'month',
    includedJobCredits: 50,
    isFeatured: false,
    tagline: 'For large-scale hiring',
    features: [
      'Everything in Professional',
      'Unlimited job postings',
      'Priority listing in search',
      'Dedicated account manager',
      'API access for integration',
      'Custom branding',
      'Bulk campus drives'
    ]
  }
]);

export const STUDENT_PLANS = Object.freeze([
  {
    slug: 'student_basic',
    name: 'Basic',
    tier: 1,
    price: 0,
    priceAfterTrial: 199,
    durationDays: 30,
    trialDays: TRIAL_DAYS.student,
    billingCycle: 'month',
    includedJobCredits: 0,
    isFeatured: false,
    tagline: '15 days free trial',
    features: [
      'Auto-apply to matched jobs',
      'AI resume builder',
      'Mock interview practice',
      'Skill assessments',
      'AI job suggestions',
      'External job board access'
    ]
  },
  {
    slug: 'student_plus',
    name: 'Plus',
    tier: 2,
    price: 499,
    priceAfterTrial: 499,
    durationDays: 30,
    trialDays: TRIAL_DAYS.student,
    billingCycle: 'month',
    includedJobCredits: 0,
    isFeatured: true,
    tagline: 'Best value for job seekers',
    features: [
      'Everything in Basic',
      'Video resume creation',
      'Priority application badge',
      'Career counseling sessions',
      'Company insider insights',
      'Advanced ATS score checker'
    ]
  },
  {
    slug: 'student_premium',
    name: 'Premium',
    tier: 3,
    price: 999,
    priceAfterTrial: 999,
    durationDays: 30,
    trialDays: TRIAL_DAYS.student,
    billingCycle: 'month',
    includedJobCredits: 0,
    isFeatured: false,
    tagline: 'Maximum career advantage',
    features: [
      'Everything in Plus',
      'Unlimited ATS checks',
      'Priority placement support',
      'Dedicated career advisor',
      'Exclusive hiring events access',
      'Premium profile badge'
    ]
  }
]);

export const CAMPUS_PLANS = Object.freeze([
  {
    slug: 'campus_basic',
    name: 'Basic',
    tier: 1,
    price: 0,
    priceAfterTrial: 1499,
    durationDays: 30,
    trialDays: TRIAL_DAYS.campus_connect,
    billingCycle: 'month',
    includedJobCredits: 0,
    isFeatured: false,
    tagline: '1 month free trial',
    features: [
      'Create campus drives',
      'Company connection requests',
      'Student management',
      'Basic placement stats',
      'Drive application tracking'
    ]
  },
  {
    slug: 'campus_professional',
    name: 'Professional',
    tier: 2,
    price: 3999,
    priceAfterTrial: 3999,
    durationDays: 30,
    trialDays: TRIAL_DAYS.campus_connect,
    billingCycle: 'month',
    includedJobCredits: 0,
    isFeatured: true,
    tagline: 'For active placement cells',
    features: [
      'Everything in Basic',
      'Bulk student CSV upload',
      'Advanced analytics dashboard',
      'Placement report export',
      'Multiple drive management',
      'Company directory access'
    ]
  },
  {
    slug: 'campus_enterprise',
    name: 'Enterprise',
    tier: 3,
    price: 9999,
    priceAfterTrial: 9999,
    durationDays: 30,
    trialDays: TRIAL_DAYS.campus_connect,
    billingCycle: 'month',
    includedJobCredits: 0,
    isFeatured: false,
    tagline: 'Institutional-level access',
    features: [
      'Everything in Professional',
      'Unlimited campus drives',
      'Priority placement pipeline',
      'Dedicated support manager',
      'Custom branding & reports',
      'API integration for ERP'
    ]
  }
]);

// ── Plan Lookup Helpers ─────────────────────────────────────────────────────

const ALL_PLANS = [...HR_PLANS, ...STUDENT_PLANS, ...CAMPUS_PLANS];

const plansBySlug = Object.freeze(
  Object.fromEntries(ALL_PLANS.map((plan) => [plan.slug, plan]))
);

const plansByRole = Object.freeze({
  hr: HR_PLANS,
  student: STUDENT_PLANS,
  campus_connect: CAMPUS_PLANS
});

export const getPlanBySlug = (slug) => plansBySlug[slug] || null;

export const getPlansForRole = (role) => plansByRole[role] || [];

export const getTrialDaysForRole = (role) => TRIAL_DAYS[role] || 0;

// ── Subscription Status Helpers ─────────────────────────────────────────────

export const SUBSCRIPTION_STATUSES = Object.freeze({
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PENDING: 'pending',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PAST_DUE: 'past_due'
});

export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  const status = String(subscription.status || '').toLowerCase();
  if (!['active', 'trialing', 'pending'].includes(status)) return false;
  if (!subscription.ends_at) return true;
  return new Date(subscription.ends_at).getTime() >= Date.now();
};

export const isTrialing = (subscription) => {
  if (!subscription) return false;
  return String(subscription.status || '').toLowerCase() === 'trialing';
};

export const getTrialRemainingDays = (subscription) => {
  if (!subscription || !isTrialing(subscription)) return 0;
  const endsAt = subscription.trial_ends_at || subscription.ends_at;
  if (!endsAt) return 0;
  const remaining = Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
};

export const getSubscriptionRemainingDays = (subscription) => {
  if (!subscription) return 0;
  const endsAt = subscription.ends_at;
  if (!endsAt) return Infinity;
  const remaining = Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
};

export const canAccessFeature = (featureKey, currentTier, role) => {
  if (role === 'admin' || role === 'super_admin') return true;
  const required = FEATURE_REQUIREMENTS[featureKey];
  if (required === undefined) return true;
  return currentTier >= required;
};

export const getMinimumPlanForFeature = (featureKey, role) => {
  const required = FEATURE_REQUIREMENTS[featureKey];
  if (required === undefined || required === 0) return null;
  const rolePlans = getPlansForRole(role);
  return rolePlans.find((plan) => plan.tier >= required) || null;
};

// ── Formatting Helpers ──────────────────────────────────────────────────────

export const formatPrice = (price, currency = '₹') => {
  if (!price || price <= 0) return 'Free';
  return `${currency}${Number(price).toLocaleString('en-IN')}`;
};

export const formatTrialLabel = (role) => {
  const days = TRIAL_DAYS[role];
  if (!days) return '';
  if (days >= 30) return '1 month free trial';
  return `${days} day free trial`;
};

export const formatBillingCycle = (plan) => {
  if (!plan) return '';
  if (plan.price <= 0) return 'free during trial';
  return `/${plan.billingCycle || 'month'}`;
};
