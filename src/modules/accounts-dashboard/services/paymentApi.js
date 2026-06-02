import { ACCOUNTS_BASE, safeRequest, strictRequest } from './accountsApi';

const normalizeTransactionStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return 'paid';
  return normalized || 'pending';
};

const normalizeTransaction = (transaction = {}) => ({
  id: transaction.id,
  customer: transaction.customer || transaction.customer_name || '-',
  email: transaction.email || transaction.customer_email || '',
  type: transaction.type || '-',
  channel: transaction.channel || transaction.payment_method || '-',
  amount: Number(transaction.amount || 0),
  currency: transaction.currency || 'INR',
  status: normalizeTransactionStatus(transaction.status),
  gateway: transaction.gateway || transaction.reference || transaction.payment_method || '-',
  reference: transaction.reference || '',
  createdAt: transaction.createdAt || transaction.created_at || null
});

const normalizePayout = (payout = {}) => ({
  id: payout.id,
  beneficiary: payout.beneficiary || payout.recipient_name || '-',
  purpose: payout.purpose || payout.reference || payout.method || '-',
  amount: Number(payout.amount || 0),
  currency: payout.currency || 'INR',
  method: payout.method || '-',
  status: payout.status || 'pending',
  requestedAt: payout.requestedAt || payout.created_at || null
});

const normalizeRefund = (refund = {}) => ({
  id: refund.id,
  account: refund.account || refund.customer_name || '-',
  reason: refund.reason || refund.description || 'Refund',
  amount: Number(refund.amount || 0),
  currency: refund.currency || 'INR',
  status: refund.status || 'refunded',
  requestedAt: refund.requestedAt || refund.created_at || null,
  processedAt: refund.processedAt || refund.created_at || null
});

export const getTransactions = async () =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/transactions`,
    emptyData: [],
    extract: (payload) => (payload?.transactions || []).map(normalizeTransaction)
  });

export const getPayouts = async () =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/payouts`,
    emptyData: [],
    extract: (payload) => (payload?.payouts || []).map(normalizePayout)
  });

export const getRefunds = async () =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/refunds`,
    emptyData: [],
    extract: (payload) => (payload?.refunds || []).map(normalizeRefund)
  });

export const getPaymentSettings = async () =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/payment-settings`,
    emptyData: {
      methods: [],
      settlementProfile: {}
    },
    extract: (payload) => ({
      methods: payload?.methods || [],
      settlementProfile: payload?.settlementProfile || {}
    })
  });

export const savePaymentSettings = async (settingsPayload) =>
  strictRequest({
    path: `${ACCOUNTS_BASE}/payment-settings`,
    options: { method: 'PUT', body: JSON.stringify(settingsPayload) },
    extract: (payload) => payload?.settings || payload
  });
