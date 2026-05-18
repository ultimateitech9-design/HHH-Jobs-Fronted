import { SALES_BASE, buildQueryString, safeRequest, strictRequest } from './salesApi';
import { mapSalesLead } from './mappers';

export const getLeads = async (filters = {}) =>
  safeRequest({
    path: `${SALES_BASE}/leads${buildQueryString({
      status: filters.stage || filters.status || '',
      targetRole: filters.targetRole || '',
      onboardingStatus: filters.onboardingStatus || '',
      search: filters.search || ''
    }) ? `?${buildQueryString({
      status: filters.stage || filters.status || '',
      targetRole: filters.targetRole || '',
      onboardingStatus: filters.onboardingStatus || '',
      search: filters.search || ''
    })}` : ''}`,
    emptyData: [],
    extract: (payload) => (payload?.leads || []).map(mapSalesLead)
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

export const syncCommercialLeads = async (roles = ['hr', 'campus_connect', 'student']) =>
  strictRequest({
    path: `${SALES_BASE}/leads/sync-commercial`,
    options: {
      method: 'POST',
      body: JSON.stringify({ roles })
    },
    extract: (payload) => payload
  });
