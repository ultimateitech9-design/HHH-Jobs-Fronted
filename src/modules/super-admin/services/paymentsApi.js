import { adminDummyData } from '../data/adminDummyData';
import { SUPER_ADMIN_BASE, safeRequest, strictRequest } from './usersApi';
import { mapApiPaymentToUi } from './mappers';

export const getPayments = async (filters = {}) =>
  safeRequest({
    path: (() => {
      const params = new URLSearchParams({ limit: String(filters.limit || 200) });
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.page) params.set('page', String(filters.page));
      return `${SUPER_ADMIN_BASE}/payments?${params.toString()}`;
    })(),
    emptyData: {
      payments: [],
      summary: { collectedRevenue: 0, pendingPayments: 0, refundedPayments: 0, failedPayments: 0, totalPayments: 0 },
      sources: []
    },
    fallbackData: () => {
      const payments = adminDummyData.payments.filter((payment) => {
        const search = String(filters.search || '').toLowerCase();
        const matchesSearch = !search || [payment.company, payment.item, payment.invoiceId, payment.id].some((value) => String(value || '').toLowerCase().includes(search));
        const matchesStatus = !filters.status || payment.status === filters.status;
        return matchesSearch && matchesStatus;
      }).map(mapApiPaymentToUi);

      return {
        payments,
        summary: {
          totalPayments: payments.length,
          collectedRevenue: payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0),
          pendingPayments: payments.filter((payment) => payment.status === 'pending').length,
          refundedPayments: payments.filter((payment) => payment.status === 'refunded').length,
          failedPayments: payments.filter((payment) => payment.status === 'failed').length
        },
        sources: []
      };
    },
    extract: (payload) => ({
      payments: (payload?.payments || []).map(mapApiPaymentToUi),
      summary: payload?.summary || {},
      sources: Array.isArray(payload?.sources) ? payload.sources : [],
      pagination: payload?.pagination || null
    })
  });

export const getSubscriptions = async () =>
  safeRequest({
    path: `${SUPER_ADMIN_BASE}/subscriptions`,
    emptyData: [],
    fallbackData: adminDummyData.subscriptions,
    extract: (payload) => payload?.subscriptions || []
  });

export const updatePaymentStatus = async (paymentId, status) => {
  try {
    return await strictRequest({
      path: `${SUPER_ADMIN_BASE}/payments/${paymentId}/status`,
      options: { method: 'PATCH', body: JSON.stringify({ status }) },
      extract: (payload) => payload?.payment || payload
    });
  } catch (error) {
    return { ...(adminDummyData.payments.find((payment) => payment.id === paymentId) || {}), status };
  }
};
