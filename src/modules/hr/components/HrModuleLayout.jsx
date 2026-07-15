import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiBarChart2,
  FiBell,
  FiBook,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiHome,
  FiHelpCircle,
  FiLink,
  FiLayers,
  FiSend,
  FiStar,
  FiUser,
  FiUsers,
  FiFileText,
  FiX
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import usePlanAccess from '../../../shared/hooks/usePlanAccess';
import { getHrJobs, getPricingPlans } from '../services/hrApi';
import {
  formatRoleTrialProgressLabel,
  isUsableRoleSubscription
} from '../../../shared/utils/roleSubscriptions';

const hrNavItems = [
  { to: '/portal/hr/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/portal/hr/jobs', label: 'Job Postings', icon: FiBriefcase },
  { to: '/portal/hr/consultancy', label: 'Consultancy MIS', icon: FiLayers },
  { to: '/portal/hr/candidates', label: 'Candidate DB', icon: FiUsers },
  { to: '/portal/hr/shortlisted', label: 'Shortlisted', icon: FiStar },
  { to: '/portal/hr/interests', label: 'Sent Interests', icon: FiSend },
  { to: '/portal/hr/interviews', label: 'Interviews', icon: FiCalendar },
  { to: '/portal/hr/campus-connections', label: 'Campus Connections', icon: FiLink },
  { to: '/portal/hr/campus-drives', label: 'Campus Drives', icon: FiBook },
  { to: '/portal/hr/notifications', label: 'Notifications', icon: FiBell },
  { to: '/portal/hr/analytics', label: 'Reports', icon: FiFileText },
  { to: '/portal/hr/employee-verification', label: 'Employee Verification', icon: FiCheckSquare },
  { to: '/portal/hr/help-support', label: 'Help & Support', icon: FiHelpCircle }
];

const trackedJobPlanSlugs = ['premium', 'hot_vacancy', 'standard'];
const fallbackPlanNames = {
  premium: 'Premium',
  hot_vacancy: 'Hot Vacancy',
  standard: 'Normal',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
  hr_starter: 'Starter',
  hr_growth: 'Growth',
  hr_enterprise: 'Enterprise'
};

const getJobPlanSlug = (job = {}) =>
  String(job.planSlug || job.plan_slug || job.pricingPlanSlug || job.pricing_plan_slug || job.plan?.slug || '').trim().toLowerCase();

