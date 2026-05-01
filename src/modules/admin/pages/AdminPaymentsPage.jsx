import { useEffect, useMemo, useState } from 'react';
import { 
  FiDollarSign, 
  FiSearch, 
  FiCreditCard, 
  FiTrendingUp, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiXCircle, 
  FiEdit3, 
  FiRefreshCcw,
  FiChevronDown,
  FiBriefcase,
  FiX
} from 'react-icons/fi';
import {
  createAdminSalesCoupon,
  formatDateTime,
  getAdminPayments,
  getAdminPlanPurchases,
  getAdminRolePlanPurchases,
  getAdminRolePricingPlans,
  getAdminSalesCoupons,
  updateAdminPayment,
  updateAdminPlanPurchaseStatus,
  updateAdminRolePlanPurchaseStatus,
  updateAdminRolePricingPlan
} from '../services/adminApi';

const initialFilters = {
  status: 'all',
  search: ''
};

const emptyDraft = {
  status: 'pending',
  provider: '',
  referenceId: '',
  note: ''
};

const emptyCouponDraft = {
  code: '',
  discount_type: 'percent',
  discount_value: '',
  max_uses: '',
  valid_until: '',
  audience_roles: 'hr',
  plan_slugs: ''
};

const statusToApi = (status) => (status === 'all' ? '' : status);

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'paid': 
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending': 
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'failed': 
    case 'refunded':
      return 'bg-red-100 text-red-700 border-red-200';
    default: 
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [planPurchases, setPlanPurchases] = useState([]);
  const [commercialPurchases, setCommercialPurchases] = useState([]);
  const [rolePlans, setRolePlans] = useState([]);
  const [rolePlanDrafts, setRolePlanDrafts] = useState({});
  const [coupons, setCoupons] = useState([]);
  const [couponDraft, setCouponDraft] = useState(emptyCouponDraft);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingCommercial, setLoadingCommercial] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPlanSlug, setSavingPlanSlug] = useState('');
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState('');
  const [draft, setDraft] = useState(emptyDraft);

  const loadPayments = async (nextStatus = filters.status) => {
    setLoading(true);
    setError('');
    const response = await getAdminPayments(statusToApi(nextStatus));
    setPayments(response.data || []);
    setError(response.error || '');
    setLoading(false);
  };

  const loadPlanPurchases = async (nextStatus = filters.status) => {
    setLoadingPurchases(true);
    const response = await getAdminPlanPurchases({ status: statusToApi(nextStatus) });
    setPlanPurchases(response.data || []);
    if (response.error) setError((current) => current || response.error);
    setLoadingPurchases(false);
  };

  const loadCommercialState = async (nextStatus = filters.status) => {
    setLoadingCommercial(true);
    const [purchasesRes, plansRes, couponsRes] = await Promise.all([
      getAdminRolePlanPurchases({ status: statusToApi(nextStatus) }),
      getAdminRolePricingPlans(),
      getAdminSalesCoupons()
    ]);

    const nextPlans = plansRes.data || [];
    setCommercialPurchases(purchasesRes.data || []);
    setRolePlans(nextPlans);
    setCoupons(couponsRes.data || []);
    setRolePlanDrafts(Object.fromEntries(nextPlans.map((plan) => [plan.slug, {
      price: String(plan.price ?? ''),
      durationDays: String(plan.durationDays ?? ''),
      includedJobCredits: String(plan.includedJobCredits ?? ''),
      trialDays: String(plan.trialDays ?? ''),
      sortOrder: String(plan.sortOrder ?? ''),
      isActive: Boolean(plan.isActive),
      isFeatured: Boolean(plan.isFeatured)
    }])));

    const combinedError = [purchasesRes.error, plansRes.error, couponsRes.error].filter(Boolean).join(' | ');
    if (combinedError) setError((current) => current || combinedError);
    setLoadingCommercial(false);
  };

  useEffect(() => {
    loadPayments(initialFilters.status);
    loadPlanPurchases(initialFilters.status);
    loadCommercialState(initialFilters.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPayments = useMemo(() => {
    const search = String(filters.search || '').toLowerCase().trim();
    if (!search) return payments;

    return payments.filter((payment) =>
      `${payment.job_id || ''} ${payment.hr_id || ''} ${payment.reference_id || ''}`.toLowerCase().includes(search)
    );
  }, [payments, filters.search]);

  const stats = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === 'paid');
    const pending = payments.filter((payment) => payment.status === 'pending');
    const failed = payments.filter((payment) => payment.status === 'failed');
    const refunded = payments.filter((payment) => payment.status === 'refunded');
    const paidTotal = paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const pendingPurchases = planPurchases.filter((purchase) => purchase.status === 'pending').length;
    const paidPurchases = planPurchases.filter((purchase) => purchase.status === 'paid');
    const paidPurchaseAmount = paidPurchases.reduce((sum, purchase) => sum + Number(purchase.total_amount || 0), 0);

    return [
      {
        label: 'Gross Platform Revenue',
        value: `$${paidPurchaseAmount.toFixed(0)}`,
        helper: 'From verified plan purchases',
        icon: <FiTrendingUp className="text-emerald-500" />,
        bg: 'bg-emerald-50'
      },
      {
        label: 'Pending Reconciliations',
        value: String(pending.length + pendingPurchases),
        helper: 'Awaiting finance confirmation',
        icon: <FiAlertCircle className={pending.length + pendingPurchases > 0 ? "text-amber-500" : "text-emerald-500"} />,
        bg: pending.length + pendingPurchases > 0 ? 'bg-amber-50' : 'bg-emerald-50'
      },
      {
        label: 'Enterprise Plan Subscriptions',
        value: String(planPurchases.length),
        helper: `${paidPurchases.length} active • ${pendingPurchases} pending`,
        icon: <FiBriefcase className="text-blue-500" />,
        bg: 'bg-blue-50'
      },
      {
        label: 'Failed / Refunded',
        value: String(failed.length + refunded.length),
        helper: `${failed.length} failed • ${refunded.length} refunded`,
        icon: <FiRefreshCcw className="text-red-500" />,
        bg: 'bg-red-50'
      }
    ];
  }, [payments, planPurchases]);

  const openEdit = (payment) => {
    setEditPaymentId(payment.id);
    setDraft({
      status: payment.status || 'pending',
      provider: payment.provider || '',
      referenceId: payment.reference_id || '',
      note: payment.note || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeEdit = () => {
    setEditPaymentId('');
    setDraft(emptyDraft);
  };

  const patchLocalPayment = (paymentId, patch) => {
    setPayments((current) => current.map((payment) => (payment.id === paymentId ? { ...payment, ...patch } : payment)));
  };

  const handleSavePayment = async (event) => {
    event.preventDefault();
    if (!editPaymentId) return;

    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      status: draft.status,
      provider: draft.provider,
      referenceId: draft.referenceId,
      note: draft.note
    };

    try {
      const updated = await updateAdminPayment(editPaymentId, payload);
      patchLocalPayment(editPaymentId, updated);
      setMessage(`Ledger transaction ${editPaymentId.slice(-6).toUpperCase()} updated.`);
      setTimeout(() => setMessage(''), 3000);
      closeEdit();
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to update payment ledger.'));
    } finally {
      setSaving(false);
    }
  };

  const patchLocalPlanPurchase = (purchaseId, patch) => {
    setPlanPurchases((current) => current.map((purchase) => (purchase.id === purchaseId ? { ...purchase, ...patch } : purchase)));
  };

  const handleUpdatePurchaseStatus = async (purchaseId, status) => {
    setError('');
    setMessage('');

    try {
      const updated = await updateAdminPlanPurchaseStatus(purchaseId, { status });
      patchLocalPlanPurchase(purchaseId, updated);
      setMessage(`Plan invoice ${purchaseId.slice(-6).toUpperCase()} marked as ${status}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to reconcile plan purchase.'));
    }
  };

  const patchLocalCommercialPurchase = (purchaseId, patch) => {
    setCommercialPurchases((current) => current.map((purchase) => (purchase.id === purchaseId ? { ...purchase, ...patch } : purchase)));
  };

  const handleUpdateCommercialPurchaseStatus = async (purchaseId, status) => {
    setError('');
    setMessage('');

    try {
      const updated = await updateAdminRolePlanPurchaseStatus(purchaseId, { status });
      patchLocalCommercialPurchase(purchaseId, updated);
      setMessage(`Commercial purchase ${purchaseId.slice(-6).toUpperCase()} marked as ${status}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to reconcile commercial purchase.'));
    }
  };

  const handleRolePlanDraftChange = (planSlug, key, value) => {
    setRolePlanDrafts((current) => ({
      ...current,
      [planSlug]: {
        ...(current[planSlug] || {}),
        [key]: value
      }
    }));
  };

  const handleSaveRolePlan = async (planSlug) => {
    setSavingPlanSlug(planSlug);
    setError('');
    setMessage('');

    try {
      const draftValues = rolePlanDrafts[planSlug] || {};
      const updated = await updateAdminRolePricingPlan(planSlug, {
        price: Number(draftValues.price || 0),
        durationDays: Number(draftValues.durationDays || 30),
        includedJobCredits: Number(draftValues.includedJobCredits || 0),
        trialDays: Number(draftValues.trialDays || 0),
        sortOrder: Number(draftValues.sortOrder || 100),
        isActive: Boolean(draftValues.isActive),
        isFeatured: Boolean(draftValues.isFeatured)
      });

      setRolePlans((current) => current.map((plan) => (plan.slug === planSlug ? updated : plan)));
      setMessage(`Commercial plan ${updated.name} updated.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to update role plan.'));
    } finally {
      setSavingPlanSlug('');
    }
  };

  const handleCreateCoupon = async (event) => {
    event.preventDefault();
    setSavingCoupon(true);
    setError('');
    setMessage('');

    try {
      const created = await createAdminSalesCoupon({
        code: couponDraft.code,
        discount_type: couponDraft.discount_type,
        discount_value: Number(couponDraft.discount_value || 0),
        max_uses: couponDraft.max_uses ? Number(couponDraft.max_uses) : null,
        valid_until: couponDraft.valid_until || null,
        audience_roles: couponDraft.audience_roles.split(',').map((item) => item.trim()).filter(Boolean),
        plan_slugs: couponDraft.plan_slugs.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
      });

      setCoupons((current) => [created, ...current]);
      setCouponDraft(emptyCouponDraft);
      setMessage(`Coupon ${created.code} created.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to create coupon.'));
    } finally {
      setSavingCoupon(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 relative">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-primary tracking-tight mb-2 flex items-center gap-3">
            Financial Ledger
          </h1>
          <p className="text-neutral-500 text-lg">Verify incoming HR payments, reconcile subscription purchases, and issue refunds.</p>
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

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((card) => (
          <article key={card.label} className="bg-white rounded-[2rem] p-6 border border-neutral-100 shadow-sm flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-2xl font-black text-primary mb-1">{card.value}</h3>
              <p className="text-sm font-bold text-neutral-600 mb-0.5">{card.label}</p>
              <p className="text-xs font-medium text-neutral-400">{card.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-primary">Commercial Role Plans</h2>
              <p className="text-sm text-neutral-500 mt-1">Control HR, Campus Connect, and Student subscriptions from one place.</p>
            </div>
            {loadingCommercial ? <span className="text-sm text-neutral-500">Loading...</span> : null}
          </div>
          <div className="space-y-4">
            {rolePlans.map((plan) => {
              const draftValues = rolePlanDrafts[plan.slug] || {};
              return (
                <div key={plan.slug} className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-lg font-black text-primary">{plan.name}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{plan.audienceRole}</p>
                    </div>
                    <button onClick={() => handleSaveRolePlan(plan.slug)} disabled={savingPlanSlug === plan.slug} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-500 disabled:opacity-50">
                      {savingPlanSlug === plan.slug ? 'Saving...' : 'Save Plan'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <label className="space-y-1">
                      <span className="block text-xs font-bold uppercase tracking-wide text-neutral-500">Price</span>
                      <input value={draftValues.price || ''} onChange={(e) => handleRolePlanDraftChange(plan.slug, 'price', e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-semibold" />
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-bold uppercase tracking-wide text-neutral-500">Duration</span>
                      <input value={draftValues.durationDays || ''} onChange={(e) => handleRolePlanDraftChange(plan.slug, 'durationDays', e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-semibold" />
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-bold uppercase tracking-wide text-neutral-500">Included Credits</span>
                      <input value={draftValues.includedJobCredits || ''} onChange={(e) => handleRolePlanDraftChange(plan.slug, 'includedJobCredits', e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-semibold" />
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-bold uppercase tracking-wide text-neutral-500">Trial Days</span>
                      <input value={draftValues.trialDays || ''} onChange={(e) => handleRolePlanDraftChange(plan.slug, 'trialDays', e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-semibold" />
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-bold uppercase tracking-wide text-neutral-500">Sort</span>
                      <input value={draftValues.sortOrder || ''} onChange={(e) => handleRolePlanDraftChange(plan.slug, 'sortOrder', e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-semibold" />
                    </label>
                    <div className="flex items-center gap-4 pt-6">
                      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                        <input type="checkbox" checked={Boolean(draftValues.isActive)} onChange={(e) => handleRolePlanDraftChange(plan.slug, 'isActive', e.target.checked)} />
                        Active
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                        <input type="checkbox" checked={Boolean(draftValues.isFeatured)} onChange={(e) => handleRolePlanDraftChange(plan.slug, 'isFeatured', e.target.checked)} />
                        Featured
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm p-6">
          <h2 className="text-xl font-extrabold text-primary">Coupon Control</h2>
          <p className="text-sm text-neutral-500 mt-1 mb-5">Admin creates role-based coupons that sales can later share during follow-up.</p>
          <form onSubmit={handleCreateCoupon} className="space-y-3">
            <input value={couponDraft.code} onChange={(e) => setCouponDraft((current) => ({ ...current, code: e.target.value.toUpperCase() }))} placeholder="Coupon code" className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-semibold uppercase" />
            <div className="grid grid-cols-2 gap-3">
              <select value={couponDraft.discount_type} onChange={(e) => setCouponDraft((current) => ({ ...current, discount_type: e.target.value }))} className="rounded-xl border border-neutral-200 px-3 py-2 font-semibold">
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
              <input value={couponDraft.discount_value} onChange={(e) => setCouponDraft((current) => ({ ...current, discount_value: e.target.value }))} placeholder="Discount value" className="rounded-xl border border-neutral-200 px-3 py-2 font-semibold" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={couponDraft.max_uses} onChange={(e) => setCouponDraft((current) => ({ ...current, max_uses: e.target.value }))} placeholder="Max uses" className="rounded-xl border border-neutral-200 px-3 py-2 font-semibold" />
              <input type="datetime-local" value={couponDraft.valid_until} onChange={(e) => setCouponDraft((current) => ({ ...current, valid_until: e.target.value }))} className="rounded-xl border border-neutral-200 px-3 py-2 font-semibold" />
            </div>
            <input value={couponDraft.audience_roles} onChange={(e) => setCouponDraft((current) => ({ ...current, audience_roles: e.target.value }))} placeholder="Roles: hr,campus_connect,student" className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-semibold" />
            <input value={couponDraft.plan_slugs} onChange={(e) => setCouponDraft((current) => ({ ...current, plan_slugs: e.target.value }))} placeholder="Plan slugs: hr_growth,student_plus" className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-semibold" />
            <button type="submit" disabled={savingCoupon} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-50">
              {savingCoupon ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
          <div className="mt-5 space-y-3 max-h-[420px] overflow-auto">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-primary">{coupon.code}</p>
                    <p className="text-xs text-neutral-500">{coupon.discount_type} · {coupon.discount_value}{coupon.discount_type === 'percent' ? '%' : ''}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase ${coupon.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    {coupon.is_active ? 'active' : 'inactive'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Roles: {(coupon.audience_roles || []).join(', ') || 'all'} | Plans: {(coupon.plan_slugs || []).join(', ') || 'all'} | Used: {coupon.used_count || 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col min-h-[420px]">
        <div className="p-6 md:p-8 border-b border-neutral-100 bg-neutral-50/50">
          <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <FiBriefcase className="text-brand-500" /> Commercial Plan Purchases
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Review subscriptions bought by HR, Campus Connect, and Student accounts.</p>
        </div>
        <div className="flex-1 overflow-x-auto custom-scrollbar relative">
          {loadingCommercial ? (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            </div>
          ) : null}
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="p-4 pl-6 text-xs font-black text-neutral-400 uppercase tracking-widest">Purchase</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Audience</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Plan</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Amount</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Status</th>
                <th className="p-4 pr-6 text-xs font-black text-neutral-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {commercialPurchases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-neutral-500 font-medium">No commercial plan purchases yet.</td>
                </tr>
              ) : commercialPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 pl-6 align-top">
                    <div className="font-mono text-primary text-sm font-bold">{String(purchase.id).slice(-8).toUpperCase()}</div>
                    <div className="text-xs text-neutral-500 mt-1">{formatDateTime(purchase.created_at)}</div>
                  </td>
                  <td className="p-4 align-top font-semibold text-neutral-700 uppercase">{purchase.audience_role}</td>
                  <td className="p-4 align-top font-bold text-primary">{purchase.role_plan_slug}</td>
                  <td className="p-4 align-top font-bold text-emerald-600">{purchase.currency || 'INR'} {purchase.total_amount}</td>
                  <td className="p-4 align-top">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${purchase.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : purchase.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 align-top text-right">
                    {purchase.status === 'pending' ? (
                      <button onClick={() => handleUpdateCommercialPurchaseStatus(purchase.id, 'paid')} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white hover:bg-emerald-400">
                        Approve
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Payment Overlay */}
      {editPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-[50px] rounded-full pointer-events-none"></div>
             
             <button onClick={closeEdit} className="absolute top-6 right-6 p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-500 rounded-full transition-colors">
               <FiX size={20} />
             </button>
             
             <h2 className="text-2xl font-black text-primary mb-2 flex items-center gap-2">
               <FiEdit3 className="text-brand-500" /> Override Transaction
             </h2>
             <p className="text-sm font-medium text-neutral-500 mb-6 font-mono bg-neutral-50 p-2 rounded-lg border border-neutral-100 inline-block">ID: {editPaymentId}</p>

             <form onSubmit={handleSavePayment} className="space-y-4">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Ledger Status</label>
                  <div className="relative">
                    <select 
                      value={draft.status} 
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                      className="w-full pl-3 pr-8 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm appearance-none"
                    >
                      <option value="pending">Pending Verification</option>
                      <option value="paid">Confirmed Paid</option>
                      <option value="failed">Transaction Failed</option>
                      <option value="refunded">Issued Refund</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Gateway</label>
                    <input 
                      value={draft.provider} 
                      onChange={(e) => setDraft({ ...draft, provider: e.target.value })} 
                      placeholder="e.g. Stripe, Razorpay"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Ref ID</label>
                    <input 
                      value={draft.referenceId} 
                      onChange={(e) => setDraft({ ...draft, referenceId: e.target.value })} 
                      placeholder="TXN-..."
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col pt-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Internal Log Note</label>
                  <textarea 
                    rows={3} 
                    value={draft.note} 
                    onChange={(e) => setDraft({ ...draft, note: e.target.value })} 
                    placeholder="Rationale for manual override..."
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <button type="submit" disabled={saving} className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? 'Synchronizing...' : <><FiCheckCircle /> Confirm Ledger Update</>}
                  </button>
                  <button type="button" onClick={closeEdit} className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl transition-colors">
                    Discard
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Subscriptions / Plans Table */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-neutral-900 rounded-[2.5rem] border border-indigo-800 shadow-xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-6 md:p-8 border-b border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <FiCreditCard className="text-brand-400" /> B2B Subscription Underwriting
              </h2>
              <p className="text-indigo-200 text-sm mt-1">Approve recruiter plan purchases to activate ecosystem hiring credits.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar relative">
          {loadingPurchases ? (
             <div className="absolute inset-0 bg-indigo-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
               <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-brand-400 rounded-full animate-spin"></div>
             </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                <th className="p-4 pl-6 text-xs font-black text-indigo-300 uppercase tracking-widest">Invoice Code</th>
                <th className="p-4 text-xs font-black text-indigo-300 uppercase tracking-widest">Plan Config</th>
                <th className="p-4 text-xs font-black text-indigo-300 uppercase tracking-widest">Monetary Flow</th>
                <th className="p-4 text-xs font-black text-indigo-300 uppercase tracking-widest">Authorization</th>
                <th className="p-4 text-xs font-black text-indigo-300 uppercase tracking-widest text-right pr-6">Finance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {planPurchases.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-indigo-300 font-medium">
                    No plan purchases active in current reporting cycle.
                  </td>
                </tr>
              ) : (
                planPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 pl-6 align-top">
                      <div className="font-mono text-white text-sm font-bold bg-white/10 px-2 py-1 rounded inline-block mb-2 border border-white/10">
                        {String(purchase.id).slice(-8).toUpperCase()}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                        ORG-{String(purchase.hr_id).slice(-6).toUpperCase()}
                      </div>
                      <div className="text-[10px] font-medium text-indigo-500 mt-1">
                        {formatDateTime(purchase.created_at)}
                      </div>
                    </td>
                    
                    <td className="p-4 align-top">
                      <div className="font-extrabold text-brand-300 text-sm uppercase tracking-wide mb-1">
                        Tier: {purchase.plan_slug}
                      </div>
                      <div className="font-medium text-indigo-200 text-xs">
                        Qty: <span className="text-white font-bold">{purchase.quantity}</span> &times; Credits: <span className="text-white font-bold">{purchase.credits}</span>
                      </div>
                    </td>
                    
                    <td className="p-4 align-top">
                      <div className="font-black text-emerald-400 text-lg">
                        {purchase.currency || 'USD'} {purchase.total_amount}
                      </div>
                    </td>
                    
                    <td className="p-4 align-top">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest border inline-block ${
                         purchase.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                         purchase.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                         'bg-neutral-500/20 text-neutral-300 border-neutral-500/30'
                      }`}>
                        {purchase.status || 'pending'}
                      </span>
                    </td>
                    
                    <td className="p-4 pr-6 align-top text-right">
                       <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                         {purchase.status === 'pending' && (
                           <button 
                             onClick={() => handleUpdatePurchaseStatus(purchase.id, 'paid')}
                             className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-indigo-950 font-black text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5"
                           >
                             <FiCheckCircle /> Validate & Grant
                           </button>
                         )}
                         {purchase.status === 'paid' && (
                           <button 
                             onClick={() => handleUpdatePurchaseStatus(purchase.id, 'refunded')}
                             className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl border border-white/10 transition-colors flex items-center gap-1.5"
                           >
                             <FiRefreshCcw /> Process Refund
                           </button>
                         )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Individual Payments Table */}
      <section className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-6 md:p-8 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
                <FiDollarSign className="text-brand-500" /> Individual Job Payments
              </h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select 
                  value={filters.status} 
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setFilters({ ...filters, status: nextStatus });
                    loadPayments(nextStatus);
                    loadPlanPurchases(nextStatus);
                    loadCommercialState(nextStatus);
                  }}
                  className="pl-3 pr-8 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm text-neutral-700 appearance-none shadow-sm min-w-[160px]"
                >
                  <option value="all">All Transactions</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Cleared</option>
                  <option value="failed">Failed Drops</option>
                  <option value="refunded">Refunded</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:min-w-[250px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={filters.search}
                  placeholder="Search ledger by HR ID or TXN..."
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar relative">
          {loading ? (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
               <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
             </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[1000px]">
             <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="p-4 pl-6 text-xs font-black text-neutral-400 uppercase tracking-widest">Transaction Reference</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Entity Link</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Ledger Entry</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Gateway</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest text-right pr-6">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-neutral-500 font-medium">
                    No transactions match the current query window.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 pl-6 align-top">
                      <div className="font-mono text-primary text-sm font-bold bg-neutral-100 px-2 py-1 rounded inline-block mb-1 border border-neutral-200">
                        TXN-{String(payment.id).slice(-8).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border inline-block ${getStatusBadge(payment.status || 'pending')}`}>
                          {payment.status || 'pending'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-4 align-top">
                       <div className="text-xs font-bold text-neutral-600">
                         HR: <span className="font-mono text-neutral-800 bg-neutral-100 px-1 py-0.5 rounded ml-1">{payment.hr_id ? String(payment.hr_id).slice(-6).toUpperCase() : 'UNK'}</span>
                       </div>
                       <div className="text-xs font-bold text-neutral-600 mt-1">
                         JOB:<span className="font-mono text-brand-600 bg-brand-50 px-1 py-0.5 rounded ml-1 border border-brand-100">{payment.job_id ? String(payment.job_id).slice(-6).toUpperCase() : 'UNK'}</span>
                       </div>
                    </td>
                    
                    <td className="p-4 align-top">
                       <div className="font-black text-primary text-lg">
                         {payment.currency || 'USD'} {payment.amount}
                       </div>
                       <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide mt-1">
                         {formatDateTime(payment.paid_at || payment.created_at)}
                       </div>
                    </td>
                    
                    <td className="p-4 align-top max-w-xs">
                       <div className="font-bold text-neutral-800 text-sm mb-1 capitalize">
                         {payment.provider || 'System Manual'}
                       </div>
                       <div className="text-xs font-mono text-neutral-500 truncate" title={payment.reference_id}>
                         {payment.reference_id || 'No ref provided'}
                       </div>
                    </td>
                    
                    <td className="p-4 pr-6 align-top text-right">
                       <button 
                         onClick={() => openEdit(payment)}
                         className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs rounded-xl border border-neutral-200 transition-colors flex items-center justify-end gap-1.5 ml-auto shadow-sm"
                       >
                         <FiEdit3 /> View / Rec
                       </button>
                    </td>
                  </tr>
                ))
              )}
             </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default AdminPaymentsPage;
