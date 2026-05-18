import { SALES_BASE, safeRequest } from './salesApi';
import { mapSalesCustomer } from './mappers';

export const getCustomers = async () =>
  safeRequest({
    path: `${SALES_BASE}/customers`,
    emptyData: [],
    extract: (payload) => (payload?.customers || []).map(mapSalesCustomer)
  });

export const getCustomerDetails = async (customerId) =>
  safeRequest({
    path: `${SALES_BASE}/customers/${customerId}`,
    emptyData: {},
    extract: (payload) => mapSalesCustomer(payload?.customer || payload || {})
  });
