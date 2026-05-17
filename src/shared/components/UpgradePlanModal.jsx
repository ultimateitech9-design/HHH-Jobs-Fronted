import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiLock, FiX, FiZap } from 'react-icons/fi';
import { apiFetch } from '../../utils/api';
import { getCurrentUser } from '../../utils/auth';
import { hrStarterPricing } from '../config/pricingCatalog';
import { formatTrialLabel } from '../constants/planConfig';
import { openRazorpaySubscriptionCheckout, preloadRazorpayCheckout } from '../utils/razorpayCheckout';

const tierNames = ['Free', 'Starter', 'Professional', 'Enterprise'];
const tierColors = [
  'border-slate-200 bg-slate-50',
  'border-blue-200 bg-blue-50',
  'border-indigo-200 bg-indigo-50 ring-2 ring-indigo-400/30',
  'border-amber-200 bg-amber-50'
];
const tierBadgeColors = [
  'bg-slate-200 text-slate-700',
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-800'
];

const formatPlanPrice = (plan = {}) => {
  const listPrice = Number(plan?.meta?.listPrice || (plan.slug === hrStarterPricing.slug ? hrStarterPricing.listPrice : plan.price) || 0);
  if (listPrice <= 0) return 'Free';
  return `₹${listPrice.toLocaleString('en-IN')}`;
};

const getRenewalPrice = (plan = {}) =>
  Number(plan?.meta?.trialRenewalPrice || (plan.slug === hrStarterPricing.slug ? hrStarterPricing.trialRenewalPrice : plan.price) || 0);

const rolePlanNames = {
  hr: 'HR',
  student: 'Student',
  campus_connect: 'Campus'
};

const safeParseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
};

const logUpgradePlanDebug = (label, payload) => {
  if (!import.meta.env?.DEV) return;
  console.groupCollapsed(`[UpgradePlanModal] ${label}`);
  console.log(payload);
  console.groupEnd();
};

