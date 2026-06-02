import { apiFetch, hasApiAccessToken } from '../../../utils/api';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const safeRequest = async ({ path, options, emptyData }) => {
  try {
    const response = await apiFetch(path, options);
    const payload = await parseJson(response);

    if (!response.ok) {
      return { data: emptyData, error: payload?.message || `Request failed (${response.status})` };
    }

    return { data: payload?.data ?? payload, error: '' };
  } catch (err) {
    return { data: emptyData, error: err.message || 'Network error' };
  }
};

const authRequest = async ({ path, options, emptyData }) => {
  if (!hasApiAccessToken()) {
    return { data: emptyData, error: 'Authentication required' };
  }
  return safeRequest({ path, options, emptyData });
};

export const getExternalJobs = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.sector) params.set('sector', filters.sector);
  if (filters.location) params.set('location', filters.location);
  if (filters.city) params.set('city', filters.city);
  if (filters.pincode) params.set('pincode', filters.pincode);
  if (filters.source) params.set('source', filters.source);
  if (filters.remote) params.set('remote', 'true');
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  return safeRequest({
    path: `/external-jobs?${params.toString()}`,
    emptyData: { jobs: [], pagination: null }
  });
};

export const getExternalJobCategories = () =>
  safeRequest({ path: '/external-jobs/categories', emptyData: [] });

export const getExternalJobSources = () =>
  safeRequest({ path: '/external-jobs/sources', emptyData: [] });

export const getExternalJobById = (id) =>
  safeRequest({ path: `/external-jobs/${id}`, emptyData: null });

export const adminTriggerSync = (source = null) =>
  authRequest({
    path: '/external-jobs/admin/sync',
    options: {
      method: 'POST',
      body: JSON.stringify(source ? { source } : {})
    },
    emptyData: null
  });

export const adminTriggerVerification = () =>
  authRequest({
    path: '/external-jobs/admin/verify',
    options: { method: 'POST' },
    emptyData: null
  });

export const adminGetMonitorStats = () =>
  authRequest({ path: '/external-jobs/admin/monitor', emptyData: { sources: [], activeJobCount: 0, recentLogs: [] } });

export const adminGetSyncLogs = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.source) params.set('source', filters.source);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  return authRequest({
    path: `/external-jobs/admin/logs?${params.toString()}`,
    emptyData: { logs: [], pagination: null }
  });
};

export const adminToggleJob = (id) =>
  authRequest({
    path: `/external-jobs/admin/jobs/${id}/toggle`,
    options: { method: 'PATCH' },
    emptyData: null
  });

export const adminGetAllJobs = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  return authRequest({
    path: `/external-jobs/admin/jobs?${params.toString()}`,
    emptyData: { jobs: [], pagination: null }
  });
};
