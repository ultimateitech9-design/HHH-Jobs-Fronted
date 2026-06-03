import { useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiRefreshCw,
  FiShield,
  FiXCircle
} from 'react-icons/fi';
import {
  cancelCampusRoleSubscription,
  checkoutCampusRolePlan,
  getCampusRolePlanPurchases,
  getCampusRolePlanQuote,
  getCampusRolePlans,
  getCampusRoleSubscriptions,
  getCurrentCampusRoleSubscription,
  verifyCampusRolePlanAutopay
} from '../services/campusConnectApi';
import { openRazorpaySubscriptionCheckout } from '../../../shared/utils/razorpayCheckout';
import { TRIAL_DAYS, formatTrialLabel } from '../../../shared/constants/planConfig';

const formatCurrency = (value, _currency = 'INR') =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusTone = (status = '') => {
  const normalized = String(status || '').toLowerCase();
  if (['active', 'trialing', 'paid'].includes(normalized)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['pending', 'created', 'authenticated'].includes(normalized)) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (['cancelled', 'failed', 'expired'].includes(normalized)) return 'border-red-200 bg-red-50 text-red-600';
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

const isUsableSubscription = (subscription) => {
  if (!subscription) return false;
  const status = String(subscription.status || '').toLowerCase();
  if (!['active', 'trialing'].includes(status)) return false;
  if (subscription.meta?.pendingAutopaySetup || subscription.meta?.pendingPlanChangeSetup) return false;
  if (!subscription.autopay_enabled && (status === 'trialing' || subscription.meta?.isTrial)) return false;
  if (!subscription.ends_at) return true;
  return new Date(subscription.ends_at).getTime() >= Date.now();
};

const CampusBillingPage = () => {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [quote, setQuote] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const activePlan = plans[0] || null;
  const selectedPlanSlug = activePlan?.slug || 'campus_basic';
  const usableSubscription = isUsableSubscription(currentSubscription);
  const isTrial = Boolean(currentSubscription?.meta?.isTrial || currentSubscription?.trial_ends_at);

  const activePlanMeta = activePlan?.meta || {};
  const listPrice = Number(activePlanMeta.listPrice || activePlan?.listPrice || 2999);
  const monthlyPrice = Number(activePlanMeta.trialRenewalPrice || activePlan?.price || 1599);

  const refreshBilling = async () => {
    setLoading(true);
    setError('');
    const [plansRes, currentRes, subscriptionsRes, purchasesRes] = await Promise.all([
      getCampusRolePlans(),
      getCurrentCampusRoleSubscription(),
      getCampusRoleSubscriptions(),
      getCampusRolePlanPurchases()
    ]);

    setPlans(plansRes.data || []);
    setCurrentSubscription(currentRes.data || null);
    setSubscriptions(subscriptionsRes.data || []);
    setPurchases(purchasesRes.data || []);
    setError([plansRes.error, currentRes.error, subscriptionsRes.error, purchasesRes.error].filter(Boolean).join(' | '));
    setLoading(false);
  };

  useEffect(() => {
    refreshBilling();
  }, []);

  useEffect(() => {
    if (!selectedPlanSlug) {
      setQuote(null);
      return;
    }

    getCampusRolePlanQuote({ planSlug: selectedPlanSlug, quantity: 1, couponCode })
      .then((response) => setQuote(response))
      .catch(() => setQuote(null));
  }, [couponCode, selectedPlanSlug]);

  const handleCheckout = async () => {
    if (!selectedPlanSlug) return;
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await checkoutCampusRolePlan({
        planSlug: selectedPlanSlug,
        quantity: 1,
        couponCode,
        provider: 'razorpay',
        paymentStatus: 'pending'
      });

      if (response?.alreadyAuthorized) {
        setMessage('Auto-pay is already authorized. Your Campus Connect access is active.');
      } else if (response?.paymentSession?.subscriptionId) {
        const checkoutResult = await openRazorpaySubscriptionCheckout({
          ...response.paymentSession,
          name: 'HHH Jobs Campus Connect',
          description: `Enable auto-pay first, then start your ${formatTrialLabel('campus_connect')}.`
        });

        if (checkoutResult.dismissed) {
          setMessage('Checkout was closed before auto-pay authorization finished.');
          return;
        }

        await verifyCampusRolePlanAutopay({
          localSubscriptionId: response.paymentSession.localSubscriptionId,
          razorpaySubscriptionId: checkoutResult.razorpaySubscriptionId,
          razorpayPaymentId: checkoutResult.razorpayPaymentId,
          razorpaySignature: checkoutResult.razorpaySignature
        });
        setMessage(`${TRIAL_DAYS.campus_connect}-day free trial is active. Auto-pay is enabled for renewal.`);
      } else if (response?.mode === 'manual_fallback' && response?.purchase) {
        setMessage(response?.fallbackReason || 'Manual campus subscription request was created for admin approval.');
      } else {
        setMessage('Campus subscription request submitted.');
      }

      await refreshBilling();
    } catch (checkoutError) {
      setError(checkoutError.message || 'Unable to start Campus Connect billing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentSubscription?.id) return;
    const confirmed = window.confirm('Cancel Campus Connect subscription and auto-pay? Sales team will be notified for feedback.');
    if (!confirmed) return;

    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await cancelCampusRoleSubscription({
        subscriptionId: currentSubscription.id,
        reason: 'College cancelled Campus Connect from billing page'
      });
      setMessage(response.message || 'Campus Connect subscription cancelled.');
      await refreshBilling();
    } catch (cancelError) {
      setError(cancelError.message || 'Unable to cancel subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  const latestRows = useMemo(() => {
    const purchaseRows = purchases.map((purchase) => ({
      id: purchase.id,
      type: 'Purchase',
      label: purchase.role_plan_slug || 'Campus Connect',
      amount: purchase.total_amount,
      currency: purchase.currency || 'INR',
      status: purchase.status,
      date: purchase.created_at || purchase.paid_at
    }));
    const subscriptionRows = subscriptions.map((subscription) => ({
      id: subscription.id,
      type: 'Subscription',
      label: subscription.role_plan_slug || 'Campus Connect',
      amount: subscription.amount,
      currency: subscription.currency || 'INR',
      status: subscription.status,
      date: subscription.created_at || subscription.activated_at
    }));

    return [...purchaseRows, ...subscriptionRows]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 12);
  }, [purchases, subscriptions]);

  return (
    <div className="vw-shell space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700">Campus Billing</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">Subscription & Auto-pay</h1>
          <p className="mt-1 text-sm text-slate-500">
            New colleges get 1 month free access after Razorpay auto-pay authorization.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshBilling}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <FiRefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <FiAlertCircle size={16} />
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <FiCheckCircle size={16} />
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Single Plan</p>
              <h2 className="mt-2 text-2xl font-black text-navy">{activePlan?.name || 'Campus Connect'}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                One simple college plan with student import, campus drives, company connections, applicant tracking,
                analytics, and placement report export.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-right">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">Monthly</p>
              <p className="mt-1 text-sm font-bold text-slate-400 line-through">{formatCurrency(listPrice)}</p>
              <p className="text-3xl font-black text-brand-800">{formatCurrency(monthlyPrice)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              '30-day free trial for new colleges',
              'Auto-pay authorization before trial starts',
              'Cancel anytime from billing',
              'Sales follow-up on cancellation'
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <FiShield className="text-emerald-600" size={18} />
                <span className="text-sm font-bold text-slate-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Checkout Summary</p>
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold uppercase outline-none focus:border-brand-300"
            />
            {quote ? (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(quote.subtotal, quote.currency)}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{formatCurrency(quote.discountAmount, quote.currency)}</span></div>
                <div className="flex justify-between"><span>GST</span><span>{formatCurrency(quote.gstAmount, quote.currency)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-navy">
                  <span>Total</span><span>{formatCurrency(quote.totalAmount, quote.currency)}</span>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={actionLoading || usableSubscription || loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-black text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLoading ? <FiRefreshCw size={16} className="animate-spin" /> : <FiCreditCard size={16} />}
            {usableSubscription ? 'Campus Connect Active' : `Enable Auto-pay + Start ${TRIAL_DAYS.campus_connect}-Day Trial`}
          </button>
        </section>

        <section className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Current Subscription</p>
          {loading ? (
            <div className="mt-5 h-40 animate-pulse rounded-2xl bg-slate-100" />
          ) : currentSubscription ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-navy">{currentSubscription.role_plan_slug || 'Campus Connect'}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {isTrial ? `Trial until ${formatDate(currentSubscription.trial_ends_at || currentSubscription.ends_at)}` : `Valid until ${formatDate(currentSubscription.ends_at)}`}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusTone(currentSubscription.status)}`}>
                    {currentSubscription.status || 'unknown'}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Auto-pay</p>
                    <p className="mt-1 font-bold text-navy">
                      {currentSubscription.autopay_enabled ? currentSubscription.autopay_status || 'active' : 'not enabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Renewal</p>
                    <p className="mt-1 font-bold text-navy">{formatCurrency(monthlyPrice)}/month</p>
                  </div>
                </div>
              </div>

              {usableSubscription ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                >
                  {actionLoading ? <FiRefreshCw size={16} className="animate-spin" /> : <FiXCircle size={16} />}
                  Cancel Subscription
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <FiCreditCard className="mx-auto text-slate-300" size={34} />
              <p className="mt-3 text-lg font-black text-slate-600">No active subscription</p>
              <p className="mt-1 text-sm text-slate-500">Authorize auto-pay to start the free month.</p>
            </div>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-black text-navy">Billing History</h2>
          <p className="mt-1 text-sm text-slate-500">Subscription and checkout activity for this college.</p>
        </div>
        {latestRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm font-semibold text-slate-400">No billing history yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] divide-y divide-slate-100">
              <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {latestRows.map((row) => (
                  <tr key={`${row.type}-${row.id}`} className="text-sm">
                    <td className="px-5 py-4 font-bold text-navy">{row.type}</td>
                    <td className="px-5 py-4 text-slate-600">{row.label}</td>
                    <td className="px-5 py-4 font-bold text-slate-700">{formatCurrency(row.amount, row.currency)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${statusTone(row.status)}`}>
                        {row.status || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(row.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default CampusBillingPage;
