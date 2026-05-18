import { useEffect, useMemo, useState } from 'react';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardQuickActionCard from '../../../shared/components/dashboard/DashboardQuickActionCard';
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
      { label: 'Total Revenue', value: formatCompactCurrency(stats.totalRevenue || 0), helper: 'Overall booked sales', tone: 'success' },
      { label: 'Monthly Revenue', value: formatCompactCurrency(stats.monthlyRevenue || 0), helper: 'Current month performance', tone: 'info' },
      { label: 'Open Leads', value: String(stats.openLeads || 0), helper: `${stats.convertedLeads || 0} converted`, tone: 'warning' },
      { label: 'Orders', value: String(stats.totalOrders || 0), helper: `${stats.activeCustomers || 0} active customers`, tone: 'default' }
    ];
  }, [state.overview]);

  const quickActions = useMemo(() => ([
    {
      to: '/portal/sales/leads',
      title: 'Lead Pipeline',
      description: 'Qualify new demand and move proposals toward conversion.',
      tone: 'brand',
      ctaLabel: 'Open leads'
    },
    {
      to: '/portal/sales/orders',
      title: 'Orders',
      description: 'Track sales orders, ownership, and payment-linked movement.',
      tone: 'info',
      ctaLabel: 'Open orders'
    },
    {
      to: '/portal/sales/customers',
      title: 'Customers',
      description: 'Track active customers, renewals, and expansion potential.',
      tone: 'success',
      ctaLabel: 'Open customers'
    },
    {
      to: '/portal/sales/team',
      title: 'Sales Team',
      description: 'Review team coverage, performance, and ownership balance.',
      tone: 'accent',
      ctaLabel: 'Open team'
    },
    {
      to: '/portal/sales/products',
      title: 'Products',
      description: 'Inspect product performance and commercial package demand.',
      tone: 'neutral',
      ctaLabel: 'Open products'
    },
    {
      to: '/portal/sales/coupons',
      title: 'Coupons',
      description: 'Track offer codes and discount-driven commercial activity.',
      tone: 'warning',
      ctaLabel: 'Open coupons'
    },
    {
      to: '/portal/sales/refunds',
      title: 'Refunds',
      description: 'Monitor refund exposure and reversal movement.',
      tone: 'warning',
      ctaLabel: 'Open refunds'
    },
    {
      to: '/portal/sales/reports',
      title: 'Reports',
      description: 'Review performance summaries and campaign effectiveness.',
      tone: 'brand',
      ctaLabel: 'Open reports'
    }
  ]), []);

  return (
    <div className="space-y-3 pb-2">
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.loading ? <p className="module-note">Loading sales overview...</p> : null}
      {!state.loading && state.overview ? (
        <>
          <DashboardMetricCards cards={cards} />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <DashboardQuickActionCard
                key={action.title}
                to={action.to}
                title={action.title}
                description={action.description}
                tone={action.tone}
                ctaLabel={action.ctaLabel}
              />
            ))}
          </div>

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
            title="Pipeline and order priorities"
            subtitle="Quick operational take on the current commercial funnel."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[1.4rem] border-2 border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Open leads</p>
                <p className="mt-3 font-heading text-3xl font-bold text-navy">{state.overview.stats?.openLeads || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Top of funnel demand to qualify</p>
              </article>
              <article className="rounded-[1.4rem] border-2 border-success-100 bg-gradient-to-br from-success-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-success-600">Converted leads</p>
                <p className="mt-3 font-heading text-3xl font-bold text-navy">{state.overview.stats?.convertedLeads || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Deals moved through the pipeline</p>
              </article>
              <article className="rounded-[1.4rem] border-2 border-secondary-100 bg-gradient-to-br from-secondary-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary-600">Orders</p>
                <p className="mt-3 font-heading text-3xl font-bold text-navy">{state.overview.stats?.totalOrders || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Processed across the commercial flow</p>
              </article>
              <article className="rounded-[1.4rem] border-2 border-info-100 bg-gradient-to-br from-info-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-info-600">Active customers</p>
                <p className="mt-3 font-heading text-3xl font-bold text-navy">{state.overview.stats?.activeCustomers || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Accounts to retain and grow</p>
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
