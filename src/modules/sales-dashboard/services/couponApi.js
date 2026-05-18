import { SALES_BASE, safeRequest } from './salesApi';
import { mapSalesCoupon, mapSalesRefund } from './mappers';

export const getCoupons = async () =>
  safeRequest({
    path: `${SALES_BASE}/coupons`,
    emptyData: [],
    extract: (payload) => (payload?.coupons || []).map(mapSalesCoupon)
  });

export const getRefunds = async () =>
  safeRequest({
    path: `${SALES_BASE}/refunds`,
    emptyData: [],
    extract: (payload) => (payload?.refunds || []).map(mapSalesRefund)
  });
