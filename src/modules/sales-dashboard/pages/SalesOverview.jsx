import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import RevenueChart from '../components/RevenueChart';
import SalesChart from '../components/SalesChart';
import { getSalesOverview, getSalesFunnel } from '../services/salesApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const QuickLinkCard = ({ to, title, description, accent = 'brand' }) => (
  <Link
    to={to}
    className={`group relative overflow-hidden rounded-[1.7rem] border-2 border-${accent}-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover hover:border-${accent}-400`}
  >
    <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-${accent}-50 opacity-70 transition-transform duration-300 group-hover:scale-150`} />
    <div className="relative z-10">
      <p className={`text-xs font-bold uppercase tracking-widest text-${accent}-500`}>{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  </Link>
);

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

  const heroMetrics = useMemo(() => {
    const stats = state.overview?.stats || {};
    return [
      { label: 'Sales agents', value: String(stats.salesAgents || 0), helper: 'Active team coverage' },
      { label: 'Average order', value: formatCompactCurrency(stats.averageOrderValue || 0), helper: 'Deal size benchmark' },
      { label: 'Refunds', value: String(stats.refunds || 0), helper: 'Current reversal pressure' },
      { label: 'Converted leads', value: String(stats.convertedLeads || 0), helper: 'Won from active pipeline' }
    ];
  }, [state.overview]);

  return (
    <div className="space-y-3 pb-2">
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <PortalDashboardHero
        tone="sales"
        eyebrow="Sales Overview"
        badge="Commercial live"
        title="Revenue momentum, target pacing, and lead conversion in one sales workspace"
        description="Track commercial performance across HHH Jobs with revenue trends, lead flow, order volume, and customer activity aligned in one dashboard."
        chips={['Lead flow', 'Revenue pacing', 'Order health']}
        primaryAction={{ to: '/portal/sales/leads', label: 'Open Leads' }}
        secondaryAction={{ to: '/portal/sales/orders', label: 'Review Orders' }}
        metrics={heroMetrics}
      />
      {state.loading ? <p className="module-note">Loading sales overview...</p> : null}
      {!state.loading && state.overview ? (
        <>
          <DashboardMetricCards cards={cards} />

          <div className="grid gap-4 md:grid-cols-3">
            <QuickLinkCard
              to="/portal/sales/leads"
              title="Lead Pipeline"
              description="Qualify new demand and move proposals toward conversion."
              accent="brand"
            />
            <QuickLinkCard
              to="/portal/sales/customers"
              title="Customers"
              description="Track active customers, renewals, and expansion potential."
              accent="secondary"
            />
            <QuickLinkCard
              to="/portal/sales/reports"
              title="Reports"
              description="Review performance summaries and campaign effectiveness."
              accent="success"
            />
          </div>

          <div className="split-grid">
            <DashboardSectionCard eyebrow="Target Pace" title="Monthly sales vs target">
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
                <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview.stats?.openLeads || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Top of funnel demand to qualify</p>
              </article>
              <article className="rounded-[1.4rem] border-2 border-success-100 bg-gradient-to-br from-success-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-success-600">Converted leads</p>
                <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview.stats?.convertedLeads || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Deals moved through the pipeline</p>
              </article>
              <article className="rounded-[1.4rem] border-2 border-secondary-100 bg-gradient-to-br from-secondary-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary-600">Orders</p>
                <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview.stats?.totalOrders || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Processed across the commercial flow</p>
              </article>
              <article className="rounded-[1.4rem] border-2 border-info-100 bg-gradient-to-br from-info-50 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-info-600">Active customers</p>
                <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{state.overview.stats?.activeCustomers || 0}</p>
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
                  const pct = funnel.summary.totalLeads > 0 ? Math.round((stage.count / funnel.summary.totalLeads) * 100) : 0;
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
                        <span className="text-sm font-extrabold text-navy">{stage.count} <span className="text-xs font-semibold text-slate-400">({pct}%)</span></span>
                      </div>
                      <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Total Revenue (converted)</span>
                  <span className="font-extrabold text-navy">{formatCompactCurrency(funnel.summary.totalRevenue)}</span>
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
