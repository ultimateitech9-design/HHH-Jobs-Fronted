import { SALES_BASE, safeRequest } from './salesApi';
import { mapSalesCustomer } from './mappers';

export const getCustomers = async () =>
  safeRequest({
    path: `${SALES_BASE}/customers`,
    emptyData: {
      customers: [],
      summary: { totalAccounts: 0, activeAccounts: 0, inactiveAccounts: 0, lifetimeValue: 0 },
      total: 0,
      page: 1,
      limit: 50
    },
    extract: (payload) => ({
      customers: (payload?.customers || []).map(mapSalesCustomer),
      summary: {
        totalAccounts: Number(payload?.summary?.totalAccounts || payload?.total || 0),
        activeAccounts: Number(payload?.summary?.activeAccounts || 0),
        inactiveAccounts: Number(payload?.summary?.inactiveAccounts || 0),
        lifetimeValue: Number(payload?.summary?.lifetimeValue || 0)
      },
      total: Number(payload?.total || 0),
      page: Number(payload?.page || 1),
      limit: Number(payload?.limit || 50)
    })
  });

export const getCustomerDetails = async (customerId) =>
  safeRequest({
    path: `${SALES_BASE}/customers/${customerId}`,
    emptyData: {},
    extract: (payload) => mapSalesCustomer(payload?.customer || payload || {})
  });
