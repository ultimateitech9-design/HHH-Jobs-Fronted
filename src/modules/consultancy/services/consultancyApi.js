import { apiFetch } from '../../../utils/api';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const request = async (path, options = {}) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }
  return payload || {};
};

const queryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

const jsonOptions = (method, body) => ({
  method,
  body: JSON.stringify(body)
});

export const submitConsultancyEnquiry = (payload) =>
  request('/consultancy/enquiries', jsonOptions('POST', payload));

export const getConsultancySummary = () =>
  request('/consultancy/summary');

export const getConsultancyCases = (filters = {}) => {
  const query = queryString(filters);
  return request(`/consultancy/cases${query ? `?${query}` : ''}`);
};

export const getConsultancyCase = (caseId) =>
  request(`/consultancy/cases/${encodeURIComponent(caseId)}`);

export const getConsultancyTeam = () =>
  request('/consultancy/team');

export const updateConsultancyCase = (caseId, payload) =>
  request(`/consultancy/cases/${encodeURIComponent(caseId)}`, jsonOptions('PATCH', payload));

export const sendConsultancyQuotation = (caseId, payload) =>
  request(`/consultancy/cases/${encodeURIComponent(caseId)}/quotation`, jsonOptions('POST', payload));

export const addConsultancyRequirement = (caseId, payload) =>
  request(`/consultancy/cases/${encodeURIComponent(caseId)}/requirements`, jsonOptions('POST', payload));

export const updateConsultancyRequirement = (requirementId, payload) =>
  request(`/consultancy/requirements/${encodeURIComponent(requirementId)}`, jsonOptions('PATCH', payload));

export const addConsultancyActivity = (caseId, payload) =>
  request(`/consultancy/cases/${encodeURIComponent(caseId)}/activities`, jsonOptions('POST', payload));

export const issueConsultancyInvoice = (caseId, payload) =>
  request(`/consultancy/cases/${encodeURIComponent(caseId)}/invoices`, jsonOptions('POST', payload));