const formatPlanName = (value = '') => {
  const slug = String(value || '').trim().toLowerCase();
  if (!slug) return '';
  return fallbackPlanNames[slug] || slug.replace(/^hr_/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const hasDisplayableSubscription = (subscription = null) =>
  Boolean(subscription?.role_plan_slug) && isUsableRoleSubscription(subscription);

const HrModuleLayout = () => {
  const { currentPlanConfig, isActive, loading, planName, subscription, isTrialing, trialDaysRemaining, subscriptionDaysRemaining } = usePlanAccess();
  const [planPopoverOpen, setPlanPopoverOpen] = useState(false);
  const [planUsage, setPlanUsage] = useState({
    loading: false,
    error: '',
    stats: trackedJobPlanSlugs.map((slug) => ({
      slug,
      label: fallbackPlanNames[slug],
      posted: 0
    }))
  });
  const popoverRef = useRef(null);
  const displayableSubscription = hasDisplayableSubscription(subscription);
  const currentPlanName = loading
    ? 'Loading...'
    : (displayableSubscription
      ? (currentPlanConfig?.name || planName || formatPlanName(subscription?.role_plan_slug) || 'Active plan')
      : 'No active plan');
  const planStatusText = loading
    ? 'Checking plan...'
    : !displayableSubscription
      ? 'No active subscription'
      : (isTrialing || subscription?.meta?.isTrial)
        ? formatRoleTrialProgressLabel(subscription, trialDaysRemaining || subscriptionDaysRemaining || 0)
        : isActive
          ? `${subscriptionDaysRemaining || 0} days left`
          : 'Plan selected, auto-pay pending';

  const totalPostedJobs = useMemo(
    () => planUsage.stats.reduce((sum, item) => sum + Number(item.posted || 0), 0),
    [planUsage.stats]
  );

  useEffect(() => {
    if (!planPopoverOpen) return undefined;

    const handleClickAway = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPlanPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [planPopoverOpen]);

  useEffect(() => {
    if (!planPopoverOpen) return;

    let mounted = true;
    setPlanUsage((current) => ({ ...current, loading: true, error: '' }));

    const loadUsage = async () => {
      const [jobsRes, plansRes] = await Promise.all([
        getHrJobs(),
        getPricingPlans()
      ]);
      if (!mounted) return;

      const jobCounts = Object.fromEntries(trackedJobPlanSlugs.map((slug) => [slug, 0]));
      for (const job of jobsRes.data || []) {
        const slug = getJobPlanSlug(job);
        if (jobCounts[slug] !== undefined) jobCounts[slug] += 1;
      }

      const planNameBySlug = Object.fromEntries((plansRes.data || []).map((plan) => [plan.slug, plan.name || fallbackPlanNames[plan.slug] || plan.slug]));
      const stats = trackedJobPlanSlugs.map((slug) => ({
        slug,
        label: planNameBySlug[slug] || fallbackPlanNames[slug],
        posted: jobCounts[slug] || 0
      }));

      setPlanUsage({
        loading: false,
        error: [jobsRes.error, plansRes.error].filter(Boolean).join(' | '),
        stats
      });
    };

    loadUsage();
    return () => {
      mounted = false;
    };
  }, [planPopoverOpen]);

  return (
    <PortalWorkbenchLayout
      portalKey="hr"
      portalLabel="HR Dashboard"
      subtitle="Hiring"
      navItems={hrNavItems}
      support={{
        showCard: false,
        title: 'Hiring',
        text: 'Track roles, applicants, and interviews in one place.',
        searchPlaceholder: 'Search candidates or jobs',
        headerAction: (
          <div ref={popoverRef} className="relative hidden items-center gap-2 xl:inline-flex">
            <button
              type="button"
              onClick={() => setPlanPopoverOpen((open) => !open)}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Current plan: {currentPlanName}
            </button>
            {planPopoverOpen && (
              <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-80 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-xl">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">Current Plan</p>
                    <p className="mt-1 text-base font-extrabold text-slate-900">{currentPlanName}</p>
                    <p className="mt-0.5 text-xs font-semibold text-neutral-500">{planStatusText}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlanPopoverOpen(false)}
                    className="rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-slate-700"
                    aria-label="Close plan status"
                  >
                    <FiX size={14} />
                  </button>
                </div>

                <div className="rounded-xl bg-neutral-50 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400">Jobs Posted</p>
                  <p className="mt-0.5 text-lg font-extrabold text-slate-900">{totalPostedJobs}</p>
                </div>

                <div className="mt-3 space-y-2">
                  {planUsage.stats.map((item) => (
                    <div key={item.slug} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-neutral-100 px-3 py-2">
                      <p className="truncate text-xs font-bold text-slate-800">{item.label}</p>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">Posted</p>
                        <p className="text-sm font-extrabold text-slate-900">{item.posted}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {planUsage.loading ? (
                  <p className="mt-3 text-xs font-semibold text-neutral-500">Loading latest plan usage...</p>
                ) : null}
                {planUsage.error ? (
                  <p className="mt-3 text-xs font-semibold text-amber-700">{planUsage.error}</p>
                ) : null}
                {subscription?.ends_at ? (
                  <p className="mt-3 text-[11px] font-semibold text-neutral-400">
                    Valid till {new Date(subscription.ends_at).toLocaleDateString('en-IN')}
                  </p>
                ) : null}
              </div>
            )}
            <Link
              to="/portal/hr/jobs?tab=billing&billingTab=subscription"
              className="rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-[13px] font-semibold text-sky-700 transition-colors hover:bg-sky-100"
            >
              Upgrade Plan
            </Link>
          </div>
        )
      }}
    />
  );
};

export default HrModuleLayout;
