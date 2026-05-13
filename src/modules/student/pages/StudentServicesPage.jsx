import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiLayers,
  FiLock,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiZap
} from 'react-icons/fi';
import PlanUpgradeModal from '../../../shared/components/PlanUpgradeModal';
import {
  StudentPageShell,
  StudentSurfaceCard,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import {
  checkoutStudentRolePlan,
  getCurrentStudentRoleSubscription,
  getStudentRolePlanQuote,
  getStudentRolePlans,
  verifyStudentRolePlanAutopay
} from '../services/studentApi';
import { openRazorpaySubscriptionCheckout } from '../../../shared/utils/razorpayCheckout';
import { TRIAL_DAYS, formatTrialLabel } from '../../../shared/constants/planConfig';

const mainServices = [
  {
    title: 'Auto Apply',
    description: 'Set criteria once and let HHH Jobs run ATS-gated, AI-assisted applications on matching roles for you.',
    points: ['Criteria builder', 'ATS threshold gate', 'AI cover letters'],
    icon: FiZap,
    to: '/portal/student/auto-apply',
    cta: 'Configure Auto Apply',
    featureKey: 'auto_apply'
  },
  {
    title: 'Premium HR Visibility',
    description: 'Boost profile strength so HR teams can notice you faster and take your resume more seriously.',
    points: ['Stronger recruiter visibility', 'Better profile presentation', 'Improved response chance'],
    icon: FiStar,
    to: '/portal/student/profile',
    cta: 'Upgrade profile',
    featureKey: 'premium_visibility'
  },
  {
    title: 'Best-Fit Ranking',
    description: 'Use fit-based guidance to focus on roles where your profile and resume match best.',
    points: ['Role-fit insights', 'ATS improvement support', 'Smarter targeting'],
    icon: FiTarget,
    to: '/portal/student/ats',
    cta: 'Check ATS fit',
    featureKey: 'ats_fit'
  }
];

const supportServices = [
  { label: 'Saved jobs and shortlist tracking', icon: FiBookmark, to: '/portal/student/saved-jobs' },
  { label: 'Application progress monitoring', icon: FiLayers, to: '/portal/student/applications' },
  { label: 'Interview planning and follow-up', icon: FiTrendingUp, to: '/portal/student/interviews' },
  { label: 'Portal job discovery in one place', icon: FiBriefcase, to: '/portal/student/jobs' },
  { label: 'ATS score history and improvements', icon: FiActivity, to: '/portal/student/ats' },
  { label: 'More tools as your profile grows', icon: FiCheckCircle, to: '/portal/student/profile' }
];

const StudentServicesPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [quote, setQuote] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [billingMessage, setBillingMessage] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState(null);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.slug === currentPlan?.role_plan_slug) || null,
    [plans, currentPlan]
  );

  const activeFeatureSet = useMemo(() => {
    const values = [
      ...(Array.isArray(activePlan?.features) ? activePlan.features : []),
      ...(Array.isArray(currentPlan?.meta?.features) ? currentPlan.meta.features : [])
    ];
    return new Set(values.flatMap((item) => {
      const normalized = String(item || '').toLowerCase().replace(/[\s-]+/g, '_');
      return [normalized, normalized.replace(/_/g, '')];
    }));
  }, [activePlan, currentPlan]);

  const hasActivePlan = useMemo(() => {
    if (!currentPlan) return false;
    const status = String(currentPlan.status || '').toLowerCase();
    if (status && !['active', 'pending'].includes(status)) return false;
    if (!currentPlan.ends_at) return true;
    return new Date(currentPlan.ends_at).getTime() >= Date.now();
  }, [currentPlan]);

  const canUseFeature = (featureKey = '') => {
    if (!hasActivePlan) return false;
    if (activeFeatureSet.size === 0) return true;
    const normalized = String(featureKey || '').toLowerCase().replace(/[\s-]+/g, '_');
    return activeFeatureSet.has(normalized) || activeFeatureSet.has(normalized.replace(/_/g, '')) || activeFeatureSet.has('all') || activeFeatureSet.has('all_features');
  };

  useEffect(() => {
    Promise.all([
      getStudentRolePlans(),
      getCurrentStudentRoleSubscription()
    ]).then(([plansRes, subscriptionRes]) => {
      setPlans(plansRes.data || []);
      setSelectedPlanSlug((plansRes.data || [])[0]?.slug || '');
      setCurrentPlan(subscriptionRes.data || null);
    });
  }, []);

  useEffect(() => {
    if (!selectedPlanSlug) {
      setQuote(null);
      return;
    }

    getStudentRolePlanQuote({ planSlug: selectedPlanSlug, quantity: 1, couponCode })
      .then((response) => setQuote(response))
      .catch(() => setQuote(null));
  }, [selectedPlanSlug, couponCode]);

  const handleCheckout = async () => {
    if (!selectedPlanSlug) return;
    setBillingLoading(true);
    setBillingMessage('');
    try {
      const response = await checkoutStudentRolePlan({
        planSlug: selectedPlanSlug,
        quantity: 1,
        couponCode,
        provider: 'razorpay',
        paymentStatus: 'pending'
      });

      if (response?.alreadyAuthorized) {
        setBillingMessage(`Auto-pay is already active for your student plan. Your ${TRIAL_DAYS.student}-day trial will renew automatically.`);
      } else if (response?.paymentSession?.subscriptionId) {
        const checkoutResult = await openRazorpaySubscriptionCheckout({
          ...response.paymentSession,
          name: 'HHH Jobs Student Plan',
          description: `Start your ${formatTrialLabel('student')} now and enable auto-pay for renewal.`
        });

        if (checkoutResult.dismissed) {
          setBillingMessage('Checkout was closed before auto-pay authorisation completed.');
          return;
        }

        await verifyStudentRolePlanAutopay({
          localSubscriptionId: response.paymentSession.localSubscriptionId,
          razorpaySubscriptionId: checkoutResult.razorpaySubscriptionId,
          razorpayPaymentId: checkoutResult.razorpayPaymentId,
          razorpaySignature: checkoutResult.razorpaySignature
        });
        setBillingMessage(`${TRIAL_DAYS.student}-day student free trial is active and Razorpay auto-pay is now enabled for renewal.`);
      } else if (response?.mode === 'manual_fallback' && response?.purchase) {
        setBillingMessage(
          response?.fallbackReason
          || 'Auto-pay is not ready yet, so a manual student plan request was created for admin approval.'
        );
      } else {
        setBillingMessage(response?.purchase?.status === 'paid'
          ? 'Student plan activated successfully.'
          : 'Student plan request submitted for admin approval.');
      }

      const subscriptionRes = await getCurrentStudentRoleSubscription();
      setCurrentPlan(subscriptionRes.data || null);
    } catch (checkoutError) {
      setBillingMessage(String(checkoutError.message || 'Unable to submit student plan request.'));
    } finally {
      setBillingLoading(false);
    }
  };

  const handleServiceOpen = (service) => {
    if (canUseFeature(service.featureKey)) {
      navigate(service.to);
      return;
    }

    setUpgradeFeature(service);
  };

  return (
    <StudentPageShell showHero={false} bodyClassName="mx-auto max-w-[1180px] space-y-4 pb-8">
      <section className="overflow-hidden rounded-[1.8rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,251,245,0.98),rgba(255,255,255,0.98)_48%,rgba(247,250,255,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-700">
            Student Services
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
            Clean service hub
          </span>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
          <div>
            <h1 className="font-heading text-[2rem] font-bold leading-tight text-navy md:text-[2.35rem]">
              Better services for students, without the clutter
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Everything important is grouped here in a cleaner format: auto apply support, premium HR visibility,
              best-fit job targeting, and extra tools that help you move faster.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link to="/portal/student/jobs" className={`${studentPrimaryButtonClassName} px-4 py-2 text-[13px]`}>
                <FiBriefcase size={15} />
                Explore services
              </Link>
              <Link to="/portal/student/profile" className={`${studentSecondaryButtonClassName} px-4 py-2 text-[13px]`}>
                <FiStar size={15} />
                Improve visibility
              </Link>
            </div>
          </div>

          <div className="grid gap-2.5">
            {[
              { label: 'Core offers', value: '3' },
              { label: 'Support tools', value: '6+' },
              { label: 'Best for', value: 'Fast growth' }
            ].map((item) => (
              <div key={item.label} className="rounded-[1rem] border border-slate-200 bg-white/90 px-3.5 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-1 text-base font-bold text-navy">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StudentSurfaceCard
        eyebrow="Main Services"
        title="What we provide"
        subtitle="Compact cards, clear value, and direct actions only."
        className="p-4 xl:p-5"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mainServices.map((service) => {
            const unlocked = canUseFeature(service.featureKey);
            return (
            <article
              key={service.title}
              className="rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-brand-50 text-brand-700">
                  <service.icon size={18} />
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${unlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {unlocked ? <FiCheckCircle size={13} /> : <FiLock size={13} />}
                  {unlocked ? 'Unlocked' : 'Upgrade'}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-bold text-navy">{service.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{service.description}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {service.points.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleServiceOpen(service)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition hover:text-brand-800"
              >
                {unlocked ? service.cta : 'View upgrade options'}
                <FiArrowRight size={15} />
              </button>
            </article>
            );
          })}
        </div>
      </StudentSurfaceCard>

      <StudentSurfaceCard
        eyebrow="More Services"
        title="And many more"
        subtitle="Extra student-side tools that keep your job hunt organized."
        className="p-4 xl:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {supportServices.map((service) => (
            <Link
              key={service.label}
              to={service.to}
              className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white px-3.5 py-3 transition hover:border-brand-200 hover:bg-brand-50/40"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.85rem] bg-slate-50 text-slate-600">
                <service.icon size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">{service.label}</p>
                <p className="mt-1 text-xs font-semibold text-brand-700">Open tool</p>
              </div>
            </Link>
          ))}
        </div>
      </StudentSurfaceCard>

      <StudentSurfaceCard
        eyebrow="Why It Helps"
        title="Simple, focused, and useful"
        subtitle="No extra clutter. Just the services students actually need."
        className="p-4 xl:p-5"
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            'Apply faster on relevant jobs instead of wasting time on low-fit roles.',
            'Improve HR visibility with a stronger profile and better presentation.',
            'Use ATS and fit support to target jobs where you have a better chance.'
          ].map((item) => (
            <div key={item} className="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <FiCheckCircle size={15} />
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </StudentSurfaceCard>

      <StudentSurfaceCard
        eyebrow="Student Plans"
        title="Premium plan checkout"
        subtitle="Student-side subscription flow is now available inside the current services page."
        className="p-4 xl:p-5"
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {plans.map((plan) => (
              <button
                type="button"
                key={plan.slug}
                onClick={() => setSelectedPlanSlug(plan.slug)}
                className={`rounded-[1.1rem] border p-4 text-left transition ${selectedPlanSlug === plan.slug ? 'border-brand-400 bg-brand-50/50' : 'border-slate-200 bg-white hover:border-brand-200'}`}
              >
                <p className="text-lg font-bold text-navy">{plan.name}</p>
                <p className="mt-1 text-sm text-slate-500">{plan.description || 'Student growth plan'}</p>
                <p className="mt-3 text-2xl font-black text-brand-700">{plan.currency} {plan.price}</p>
              </button>
            ))}
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Current Plan</p>
            <p className="mt-2 text-lg font-bold text-navy">{currentPlan?.role_plan_slug || 'No active plan'}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {currentPlan?.meta?.isTrial
                ? `${TRIAL_DAYS.student}-day free trial active until ${new Date(currentPlan?.trial_ends_at || currentPlan?.ends_at || Date.now()).toLocaleDateString()}.`
                : (currentPlan?.ends_at ? `Renewal cycle active until ${new Date(currentPlan.ends_at).toLocaleDateString()}.` : 'Choose a plan to start your student premium flow.')}
            </p>
            <p className="mt-1 text-xs font-semibold text-brand-700">
              {currentPlan?.autopay_enabled
                ? `Auto-pay status: ${currentPlan?.autopay_status || 'active'}`
                : 'Auto-pay not enabled yet'}
            </p>
            <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Coupon code" className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold uppercase" />
            {quote ? (
              <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{quote.currency} {quote.subtotal}</span></div>
                <div className="mt-1 flex justify-between text-emerald-700"><span>Discount</span><span>-{quote.currency} {quote.discountAmount}</span></div>
                <div className="mt-1 flex justify-between"><span>GST</span><span>{quote.currency} {quote.gstAmount}</span></div>
                <div className="mt-2 flex justify-between border-t border-brand-200 pt-2 font-black text-brand-800"><span>Total</span><span>{quote.currency} {quote.totalAmount}</span></div>
              </div>
            ) : null}
            {billingMessage ? <p className="mt-4 text-sm font-semibold text-brand-700">{billingMessage}</p> : null}
            <button onClick={handleCheckout} disabled={billingLoading || !selectedPlanSlug} className="mt-5 w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-50">
              {billingLoading ? 'Processing...' : `Start ${TRIAL_DAYS.student}-Day Trial + Enable Auto-pay`}
            </button>
          </div>
        </div>
      </StudentSurfaceCard>

      <PlanUpgradeModal
        open={Boolean(upgradeFeature)}
        title="Unlock student premium tools"
        subtitle={`Start your ${formatTrialLabel('student')} to unlock premium services like auto apply, recruiter visibility, and ATS fit guidance.`}
        featureName={upgradeFeature?.title}
        plans={plans}
        currentPlan={currentPlan}
        selectedPlanSlug={selectedPlanSlug}
        couponCode={couponCode}
        quote={quote}
        loading={billingLoading}
        message={billingMessage}
        onClose={() => setUpgradeFeature(null)}
        onSelectPlan={setSelectedPlanSlug}
        onCouponChange={setCouponCode}
        onCheckout={handleCheckout}
      />
    </StudentPageShell>
  );
};

export default StudentServicesPage;
