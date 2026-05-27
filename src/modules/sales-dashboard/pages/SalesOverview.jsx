import { useEffect, useMemo, useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiClock, FiCreditCard, FiPhoneCall, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import { getSalesOverview, getSalesReferralCode } from '../services/salesApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const queueToneClass = {
  danger: 'text-red-700 bg-red-50 border-red-100',
  success: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  warning: 'text-amber-700 bg-amber-50 border-amber-100',
  default: 'text-slate-700 bg-slate-50 border-slate-100'
};

const SalesOverview = () => {
  const [state, setState] = useState({ loading: true, error: '', overview: null });
  const [referral, setReferral] = useState({ salesCode: '', assignedStates: [], shareText: '' });

  useEffect(() => {
    const load = async () => {
      const [overviewRes, referralRes] = await Promise.all([
        getSalesOverview(),
        getSalesReferralCode()
      ]);
      setState({
        loading: false,
        error: overviewRes.error || '',
        overview: overviewRes.data
      });
      setReferral(referralRes.data || { salesCode: '', assignedStates: [], shareText: '' });
    };

    load();
  }, []);

  const stats = useMemo(() => state.overview?.stats || {}, [state.overview?.stats]);
  const paymentSummary = state.overview?.paymentSummary || {};
  const audienceBreakdown = state.overview?.audienceBreakdown || [];
  const workQueue = state.overview?.workQueue || [];
  const recentActivity = state.overview?.recentActivity || [];

  const cards = useMemo(() => [
    {
      label: 'Commercial Users',
      value: formatNumber(stats.totalLeads),
      helper: `${formatNumber(stats.planPendingCustomers)} pending plans`,
      tone: 'info',
      icon: FiUsers,
      to: '/portal/sales/leads',
      ctaLabel: 'Open leads'
    },
    {
      label: 'Plan Taken',
      value: formatNumber(stats.convertedLeads),
      helper: `${stats.conversionRate || 0}% conversion`,
      tone: 'success',
      icon: FiCheckCircle,
      to: '/portal/sales/customers',
      ctaLabel: 'Open customers'
    },
    {
      label: 'Follow-Up Due',
      value: formatNumber((stats.followupDueToday || 0) + (stats.overdueFollowups || 0)),
      helper: `${formatNumber(stats.overdueFollowups)} overdue`,
      tone: stats.overdueFollowups > 0 ? 'danger' : 'warning',
      icon: FiClock,
      to: '/portal/sales/leads',
      ctaLabel: 'Open queue'
    },
    {
      label: 'Collected Revenue',
      value: formatCompactCurrency(stats.totalRevenue || 0),
      helper: `${formatNumber(stats.paidPayments)} paid payments`,
      tone: 'default',
      icon: FiCreditCard,
      to: '/portal/sales/payments',
      ctaLabel: 'Open payments'
    }
  ], [stats]);

  const paymentRows = [
    ['Paid payments', formatNumber(paymentSummary.paidPayments || stats.paidPayments), formatCompactCurrency(paymentSummary.totalRevenue || stats.totalRevenue)],
    ['This month', formatCompactCurrency(paymentSummary.monthlyRevenue || stats.monthlyRevenue), 'Collected'],
    ['Pending payments', formatNumber(paymentSummary.pendingPayments || stats.pendingPayments), formatCompactCurrency(paymentSummary.pendingValue || stats.pendingPaymentValue)],
    ['Refund exposure', formatNumber(paymentSummary.refunds || stats.refunds), formatCompactCurrency(paymentSummary.refundValue || stats.refundValue)],
    ['Average paid value', formatCompactCurrency(paymentSummary.averageOrderValue || stats.averageOrderValue), 'Per paid payment']
  ];

  return (
    <div className="module-page module-page--platform">
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.loading ? <p className="module-note">Loading sales overview...</p> : null}

      {!state.loading && state.overview ? (
        <div className="space-y-3">
          {referral.salesCode ? (
            <section className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-600">Your sales code</p>
                  <p className="mt-1 font-mono text-xl font-black text-navy">{referral.salesCode}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {(referral.assignedStates || []).length ? `State scope: ${referral.assignedStates.join(', ')}` : 'Use this code for HR, campus, or student registrations.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigator.clipboard?.writeText(referral.shareText || referral.salesCode)}
                >
                  Copy Code
                </button>
              </div>
            </section>
          ) : null}

          <DashboardMetricCards cards={cards} />

          <DashboardSectionCard
            eyebrow="Work Queue"
            title="Sales operating priorities"
            subtitle={`${formatNumber(stats.contactedLeads)} contacted · ${formatNumber(stats.untouchedLeads)} not contacted · ${formatNumber(stats.upcomingFollowups)} upcoming follow-ups`}
          >
            <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100">
              {workQueue.map((item) => {
                const toneClass = queueToneClass[item.tone] || queueToneClass.default;
                return (
                  <Link
                    key={item.key || item.label}
                    to={item.path || '/portal/sales/leads'}
                    className="flex min-h-[68px] items-center justify-between gap-4 bg-white px-4 py-3 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-navy">{item.label}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-500">{item.helper}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className={`min-w-[72px] rounded-full border px-3 py-1 text-center text-sm font-black ${toneClass}`}>
                        {formatNumber(item.value)}
                      </span>
                      <FiArrowRight className="h-4 w-4 text-slate-400" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </DashboardSectionCard>

          <div className="split-grid">
            <DashboardSectionCard eyebrow="Audience" title="Plan coverage by audience">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    <tr>
                      <th className="py-2 pr-3">Audience</th>
                      <th className="py-2 pr-3">Users</th>
                      <th className="py-2 pr-3">Plan Taken</th>
                      <th className="py-2 pr-3">Pending</th>
                      <th className="py-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {audienceBreakdown.map((row) => (
                      <tr key={row.role || row.label}>
                        <td className="py-3 pr-3 font-bold text-navy">{row.label}</td>
                        <td className="py-3 pr-3 text-slate-600">{formatNumber(row.total)}</td>
                        <td className="py-3 pr-3 text-emerald-700">{formatNumber(row.planTaken)}</td>
                        <td className="py-3 pr-3 text-amber-700">{formatNumber(row.planPending)}</td>
                        <td className="py-3 font-bold text-slate-700">{row.conversionRate || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardSectionCard>

            <DashboardSectionCard eyebrow="Payments" title="Payment health">
              <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100">
                {paymentRows.map(([label, value, helper]) => (
                  <div key={label} className="flex min-h-[58px] items-center justify-between gap-4 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-navy">{label}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-500">{helper}</span>
                    </span>
                    <span className="shrink-0 text-right font-heading text-lg font-black text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </DashboardSectionCard>
          </div>

          <DashboardSectionCard eyebrow="Activity" title="Recent real sales activity">
            {recentActivity.length === 0 ? (
              <p className="module-note">No sales activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100">
                {recentActivity.map((item) => (
                  <div key={`${item.type}-${item.id}-${item.timestamp}`} className="flex min-h-[64px] items-center justify-between gap-4 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        {item.type === 'call' ? <FiPhoneCall className="h-4 w-4" /> : <FiCreditCard className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-navy">{item.label}</span>
                        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{item.detail}</span>
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      {item.amount !== undefined ? (
                        <p className="text-sm font-black text-emerald-700">{formatCompactCurrency(item.amount)}</p>
                      ) : null}
                      <p className="text-xs font-semibold text-slate-500">{formatDateTime(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSectionCard>
        </div>
      ) : null}
    </div>
  );
};

export default SalesOverview;
