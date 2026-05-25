import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import { getCurrentUser } from '../../../utils/auth';
import CouponTable from '../components/CouponTable';
import SalesStatCards from '../components/SalesStatCards';
import { createCouponRequest, getCouponRequests, getCoupons, validateCoupon } from '../services/couponApi';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const Coupons = () => {
  const currentUser = getCurrentUser();
  const isAdmin = ['admin', 'super_admin'].includes(String(currentUser?.role || '').toLowerCase());
  const [coupons, setCoupons] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState(null);
  const [validateDraft, setValidateDraft] = useState({ code: '', audienceRole: 'hr', planSlug: '', amount: '' });
  const [requestDraft, setRequestDraft] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    audienceRole: 'hr',
    planSlug: '',
    expectedValue: '',
    requestedDiscount: '',
    reason: ''
  });

  useEffect(() => {
    const load = async () => {
      const [couponResponse, requestResponse] = await Promise.all([getCoupons(), getCouponRequests()]);
      setCoupons(couponResponse.data || []);
      setRequests(requestResponse.data || []);
      setError(couponResponse.error || requestResponse.error || '');
      setLoading(false);
    };
    load();
  }, []);

  const cards = useMemo(() => [
    { label: 'Coupons', value: String(coupons.length), helper: 'Discount offers in catalog', tone: 'info' },
    { label: 'Active', value: String(coupons.filter((item) => item.status === 'active').length), helper: 'Available for checkout', tone: 'success' },
    { label: 'Expired', value: String(coupons.filter((item) => item.status === 'expired').length), helper: 'Inactive offer codes', tone: 'danger' },
    { label: 'Usage', value: String(coupons.reduce((sum, item) => sum + Number(item.usageCount || 0), 0)), helper: 'Visible redemption volume', tone: 'warning' }
  ], [coupons]);

  const handleValidate = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setValidation(null);
    try {
      const result = await validateCoupon({
        code: validateDraft.code,
        audienceRole: validateDraft.audienceRole,
        planSlug: validateDraft.planSlug,
        amount: validateDraft.amount
      });
      setValidation(result);
    } catch (validateError) {
      setError(String(validateError.message || 'Unable to validate coupon.'));
    }
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const created = await createCouponRequest({
        client_name: requestDraft.clientName,
        client_email: requestDraft.clientEmail,
        client_phone: requestDraft.clientPhone,
        audience_role: requestDraft.audienceRole,
        plan_slug: requestDraft.planSlug,
        expected_value: requestDraft.expectedValue,
        requested_discount: requestDraft.requestedDiscount,
        reason: requestDraft.reason
      });
      setRequests((current) => [created, ...current]);
      setRequestDraft({ clientName: '', clientEmail: '', clientPhone: '', audienceRole: 'hr', planSlug: '', expectedValue: '', requestedDiscount: '', reason: '' });
      setMessage('Coupon request sent to admin.');
    } catch (requestError) {
      setError(String(requestError.message || 'Unable to send coupon request.'));
    }
  };

  const requestColumns = [
    { key: 'clientName', label: 'Client' },
    { key: 'audienceRole', label: 'Audience' },
    { key: 'planSlug', label: 'Plan' },
    { key: 'expectedValue', label: 'Value', render: (value) => formatCurrency(value) },
    { key: 'requestedDiscount', label: 'Requested' },
    { key: 'requestedBy', label: 'Sales', render: (value) => (isAdmin ? value : '-') },
    { key: 'status', label: 'Status', render: (value) => <StatusPill value={value || 'pending'} /> },
    { key: 'couponCode', label: 'Coupon', render: (value) => value || '-' },
    { key: 'createdAt', label: 'Created', render: (value) => formatDateTime(value) }
  ];

  return (
    <div className="module-page module-page--platform">
      <SectionHeader eyebrow="Sales" title="Coupons" subtitle="Check available offer codes, validate client eligibility, and request custom onboarding coupons from admin." />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="module-note">{message}</p> : null}
      <SalesStatCards cards={cards} />
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel-card">
          <h2 className="admin-ops-panel-title">Validate client coupon</h2>
          <form onSubmit={handleValidate} className="mt-4 grid gap-3 md:grid-cols-2">
            <input value={validateDraft.code} onChange={(event) => setValidateDraft((current) => ({ ...current, code: event.target.value }))} placeholder="Coupon code" className="rounded-xl border border-slate-200 px-3 py-2" />
            <select value={validateDraft.audienceRole} onChange={(event) => setValidateDraft((current) => ({ ...current, audienceRole: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
              <option value="hr">HR</option>
              <option value="campus_connect">Campus</option>
              <option value="student">Student</option>
            </select>
            <input value={validateDraft.planSlug} onChange={(event) => setValidateDraft((current) => ({ ...current, planSlug: event.target.value }))} placeholder="Plan slug" className="rounded-xl border border-slate-200 px-3 py-2" />
            <input value={validateDraft.amount} onChange={(event) => setValidateDraft((current) => ({ ...current, amount: event.target.value }))} placeholder="Client amount" type="number" className="rounded-xl border border-slate-200 px-3 py-2" />
            <button type="submit" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500 md:col-span-2">Validate Coupon</button>
          </form>
          {validation ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              <StatusPill value={validation.valid ? 'active' : 'warning'} /> <span className="ml-2">{validation.valid ? 'Coupon valid for this client.' : (validation.issues || []).join(' ')}</span>
            </div>
          ) : null}
        </section>
        <section className="panel-card">
          <h2 className="admin-ops-panel-title">Request onboarding coupon</h2>
          <form onSubmit={handleRequest} className="mt-4 grid gap-3 md:grid-cols-2">
            <input required value={requestDraft.clientName} onChange={(event) => setRequestDraft((current) => ({ ...current, clientName: event.target.value }))} placeholder="Client name" className="rounded-xl border border-slate-200 px-3 py-2" />
            <input value={requestDraft.clientEmail} onChange={(event) => setRequestDraft((current) => ({ ...current, clientEmail: event.target.value }))} placeholder="Client email" className="rounded-xl border border-slate-200 px-3 py-2" />
            <input value={requestDraft.clientPhone} onChange={(event) => setRequestDraft((current) => ({ ...current, clientPhone: event.target.value }))} placeholder="Client phone" className="rounded-xl border border-slate-200 px-3 py-2" />
            <select value={requestDraft.audienceRole} onChange={(event) => setRequestDraft((current) => ({ ...current, audienceRole: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
              <option value="hr">HR</option>
              <option value="campus_connect">Campus</option>
              <option value="student">Student</option>
            </select>
            <input value={requestDraft.planSlug} onChange={(event) => setRequestDraft((current) => ({ ...current, planSlug: event.target.value }))} placeholder="Plan slug" className="rounded-xl border border-slate-200 px-3 py-2" />
            <input value={requestDraft.expectedValue} onChange={(event) => setRequestDraft((current) => ({ ...current, expectedValue: event.target.value }))} placeholder="Expected value" type="number" className="rounded-xl border border-slate-200 px-3 py-2" />
            <input value={requestDraft.requestedDiscount} onChange={(event) => setRequestDraft((current) => ({ ...current, requestedDiscount: event.target.value }))} placeholder="Requested discount" className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" />
            <textarea value={requestDraft.reason} onChange={(event) => setRequestDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Client context" rows={3} className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" />
            <button type="submit" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500 md:col-span-2">Send Request</button>
          </form>
        </section>
      </div>
      <section className="panel-card">
        {loading ? <p className="module-note">Loading coupons...</p> : null}
        <CouponTable rows={coupons} />
      </section>
      <section className="panel-card">
        <h2 className="admin-ops-panel-title">Coupon requests</h2>
        <DataTable columns={requestColumns} rows={requests} pagination itemsPerPage={10} />
      </section>
    </div>
  );
};

export default Coupons;
