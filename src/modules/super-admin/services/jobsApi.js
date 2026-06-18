import { adminDummyData } from '../data/adminDummyData';
import { SUPER_ADMIN_BASE, safeRequest, strictRequest } from './usersApi';
import { mapApiJobToUi } from './mappers';
import { areDemoFallbacksEnabled } from '../../../utils/api';
import { clearSWRCache, staleWhileRevalidate } from '../../../shared/services/staleWhileRevalidate';

const filterJobs = (jobs, filters = {}) => {
  return jobs.filter((job) => {
    const search = String(filters.search || '').toLowerCase();
    const matchesSearch = !search || [job.title, job.company, job.location, job.id].some((value) => String(value || '').toLowerCase().includes(search));
    const matchesStatus = !filters.status || job.status === filters.status || job.approvalStatus === filters.status;
    return matchesSearch && matchesStatus;
  });
};

const buildQueryString = (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.status) query.set('status', filters.status);
  if (filters.search) query.set('search', filters.search);
  query.set('page', '1');
  query.set('limit', '100');
  return query.toString();
};

export const getJobs = async (filters = {}) =>
  staleWhileRevalidate({
    key: `super-admin:jobs:${buildQueryString(filters)}`,
    maxAgeMs: 20_000,
    staleMs: 180_000,
    loader: () => safeRequest({
      path: `${SUPER_ADMIN_BASE}/jobs?${buildQueryString(filters)}`,
      emptyData: [],
      fallbackData: () => filterJobs(adminDummyData.jobs, filters),
      extract: (payload) => (payload?.jobs || []).map(mapApiJobToUi)
    })
  });

export const updateJobStatus = async (jobId, status) => {
  try {
    const updatedJob = await strictRequest({
      path: `${SUPER_ADMIN_BASE}/jobs/${jobId}/status`,
      options: { method: 'PATCH', body: JSON.stringify({ status }) },
      extract: (payload) => payload?.job || payload
    });
    clearSWRCache('super-admin:jobs:');
    return updatedJob;
  } catch (error) {
    if (!areDemoFallbacksEnabled()) {
      throw error;
    }
    return { ...(adminDummyData.jobs.find((job) => job.id === jobId) || {}), status };
  }
};
