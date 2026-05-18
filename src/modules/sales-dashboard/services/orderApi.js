import { SALES_BASE, safeRequest } from './salesApi';
import { mapSalesOrder } from './mappers';

export const getOrders = async () =>
  safeRequest({
    path: `${SALES_BASE}/orders`,
    emptyData: [],
    extract: (payload) => (payload?.orders || []).map(mapSalesOrder)
  });

export const getOrderDetails = async (orderId) =>
  safeRequest({
    path: `${SALES_BASE}/orders/${orderId}`,
    emptyData: {},
    extract: (payload) => mapSalesOrder(payload?.order || payload || {})
  });
