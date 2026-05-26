import { useEffect, useMemo, useState } from 'react';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import RevenueChart from '../components/RevenueChart';
import SalesChart from '../components/SalesChart';
import { getSalesOverview, getSalesFunnel } from '../services/salesApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const SalesOverview = () => {
  const [state, setState] = useState({ loading: true, error: '', overview: null });
  const [funnel, setFunnel] = useState({ funnel: [], summary: { totalLeads: 0, convertedCount: 0, conversionRate: 0, totalRevenue: 0 } });
  const [funnelLoading, setFunnelLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [overviewRes, funnelRes] = await Promise.all([getSalesOverview(), getSalesFunnel()]);
      setState({
        loading: false,
        error: overviewRes.error || '',
        overview: overviewRes.data
      });
      setFunnel(funnelRes.data || { funnel: [], summary: { totalLeads: 0, convertedCount: 0, conversionRate: 0, totalRevenue: 0 } });
      setFunnelLoading(false);
    };

    load();
  }, []);

  const cards = useMemo(() => {
    const stats = state.overview?.stats || {};
    return [
      { label: 'Platform Accounts', value: String(stats.totalCustomers || 0), helper: 'HR, campus, and student users', tone: 'info' },
      { label: 'Plan Taken', value: String(stats.activeCustomers || 0), helper: 'Active or trialing plans', tone: 'success' },
      { label: 'Plan Pending', value: String(stats.planPendingCustomers || 0), helper: 'Accounts sales can convert', tone: 'warning' },
      { label: 'Collected Revenue', value: formatCompactCurrency(stats.totalRevenue || 0), helper: `${stats.paidPayments || 0} paid payments`, tone: 'default' }
    ];
  }, [state.overview]);

  return (
    <div className="space-y-3 pb-2">
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.loading ? <p className="module-note">Loading sales overview...</p> : null}
      {!state.loading && state.overview ? (
        <>
          <DashboardMetricCards cards={cards} />

          <div className="split-grid">
            <DashboardSectionCard eyebrow="Sales Pace" title="Monthly sales performance">
              <SalesChart points={state.overview.monthlySales || []} />
            </DashboardSectionCard>
            <DashboardSectionCard eyebrow="Revenue Trend" title="Revenue and refund movement">
              <RevenueChart points={state.overview.revenueTrend || []} />
            </DashboardSectionCard>
          </div>

          <DashboardSectionCard
            eyebrow="Commercial Snapshot"
            title="Pipeline and payment priorities"
            subtitle="Quick operational take on the current commercial funnel."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[1.4rem] border-2 border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Pipeline leads</p>
                <p className="mt-3 font-heading text-3xl font-bold text-navy">{state.overview.stats?.openLeads || 0}</p>
                <p className="mt-2 text-sm text-slate-500">{state.overview.stats?.newLeads || 0} new leads to qualify</p>
              </article>
              <article className="rounded-[1.4rem] border-2 border-success-100 bg-gradient-to-br from-success-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-success-600">Converted leads</p>
                <p className="mt-3 font-heading text-3xl font-bold text-navy">{state.overview.stats?.convertedLeads || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Deals moved through the pipeline</p>
              </article>
              <article className="rounded-[1.4rem] border-2 border-secondary-100 bg-gradient-to-br from-secondary-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary-600">Payments</p>
                <p className="mt-3 font-heading text-3xl font-bold text-navy">{state.overview.stats?.paidPayments || 0}</p>
                <p className="mt-2 text-sm text-slate-500">{state.overview.stats?.pendingPayments || 0} pending payments</p>
              </article>
              <article className="rounded-[1.4rem] border-2 border-info-100 bg-gradient-to-br from-info-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-info-600">Current month</p>
                <p className="mt-3 font-heading text-3xl font-bold text-navy">{formatCompactCurrency(state.overview.stats?.monthlyRevenue || 0)}</p>
                <p className="mt-2 text-sm text-slate-500">Revenue collected this month</p>
              </article>
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            eyebrow="Conversion Funnel"
            title="Lead-to-conversion pipeline"
            subtitle={funnelLoading ? 'Loading...' : `${funnel.summary.conversionRate}% overall conversion rate · ${funnel.summary.convertedCount} of ${funnel.summary.totalLeads} leads converted`}
          >
            {funnelLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
              </div>
            ) : funnel.funnel.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No funnel data yet. Add leads to see the pipeline.</p>
            ) : (
              <div className="space-y-3 py-2">
                {funnel.funnel.map((stage) => {
                  const filledPct = funnel.summary.totalLeads > 0
                    ? clampPercent((stage.count / funnel.summary.totalLeads) * 100)
                    : 0;
                  const emptyPct = clampPercent(100 - filledPct);
                  const stageColors = {
                    new: 'bg-blue-500',
                    contacted: 'bg-indigo-500',
                    qualified: 'bg-violet-500',
                    proposal: 'bg-amber-500',
                    converted: 'bg-emerald-500',
                    lost: 'bg-red-400'
                  };
                  const barColor = stageColors[stage.stage] || 'bg-brand-500';
                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-primary">{stage.label}</span>
                        <span className="text-sm font-bold text-navy">
                          {stage.count} <span className="text-xs font-semibold text-slate-400">({filledPct}% filled)</span>
                        </span>
                      </div>
                      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <span>Filled {filledPct}%</span>
                        <span>Empty {emptyPct}%</span>
                      </div>
                      <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${filledPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Total Revenue (converted)</span>
                  <span className="font-bold text-navy">{formatCompactCurrency(funnel.summary.totalRevenue)}</span>
                </div>
              </div>
            )}
          </DashboardSectionCard>
        </>
      ) : null}
    </div>
  );
};

export default SalesOverview;
