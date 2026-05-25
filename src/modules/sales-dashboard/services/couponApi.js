import { SALES_BASE, safeRequest, strictRequest } from './salesApi';
import { mapCouponRequest, mapSalesCoupon, mapSalesRefund } from './mappers';

export const getCoupons = async () =>
  safeRequest({
    path: `${SALES_BASE}/coupons`,
    emptyData: [],
    extract: (payload) => (payload?.coupons || []).map(mapSalesCoupon)
  });

export const validateCoupon = async (payload) =>
  strictRequest({
    path: `${SALES_BASE}/coupons/validate`,
    options: {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    extract: (responsePayload) => responsePayload
  });

export const getCouponRequests = async () =>
  safeRequest({
    path: `${SALES_BASE}/coupon-requests`,
    emptyData: [],
    extract: (payload) => (payload?.requests || []).map(mapCouponRequest)
  });

export const createCouponRequest = async (payload) =>
  strictRequest({
    path: `${SALES_BASE}/coupon-requests`,
    options: {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    extract: (responsePayload) => mapCouponRequest(responsePayload?.request || responsePayload || {})
  });

export const updateCouponRequest = async (requestId, payload) =>
  strictRequest({
    path: `${SALES_BASE}/coupon-requests/${requestId}`,
    options: {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    extract: (responsePayload) => mapCouponRequest(responsePayload?.request || responsePayload || {})
  });

export const getRefunds = async () =>
  safeRequest({
    path: `${SALES_BASE}/refunds`,
    emptyData: [],
    extract: (payload) => (payload?.refunds || []).map(mapSalesRefund)
  });
