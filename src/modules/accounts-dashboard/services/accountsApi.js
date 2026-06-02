import { apiFetch, areDemoFallbacksEnabled } from '../../../utils/api';

export const ACCOUNTS_BASE = '/accounts';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const cloneValue = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

export const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

export const safeRequest = async ({ path, options, emptyData, fallbackData, extract = (payload) => payload }) => {
  try {
    const data = await strictRequest({ path, options, extract });
    return { data, error: '', isDemo: false };
  } catch (error) {
    const resolvedFallback = areDemoFallbacksEnabled()
      ? (typeof fallbackData === 'function' ? fallbackData() : fallbackData)
      : undefined;
    return {
      data: cloneValue(resolvedFallback !== undefined ? resolvedFallback : emptyData),
      error: error.message || 'Request failed.',
      isDemo: resolvedFallback !== undefined
    };
  }
};

export const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value));
    }
  });

  return query.toString();
};

const emptyOverview = {
  revenueSummary: {
    grossRevenue: 0,
    collectedRevenue: 0,
    outstandingRevenue: 0,
    refundAmount: 0,
    netRevenue: 0
  },
  invoiceSummary: {
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    failedInvoices: 0
  },
  subscriptionSummary: {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRecurringRevenue: 0,
    annualContractValue: 0
  },
  transactionSummary: {
    totalTransactions: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0
  },
  payoutSummary: {
    totalPayouts: 0,
    completedPayouts: 0,
    pendingPayouts: 0
  },
  expenseSummary: {
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0
  },
  monthlyRevenue: [],
  paymentMethods: [],
  recentTransactions: [],
  recentInvoices: []
};

const normalizeSubscription = (subscription = {}) => ({
  id: subscription.id,
  company: subscription.company || subscription.company_name || '-',
  plan: subscription.plan || '-',
  billingCycle: subscription.billingCycle || subscription.billing_cycle || '-',
  seats: subscription.seats ?? subscription.quantity ?? '-',
  amount: Number(subscription.amount || 0),
  status: subscription.status || 'active',
  renewalDate: subscription.renewalDate || subscription.ends_at || subscription.endsAt || subscription.created_at || null
});

const normalizeExpense = (expense = {}) => ({
  id: expense.id,
  title: expense.title || '-',
  category: expense.category || '-',
  department: expense.department || expense.submitted_name || '-',
  amount: Number(expense.amount || 0),
  status: expense.status || 'pending',
  spentOn: expense.spentOn || expense.created_at || null,
  note: expense.note || expense.description || '-'
});

export const getAccountsOverview = async () =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/overview`,
    emptyData: emptyOverview,
    extract: (payload) => {
      const ov = payload?.overview || payload || {};
      const totalInvoices = ov.totalInvoices || 0;
      const pendingInvoices = ov.pendingInvoices || 0;
      const totalRevenue = ov.totalRevenue || 0;
      const totalTransactions = ov.totalTransactions || 0;
      const activeSubscriptions = ov.activeSubscriptions || 0;
      return {
        revenueSummary: {
          grossRevenue: totalRevenue,
          collectedRevenue: ov.collectedRevenue ?? totalRevenue,
          outstandingRevenue: ov.outstandingRevenue || 0,
          refundAmount: ov.refundAmount || 0,
          netRevenue: ov.netProfit || 0
        },
        invoiceSummary: {
          totalInvoices,
          paidInvoices: ov.paidInvoices ?? Math.max(0, totalInvoices - pendingInvoices),
          pendingInvoices,
          failedInvoices: ov.failedInvoices || 0
        },
        subscriptionSummary: {
          totalSubscriptions: ov.totalSubscriptions ?? activeSubscriptions,
          activeSubscriptions,
          monthlyRecurringRevenue: ov.monthRevenue || 0,
          annualContractValue: ov.annualContractValue || 0
        },
        transactionSummary: {
          totalTransactions,
          successfulTransactions: ov.successfulTransactions ?? totalTransactions,
          pendingTransactions: ov.pendingTransactions || 0,
          failedTransactions: ov.failedTransactions || 0
        },
        payoutSummary: {
          totalPayouts: ov.totalPayouts || 0,
          completedPayouts: ov.completedPayouts || 0,
          pendingPayouts: ov.pendingPayouts || 0
        },
        expenseSummary: {
          totalExpenses: ov.totalExpenses || 0,
          pendingExpenses: ov.pendingExpenses || 0,
          approvedExpenses: ov.approvedExpenses || 0
        },
        monthlyRevenue: ov.monthlyRevenue || [],
        paymentMethods: ov.paymentMethods || [],
        recentTransactions: ov.recentTransactions || [],
        recentInvoices: ov.recentInvoices || []
      };
    }
  });

export const getTransactions = async (params = {}) =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/transactions?${buildQueryString(params)}`,
    emptyData: { transactions: [], total: 0, page: 1, limit: 50 },
    extract: (payload) => ({
      transactions: payload?.transactions || [],
      total: payload?.total || 0,
      page: payload?.page || 1,
      limit: payload?.limit || 50
    })
  });

