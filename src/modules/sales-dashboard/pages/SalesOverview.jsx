import { useEffect, useMemo, useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiClock, FiCreditCard, FiPhoneCall, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import DashboardFocusNav from '../../../shared/components/dashboard/DashboardFocusNav';
import DashboardPageHeader from '../../../shared/components/dashboard/DashboardPageHeader';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import DashboardSummaryStrip from '../../../shared/components/dashboard/DashboardSummaryStrip';
import useDashboardView from '../../../shared/hooks/useDashboardView';
import { formatDateTime } from '../../../shared/utils/dateTime';
import { getSalesOverview, getSalesReferralCode, getSalesRevenueAutomation } from '../services/salesApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const queueToneClass = {
  danger: 'text-red-700 bg-red-50 border-red-100',
  success: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  warning: 'text-amber-700 bg-amber-50 border-amber-100',
  default: 'text-slate-700 bg-slate-50 border-slate-100'
};

const SALES_DASHBOARD_VIEWS = ['priorities', 'automation', 'audience', 'payments', 'activity'];

const SalesOverview = () => {
  const [activeView, setActiveView] = useDashboardView(SALES_DASHBOARD_VIEWS, 'priorities');
  const [state, setState] = useState({ loading: true, error: '', overview: null });
  const [referral, setReferral] = useState({ salesCode: '', assignedStates: [], shareText: '' });
  const [automation, setAutomation] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [overviewRes, referralRes, automationRes] = await Promise.all([
        getSalesOverview(),
        getSalesReferralCode(),
        getSalesRevenueAutomation()
      ]);
      setState({
        loading: false,
        error: overviewRes.error || '',
        overview: overviewRes.data
      });
      setReferral(referralRes.data || { salesCode: '', assignedStates: [], shareText: '' });
      setAutomation(automationRes.data || null);
    };

    load();
  }, []);

  const stats = useMemo(() => state.overview?.stats || {}, [state.overview?.stats]);
  const paymentSummary = state.overview?.paymentSummary || {};
  const audienceBreakdown = state.overview?.audienceBreakdown || [];
  const workQueue = state.overview?.workQueue || [];
  const recentActivity = state.overview?.recentActivity || [];

  const paymentRows = [
    ['Paid payments', formatNumber(paymentSummary.paidPayments || stats.paidPayments), formatCompactCurrency(paymentSummary.totalRevenue || stats.totalRevenue)],
    ['This month', formatCompactCurrency(paymentSummary.monthlyRevenue || stats.monthlyRevenue), 'Collected'],
    ['Pending payments', formatNumber(paymentSummary.pendingPayments || stats.pendingPayments), formatCompactCurrency(paymentSummary.pendingValue || stats.pendingPaymentValue)],
    ['Refund exposure', formatNumber(paymentSummary.refunds || stats.refunds), formatCompactCurrency(paymentSummary.refundValue || stats.refundValue)],
    ['Average paid value', formatCompactCurrency(paymentSummary.averageOrderValue || stats.averageOrderValue), 'Per paid payment']
  ];

  const focusItems = [
    { key: 'priorities', label: 'Priorities', description: 'Work the follow-up and conversion queue in the recommended order.', count: workQueue.length, icon: FiClock },
    { key: 'automation', label: 'Revenue automation', description: 'Review forecasts, next-best actions, lead priority, and revenue risk.', count: automation?.automationActions?.length || 0, icon: FiCheckCircle },
    { key: 'audience', label: 'Audience', description: 'Compare plan conversion across commercial audience segments.', count: audienceBreakdown.length, icon: FiUsers },
    { key: 'payments', label: 'Payments', description: 'Review paid value, pending recovery, refunds, and average order value.', count: Number(paymentSummary.pendingPayments || stats.pendingPayments || 0), icon: FiCreditCard },
    { key: 'activity', label: 'Activity', description: 'Continue from the latest calls and payment events.', count: recentActivity.length, icon: FiPhoneCall }
  ];

  return (
    <div className="module-page module-page--platform">
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.loading ? <p className="module-note">Loading sales overview...</p> : null}

      {!state.loading && state.overview ? (
        <div className="space-y-3">
          <DashboardPageHeader
            eyebrow="Commercial operations"
            title="Sales workspace"
            description="Move from follow-up priorities to revenue recovery, conversion, and recent activity without mixing workflows."
            meta={referral.salesCode ? [
              { label: 'Sales code', value: referral.salesCode },
              { label: 'Assigned scope', value: (referral.assignedStates || []).join(', ') || 'All assigned states' }
            ] : []}
            actions={referral.salesCode ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigator.clipboard?.writeText(referral.shareText || referral.salesCode)}
                >
                  Copy code
                </button>
            ) : null}
          />

          <DashboardSummaryStrip
            items={[
              { label: 'Commercial users', value: formatNumber(stats.totalLeads), helper: `${formatNumber(stats.planPendingCustomers)} pending plans`, icon: FiUsers, to: '/portal/sales/leads' },
              { label: 'Plans taken', value: formatNumber(stats.convertedLeads), helper: `${stats.conversionRate || 0}% conversion`, icon: FiCheckCircle, to: '/portal/sales/customers' },
              { label: 'Follow-up due', value: formatNumber((stats.followupDueToday || 0) + (stats.overdueFollowups || 0)), helper: `${formatNumber(stats.overdueFollowups)} overdue`, icon: FiClock, to: '/portal/sales/leads' },
              { label: 'Collected revenue', value: formatCompactCurrency(stats.totalRevenue || 0), helper: `${formatNumber(stats.paidPayments)} paid payments`, icon: FiCreditCard, to: '/portal/sales/payments' }
            ]}
          />

          <DashboardFocusNav items={focusItems} activeKey={activeView} onChange={setActiveView} label="Sales dashboard workspaces" title="Sales view" />

          {activeView === 'automation' && automation ? (
            <DashboardSectionCard
              eyebrow="Revenue Automation"
              title="Next best actions for growth"
              subtitle={`${formatCompactCurrency(automation.summary?.forecastNext30 || 0)} forecast next 30 days · ${formatCompactCurrency(automation.summary?.pendingPaymentValue || 0)} pending recovery`}
            >
              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Forecast', formatCompactCurrency(automation.summary?.forecastNext30 || 0), 'Next 30 days'],
                    ['Open leads', formatNumber(automation.summary?.openLeads || 0), `${automation.summary?.conversionRate || 0}% conversion`],
                    ['Pending value', formatCompactCurrency(automation.summary?.pendingPaymentValue || 0), 'Recovery queue'],
                    ['Active subs', formatNumber(automation.summary?.activeSubscriptions || 0), 'Renewal base']
                  ].map(([label, value, helper]) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
                      <p className="mt-1 text-xl font-black text-navy">{value}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {(automation.automationActions || []).slice(0, 3).map((action) => (
                    <div key={action.title} className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-emerald-950">{action.title}</p>
                          <p className="mt-1 text-xs font-semibold text-emerald-700">{action.impact}</p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                          {action.channel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-100 bg-white p-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Priority Leads</p>
                  {(automation.priorityLeads || []).slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between gap-3 border-t border-slate-100 py-2 first:border-t-0">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-navy">{lead.companyName || lead.contactName || 'Lead'}</span>
                        <span className="block truncate text-xs font-semibold text-slate-500">{lead.reason}</span>
                      </span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">{lead.priorityScore}%</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-slate-100 bg-white p-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Revenue Risks</p>
                  {(automation.revenueRisks || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No major revenue risk detected from current signals.</p>
                  ) : automation.revenueRisks.slice(0, 4).map((risk) => (
                    <p key={risk} className="border-t border-slate-100 py-2 text-sm leading-5 text-slate-600 first:border-t-0">{risk}</p>
                  ))}
                </div>
              </div>
            </DashboardSectionCard>
          ) : null}

          {activeView === 'priorities' ? (
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
          ) : null}

          {activeView === 'audience' ? (
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
          ) : null}

          {activeView === 'payments' ? (
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
          ) : null}

          {activeView === 'activity' ? (
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default SalesOverview;
