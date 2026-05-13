import { FiCheck, FiCheckCircle, FiCreditCard, FiGift, FiLock, FiX } from 'react-icons/fi';
import { getPlanBySlug, formatPrice, formatTrialLabel, TRIAL_DAYS } from '../constants/planConfig';

const formatPlanLabel = (value = '') => String(value || '').replace(/[_-]+/g, ' ').trim() || 'No active plan';

const PlanUpgradeModal = ({
  open,
  title = 'Upgrade your plan',
  subtitle = 'Choose a plan to unlock this feature.',
  featureName = 'Premium feature',
  plans = [],
  currentPlan = null,
  selectedPlanSlug = '',
  couponCode = '',
  quote = null,
  loading = false,
  message = '',
  audienceRole = 'student',
  onClose,
  onSelectPlan,
  onCouponChange,
  onCheckout
}) => {
  if (!open) return null;

  const activePlanSlug = currentPlan?.role_plan_slug || '';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] border border-white/70 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-700">
              <FiLock size={13} /> Plan upgrade
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-navy">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
            {formatTrialLabel(audienceRole) && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                <FiGift size={11} />
                {formatTrialLabel(audienceRole)} — start risk-free!
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">
            <FiX size={18} />
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-bold text-amber-900">{featureName}</p>
              <p className="mt-1 text-xs font-semibold text-amber-700">Current plan: {formatPlanLabel(activePlanSlug)}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => {
                const selected = selectedPlanSlug === plan.slug;
                return (
                  <button
                    type="button"
                    key={plan.slug}
                    onClick={() => onSelectPlan?.(plan.slug)}
                    className={`rounded-[1rem] border p-4 text-left transition ${selected ? 'border-brand-500 bg-brand-50 shadow-[0_12px_28px_rgba(45,91,255,0.12)]' : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-navy">{plan.name || formatPlanLabel(plan.slug)}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{plan.description || 'Professional access plan'}</p>
                      </div>
                      {selected ? <FiCheckCircle className="shrink-0 text-brand-600" size={18} /> : null}
                    </div>
                    <div className="mt-3">
                      {(plan.price ?? 0) <= 0 ? (
                        <><span className="text-xl font-black text-emerald-600">Free</span><span className="ml-1 text-xs text-slate-500">for {TRIAL_DAYS[audienceRole] || 15} days</span></>
                      ) : (
                        <span className="text-xl font-black text-brand-700">{formatPrice(plan.price, plan.currency === 'USD' ? '$' : '₹')}</span>
                      )}
                    </div>
                    {(plan.price ?? 0) <= 0 && (plan.priceAfterTrial || getPlanBySlug(plan.slug)?.priceAfterTrial) > 0 && (
                      <p className="mt-0.5 text-[10px] text-slate-400">Then {formatPrice(plan.priceAfterTrial || getPlanBySlug(plan.slug)?.priceAfterTrial)}/month after trial</p>
                    )}
                    {Array.isArray(plan.features) && plan.features.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                            <FiCheck size={10} className="mt-0.5 shrink-0 text-emerald-500" /><span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Checkout summary</p>
            <input
              value={couponCode}
              onChange={(event) => onCouponChange?.(event.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold uppercase outline-none focus:border-brand-400"
            />
            {quote ? (
              <div className="mt-4 space-y-2 rounded-xl border border-brand-100 bg-white p-3 text-sm text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{quote.currency} {quote.subtotal}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{quote.currency} {quote.discountAmount}</span></div>
                <div className="flex justify-between"><span>GST</span><span>{quote.currency} {quote.gstAmount}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-navy"><span>Total</span><span>{quote.currency} {quote.totalAmount}</span></div>
              </div>
            ) : null}
            {message ? <p className="mt-3 text-xs font-semibold leading-5 text-brand-700">{message}</p> : null}
            <button
              type="button"
              onClick={onCheckout}
              disabled={loading || !selectedPlanSlug}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCreditCard size={15} />
              {loading ? 'Processing...' : `Start ${TRIAL_DAYS[audienceRole] || 15}-day trial + enable auto-pay`}
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default PlanUpgradeModal;