export const getInvoices = async (params = {}) =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/invoices?${buildQueryString(params)}`,
    emptyData: { invoices: [], total: 0, page: 1, limit: 50 },
    extract: (payload) => ({
      invoices: payload?.invoices || [],
      total: payload?.total || 0,
      page: payload?.page || 1,
      limit: payload?.limit || 50
    })
  });

export const createInvoice = async (invoicePayload) =>
  strictRequest({
    path: `${ACCOUNTS_BASE}/invoices`,
    options: { method: 'POST', body: JSON.stringify(invoicePayload) },
    extract: (payload) => payload?.invoice || payload
  });

export const updateInvoice = async (invoiceId, updates) =>
  strictRequest({
    path: `${ACCOUNTS_BASE}/invoices/${invoiceId}`,
    options: { method: 'PATCH', body: JSON.stringify(updates) },
    extract: (payload) => payload?.invoice || payload
  });

export const getSubscriptions = async (params = {}) =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/subscriptions?${buildQueryString(params)}`,
    emptyData: [],
    extract: (payload) => (payload?.subscriptions || []).map(normalizeSubscription)
  });

export const getExpenses = async (params = {}) =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/expenses?${buildQueryString(params)}`,
    emptyData: [],
    extract: (payload) => (payload?.expenses || []).map(normalizeExpense)
  });

export const createExpense = async (expensePayload) =>
  strictRequest({
    path: `${ACCOUNTS_BASE}/expenses`,
    options: { method: 'POST', body: JSON.stringify(expensePayload) },
    extract: (payload) => payload?.expense || payload
  });

export const updateExpense = async (expenseId, updates) =>
  strictRequest({
    path: `${ACCOUNTS_BASE}/expenses/${expenseId}`,
    options: { method: 'PATCH', body: JSON.stringify(updates) },
    extract: (payload) => payload?.expense || payload
  });

export const getPayouts = async (params = {}) =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/payouts?${buildQueryString(params)}`,
    emptyData: { payouts: [], total: 0, page: 1, limit: 50 },
    extract: (payload) => ({
      payouts: payload?.payouts || [],
      total: payload?.total || 0,
      page: payload?.page || 1,
      limit: payload?.limit || 50
    })
  });

export const createPayout = async (payoutPayload) =>
  strictRequest({
    path: `${ACCOUNTS_BASE}/payouts`,
    options: { method: 'POST', body: JSON.stringify(payoutPayload) },
    extract: (payload) => payload?.payout || payload
  });

export const getRefunds = async (params = {}) =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/refunds?${buildQueryString(params)}`,
    emptyData: { refunds: [], total: 0, page: 1, limit: 50 },
    extract: (payload) => ({
      refunds: payload?.refunds || [],
      total: payload?.total || 0,
      page: payload?.page || 1,
      limit: payload?.limit || 50
    })
  });

export const getReports = async () =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/reports`,
    emptyData: { revenue: [], categoryPerformance: [] },
    extract: (payload) => payload?.reports || payload || {}
  });

export const getSettlementProfile = async () =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/settlement`,
    emptyData: {},
    extract: (payload) => payload?.settlement || payload || {}
  });
