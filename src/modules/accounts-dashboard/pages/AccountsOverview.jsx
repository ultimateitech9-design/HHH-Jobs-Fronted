import { useEffect, useState } from 'react';
import { FiBarChart2, FiCreditCard, FiFileText, FiRepeat } from 'react-icons/fi';
import DashboardFocusNav from '../../../shared/components/dashboard/DashboardFocusNav';
import DashboardPageHeader from '../../../shared/components/dashboard/DashboardPageHeader';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import DashboardSummaryStrip from '../../../shared/components/dashboard/DashboardSummaryStrip';
import useDashboardView from '../../../shared/hooks/useDashboardView';
import InvoiceTable from '../components/InvoiceTable';
import PaymentMethodCard from '../components/PaymentMethodCard';
import RevenueChart from '../components/RevenueChart';
import TransactionTable from '../components/TransactionTable';
import { getAccountsOverview } from '../services/accountsApi';

const ACCOUNTS_DASHBOARD_VIEWS = ['cashflow', 'transactions', 'invoices', 'methods'];
const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const AccountsOverview = () => {
  const [activeView, setActiveView] = useDashboardView(ACCOUNTS_DASHBOARD_VIEWS, 'cashflow');
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

  const overview = state.overview || {};
  const focusItems = [
    { key: 'cashflow', label: 'Cash flow', description: 'Review collection movement and expense pressure over time.', icon: FiBarChart2 },
    { key: 'transactions', label: 'Transactions', description: 'Inspect the most recent portal collections.', count: overview.recentTransactions?.length || 0, icon: FiRepeat },
    { key: 'invoices', label: 'Invoices', description: 'Review recent invoice activity and pending collection records.', count: overview.invoiceSummary?.pendingInvoices || overview.recentInvoices?.length || 0, icon: FiFileText },
    { key: 'methods', label: 'Payment methods', description: 'Monitor payment gateways and settlement rails.', count: overview.paymentMethods?.length || 0, icon: FiCreditCard }
  ];

  return (
    <div className="space-y-3 pb-2">
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <DashboardPageHeader
        eyebrow="Finance operations"
        title="Accounts overview"
        description="Review collections, invoices, and settlement methods one financial workflow at a time."
      />
      {state.loading ? <p className="module-note">Loading accounts overview...</p> : null}

      {!state.loading && state.overview ? (
        <>
          <DashboardSummaryStrip
            items={[
              { label: 'Collected revenue', value: formatCurrency(overview.revenueSummary?.collectedRevenue), helper: 'Settled collections', icon: FiBarChart2 },
              { label: 'Outstanding', value: formatCurrency(overview.revenueSummary?.outstandingRevenue), helper: 'Pending recovery', icon: FiRepeat },
              { label: 'Pending invoices', value: Number(overview.invoiceSummary?.pendingInvoices || 0).toLocaleString('en-IN'), helper: `${overview.invoiceSummary?.totalInvoices || 0} total invoices`, icon: FiFileText },
              { label: 'Payment methods', value: Number(overview.paymentMethods?.length || 0).toLocaleString('en-IN'), helper: 'Active settlement rails', icon: FiCreditCard }
            ]}
          />
          <DashboardFocusNav items={focusItems} activeKey={activeView} onChange={setActiveView} label="Accounts dashboard workspaces" />

          {activeView === 'cashflow' ? (
              <DashboardSectionCard eyebrow="Revenue Trend" title="Collections vs expense pressure" id="dashboard-view-cashflow" role="tabpanel" aria-labelledby="dashboard-tab-cashflow">
              <RevenueChart points={state.overview.monthlyRevenue || []} />
            </DashboardSectionCard>
          ) : null}

          {activeView === 'methods' ? (
              <DashboardSectionCard eyebrow="Payment Rails" title="Settlement Channels" subtitle="Gateways and collection rails active on the portal." id="dashboard-view-methods" role="tabpanel" aria-labelledby="dashboard-tab-methods">
              <div className="grid gap-3 md:grid-cols-2">
                {(state.overview.paymentMethods || []).map((method) => (
                  <PaymentMethodCard key={method.id} method={method} />
                ))}
              </div>
            </DashboardSectionCard>
          ) : null}

          {activeView === 'transactions' ? (
              <DashboardSectionCard eyebrow="Transactions" title="Recent Collections" id="dashboard-view-transactions" role="tabpanel" aria-labelledby="dashboard-tab-transactions">
              <TransactionTable rows={state.overview.recentTransactions || []} />
            </DashboardSectionCard>
          ) : null}

          {activeView === 'invoices' ? (
              <DashboardSectionCard eyebrow="Invoices" title="Recent Invoice Activity" id="dashboard-view-invoices" role="tabpanel" aria-labelledby="dashboard-tab-invoices">
              <InvoiceTable rows={state.overview.recentInvoices || []} />
            </DashboardSectionCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default AccountsOverview;