const UpgradePlanModal = ({
  isOpen,
  onClose,
  featureKey = '',
  featureLabel = '',
  currentTier = 0,
  requiredTier = 1,
  audienceRole = 'hr'
}) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/pricing/role-plans?audienceRole=${audienceRole}`);
        const payload = await response.json();
        setPlans(payload?.plans || []);
      } catch (error) {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [isOpen, audienceRole]);

  useEffect(() => {
    if (!isOpen) return;
    setCheckoutMessage('');
  }, [isOpen, featureKey, audienceRole]);

  useEffect(() => {
    if (!isOpen) return;
    preloadRazorpayCheckout().catch(() => {});
  }, [isOpen]);

  const handleCheckout = useCallback(async (planSlug) => {
    setCheckoutLoading(planSlug);
    setCheckoutMessage('');
    try {
      logUpgradePlanDebug('checkout request', {
        audienceRole,
        featureKey,
        planSlug,
        provider: 'razorpay',
        paymentStatus: 'pending'
      });

      const response = await apiFetch('/pricing/role-plans/checkout', {
        method: 'POST',
        body: JSON.stringify({
          planSlug,
          quantity: 1,
          provider: 'razorpay',
          paymentStatus: 'pending'
        })
      });

      const payload = await safeParseJson(response);

      logUpgradePlanDebug('checkout response', {
        ok: response.ok,
        status: response.status,
        payload
      });

      const paymentSession = payload?.paymentSession || {};
      const localSubscriptionId = paymentSession.localSubscriptionId || paymentSession.local_subscription_id || '';
      const shortUrl = paymentSession.shortUrl || paymentSession.short_url || '';
      const subscriptionId =
        paymentSession.subscriptionId
        || paymentSession.subscription_id
        || paymentSession.razorpaySubscriptionId
        || paymentSession.razorpay_subscription_id
        || '';
      const razorpayKeyId =
        paymentSession.keyId
        || paymentSession.key_id
        || paymentSession.razorpayKeyId
        || paymentSession.razorpay_key_id
        || '';
      const hasSubscriptionSession = Boolean(subscriptionId);
      const hasDirectCheckoutSession = Boolean(subscriptionId && razorpayKeyId);

      logUpgradePlanDebug('normalized payment session', {
        localSubscriptionId,
        shortUrl,
        subscriptionId,
        razorpayKeyId,
        hasSubscriptionSession,
        hasDirectCheckoutSession
      });

      if (hasSubscriptionSession && !hasDirectCheckoutSession && shortUrl) {
        window.location.assign(shortUrl);
        return;
      }

      if (hasSubscriptionSession && !hasDirectCheckoutSession) {
        throw new Error('Razorpay checkout session is incomplete. Missing key id for direct checkout.');
      }

      if (hasDirectCheckoutSession) {
        logUpgradePlanDebug('using direct Razorpay checkout', {
          subscriptionId,
          razorpayKeyId
        });
      }

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Unable to start Razorpay checkout.');
      }

      if (payload?.alreadyAuthorized) {
        onClose?.();
        window.location.reload();
        return;
      }

      if (hasDirectCheckoutSession) {
        const trialLabel = formatTrialLabel(audienceRole) || 'free trial';
        const checkoutResult = await openRazorpaySubscriptionCheckout({
          ...paymentSession,
          name: `HHH Jobs ${rolePlanNames[audienceRole] || 'Premium'} Plan`,
          description: `Start your ${trialLabel} now and enable Razorpay auto-pay for renewal.`
        });

        logUpgradePlanDebug('razorpay checkout result', checkoutResult);

        if (checkoutResult.dismissed) {
          setCheckoutMessage('Checkout was closed before auto-pay authorisation completed.');
          return;
        }

        const verifyResponse = await apiFetch('/payments/role-subscriptions/verify', {
          method: 'POST',
          body: JSON.stringify({
            localSubscriptionId,
            razorpaySubscriptionId: checkoutResult.razorpaySubscriptionId,
            razorpayPaymentId: checkoutResult.razorpayPaymentId,
            razorpaySignature: checkoutResult.razorpaySignature,
            audienceRole
          })
        });

        const verifyPayload = await safeParseJson(verifyResponse);

        logUpgradePlanDebug('verify response', {
          ok: verifyResponse.ok,
          status: verifyResponse.status,
          payload: verifyPayload
        });

        if (!verifyResponse.ok) {
          throw new Error(verifyPayload?.message || verifyPayload?.error || 'Unable to verify Razorpay auto-pay authorisation.');
        }

        onClose?.();
        window.location.reload();
        return;
      }

      if (shortUrl) {
        window.location.assign(shortUrl);
        return;
      }

      if (payload?.subscription || payload?.purchase?.status === 'paid') {
        onClose?.();
        window.location.reload();
        return;
      }

      setCheckoutMessage(
        payload?.fallbackReason
        || payload?.message
        || 'Plan request submitted successfully. Please wait for confirmation.'
      );
    } catch (error) {
      logUpgradePlanDebug('checkout error', error);
      setCheckoutMessage(String(error?.message || 'Checkout failed.'));
    } finally {
      setCheckoutLoading('');
    }
  }, [onClose, audienceRole, featureKey]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl animate-slide-up rounded-2xl border border-slate-200 bg-white shadow-strong">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <FiLock size={16} />
              </span>
              <h2 className="font-heading text-lg font-bold text-slate-900">Upgrade Your Plan</h2>
            </div>
            {featureLabel && (
              <p className="mt-2 text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{featureLabel}</span> requires a {tierNames[requiredTier]} plan or higher.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((plan, index) => {
                const planTier = index + 1;
                const isCurrent = plan.slug === getCurrentUser()?.activePlanSlug || planTier <= currentTier;
                const isRecommended = planTier === requiredTier;
                const colorClass = tierColors[Math.min(planTier, 3)] || tierColors[0];
                const badgeClass = tierBadgeColors[Math.min(planTier, 3)] || tierBadgeColors[0];

                return (
                  <div
                    key={plan.id || plan.slug}
                    className={`relative rounded-xl border p-4 transition ${colorClass} ${isRecommended ? 'scale-[1.02]' : ''}`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        <FiZap size={10} /> Recommended
                      </span>
                    )}

                    <div className="mb-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}>
                        {plan.name}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {formatPlanPrice(plan)}
                      </span>
                      {plan.billingCycle && plan.price > 0 && (
                        <span className="text-xs text-slate-500">/{plan.billingCycle}</span>
                      )}
                      {getRenewalPrice(plan) < Number(plan?.meta?.listPrice || plan.price || 0) ? (
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          After trial ₹{getRenewalPrice(plan).toLocaleString('en-IN')}/month
                        </p>
                      ) : null}
                    </div>

                    <ul className="mb-4 space-y-1.5">
                      {(plan.features || []).slice(0, 5).map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-xs text-slate-600">
                          <FiCheck size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <span className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">
                        Current Plan
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={checkoutLoading === plan.slug}
                        onClick={() => handleCheckout(plan.slug)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {checkoutLoading === plan.slug ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <FiZap size={12} />
                        )}
                        Upgrade Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No plans available at the moment.</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4">
          {checkoutMessage ? (
            <p className="mb-2 text-center text-xs font-semibold leading-5 text-brand-700">
              {checkoutMessage}
            </p>
          ) : null}
          <p className="text-center text-xs text-slate-400">
            Plans are billed securely via Razorpay. Cancel anytime from your account settings.
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default UpgradePlanModal;
