import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import InvoiceTable from '../components/InvoiceTable';
import PaymentMethodCard from '../components/PaymentMethodCard';
import RevenueChart from '../components/RevenueChart';
import TransactionTable from '../components/TransactionTable';
import { getAccountsOverview } from '../services/accountsApi';
import { formatCurrency } from '../utils/currencyFormat';

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

const AccountsOverview = () => {
  const [state, setState] = useState({
    loading: true,
    error: '',
    overview: null
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const response = await getAccountsOverview();
      if (!mounted) return;

      setState({
        loading: false,
        error: response.error || '',
        overview: response.data
      });
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    const overview = state.overview || {};
    const revenueSummary = overview.revenueSummary || {};
    const invoiceSummary = overview.invoiceSummary || {};
    const subscriptionSummary = overview.subscriptionSummary || {};

    return [
      {
        label: 'Gross Revenue',
        value: formatCurrency(revenueSummary.grossRevenue || 0),
        helper: 'Total collections across portal billing',
        tone: 'success'
      },
      {
        label: 'Outstanding Revenue',
        value: formatCurrency(revenueSummary.outstandingRevenue || 0),
        helper: `${invoiceSummary.pendingInvoices || 0} invoices pending`,
        tone: 'warning'
      },
      {
        label: 'MRR',
        value: formatCurrency(subscriptionSummary.monthlyRecurringRevenue || 0),
        helper: `${subscriptionSummary.activeSubscriptions || 0} active subscriptions`,
        tone: 'info'
      },
      {
        label: 'Net Revenue',
        value: formatCurrency(revenueSummary.netRevenue || 0),
        helper: 'After expenses and refunds',
        tone: 'default'
      }
    ];
  }, [state.overview]);

  const summarySignals = useMemo(() => {
    const overview = state.overview || {};
    const transactions = overview.transactionSummary || {};
    const payouts = overview.payoutSummary || {};
    const expenses = overview.expenseSummary || {};

    return [
      { label: 'Transactions', value: transactions.totalTransactions || 0 },
      { label: 'Pending Payouts', value: payouts.pendingPayouts || 0 },
      { label: 'Approved Expenses', value: expenses.approvedExpenses || 0 },
      { label: 'Refund Risk', value: formatCurrency(overview.revenueSummary?.refundAmount || 0) }
    ];
  }, [state.overview]);

  return (
    <div className="space-y-3 pb-2">
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <PortalDashboardHero
        tone="accounts"
        eyebrow="Accounts Overview"
        badge="Finance live"
        title="Revenue, invoices, collections, and settlements across the HHH Jobs platform"
        description="Review cash flow trends, collection backlog, active subscription billing, refund exposure, and the payment rails used to settle platform revenue."
        chips={['Collections', 'Subscriptions', 'Payouts']}
        primaryAction={{ to: '/portal/accounts/invoices', label: 'Open Invoices' }}
        secondaryAction={{ to: '/portal/accounts/payouts', label: 'Review Payouts' }}
        metrics={summarySignals.map((signal) => ({ ...signal, helper: 'Current finance signal' }))}
      />
      {state.loading ? <p className="module-note">Loading accounts overview...</p> : null}

      {!state.loading && state.overview ? (
        <>
          <DashboardMetricCards cards={cards} />

          <div className="grid gap-4 md:grid-cols-4">
            <QuickLinkCard
              to="/portal/accounts/transactions"
              title="Transactions"
              description="Recent collections and settlement movement."
              accent="brand"
            />
            <QuickLinkCard
              to="/portal/accounts/subscriptions"
              title="Subscriptions"
              description="Monitor recurring billing and renewal health."
              accent="secondary"
            />
            <QuickLinkCard
              to="/portal/accounts/refunds"
              title="Refunds"
              description="Watch refund exposure and reversals."
              accent="warning"
            />
            <QuickLinkCard
              to="/portal/accounts/reports"
              title="Reports"
              description="Open finance summaries and exports."
              accent="success"
            />
          </div>

          <div className="split-grid">
            <DashboardSectionCard eyebrow="Revenue Trend" title="Collections vs expense pressure">
              <RevenueChart points={state.overview.monthlyRevenue || []} />
            </DashboardSectionCard>

            <DashboardSectionCard eyebrow="Payment Rails" title="Settlement Channels" subtitle="Gateways and collection rails active on the portal.">
              <div className="split-grid">
                {(state.overview.paymentMethods || []).map((method) => (
                  <PaymentMethodCard key={method.id} method={method} />
                ))}
              </div>
            </DashboardSectionCard>
          </div>

          <div className="split-grid">
            <DashboardSectionCard eyebrow="Transactions" title="Recent Collections">
              <TransactionTable rows={state.overview.recentTransactions || []} />
            </DashboardSectionCard>

            <DashboardSectionCard eyebrow="Invoices" title="Recent Invoice Activity">
              <InvoiceTable rows={state.overview.recentInvoices || []} />
            </DashboardSectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AccountsOverview;
