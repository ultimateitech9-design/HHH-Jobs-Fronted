import { SALES_BASE, buildQueryString, safeRequest, strictRequest } from './salesApi';
import { mapSalesLead } from './mappers';

export const getLeads = async (filters = {}) =>
  safeRequest({
    path: `${SALES_BASE}/leads${buildQueryString({
      status: filters.stage || filters.status || '',
      targetRole: filters.targetRole || '',
      onboardingStatus: filters.onboardingStatus || '',
      search: filters.search || '',
      page: filters.page || 1,
      limit: filters.limit || 100
    }) ? `?${buildQueryString({
      status: filters.stage || filters.status || '',
      targetRole: filters.targetRole || '',
      onboardingStatus: filters.onboardingStatus || '',
      search: filters.search || '',
      page: filters.page || 1,
      limit: filters.limit || 100
    })}` : ''}`,
    emptyData: {
      leads: [],
      total: 0,
      page: 1,
      limit: 100,
      summary: { totalLeads: 0, planTaken: 0, planPending: 0, expectedValue: 0 }
    },
    extract: (payload) => ({
      leads: (payload?.leads || []).map(mapSalesLead),
      total: Number(payload?.total || 0),
      page: Number(payload?.page || 1),
      limit: Number(payload?.limit || 100),
      summary: {
        totalLeads: Number(payload?.summary?.totalLeads || payload?.total || 0),
        planTaken: Number(payload?.summary?.planTaken || 0),
        planPending: Number(payload?.summary?.planPending || 0),
        expectedValue: Number(payload?.summary?.expectedValue || 0)
      }
    })
  });

export const getLeadDetails = async (leadId) =>
  safeRequest({
    path: `${SALES_BASE}/leads/${leadId}`,
    emptyData: {},
    extract: (payload) => mapSalesLead(payload?.lead || payload || {})
  });

export const updateLead = async (leadId, payload) =>
  strictRequest({
    path: `${SALES_BASE}/leads/${leadId}`,
    options: {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    extract: (responsePayload) => mapSalesLead(responsePayload?.lead || responsePayload || {})
  });

export const markLeadCalled = async (leadId, payload = {}) =>
  strictRequest({
    path: `${SALES_BASE}/leads/${leadId}/call`,
    options: {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    extract: (responsePayload) => mapSalesLead(responsePayload?.lead || responsePayload || {})
  });

export const syncCommercialLeads = async (roles = ['hr', 'campus_connect', 'student']) =>
  strictRequest({
    path: `${SALES_BASE}/leads/sync-commercial`,
    options: {
      method: 'POST',
      body: JSON.stringify({ roles })
    },
    extract: (payload) => payload
  });
