import { apiFetch, hasApiAccessToken } from '../../../utils/api';
import { filterDeletedUsers } from '../../../utils/managedUsers';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  if (!hasApiAccessToken()) {
    throw new Error('Admin API is unavailable without a logged-in backend session.');
  }

  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

const safeRequest = async ({ path, options, emptyData, extract = (payload) => payload }) => {
  try {
    const data = await strictRequest({ path, options, extract });
    return { data, isDemo: false, error: '' };
  } catch (error) {
    return { data: emptyData, isDemo: false, error: error.message || 'Request failed.' };
  }
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, value);
    }
  });
  return query.toString();
};

const readEntityCollection = async ({ path, key, params = {}, emptyData = [] }) => {
  const queryString = buildQueryString(params);
  return safeRequest({
    path: `${path}${queryString ? `?${queryString}` : ''}`,
    emptyData,
    extract: (payload) => payload?.[key] || emptyData
  });
};

const createEntityItem = async ({ path, key, body }) =>
  strictRequest({
    path,
    options: { method: 'POST', body: JSON.stringify(body) },
    extract: (payload) => payload?.[key] || payload
  });

const updateEntityItem = async ({ path, key, body }) =>
  strictRequest({
    path,
    options: { method: 'PATCH', body: JSON.stringify(body) },
    extract: (payload) => payload?.[key] || payload
  });

const deleteEntityItem = async ({ path }) =>
  strictRequest({
    path,
    options: { method: 'DELETE' },
    extract: (payload) => payload
  });

// Analytics
export const getAdminAnalytics = async () =>
  safeRequest({
    path: '/admin/analytics',
    emptyData: {
      totalUsers: 0,
      totalHr: 0,
      approvedHr: 0,
      totalStudents: 0,
      activeUsers: 0,
      blockedUsers: 0,
      bannedUsers: 0,
      totalJobs: 0,
      openJobs: 0,
      closedJobs: 0,
      deletedJobs: 0,
      pendingJobs: 0,
      totalApplications: 0,
      reportsOpen: 0,
      reportsTotal: 0
    },
    extract: (payload) => payload?.analytics || {}
  });

// Users & HR approvals
export const getAdminUsers = async (filters = {}) =>
  safeRequest({
    path: `/admin/users${buildQueryString(filters) ? `?${buildQueryString(filters)}` : ''}`,
    emptyData: [],
    extract: (payload) => filterDeletedUsers(payload?.users || [])
  });

export const updateAdminUserStatus = async (userId, status) =>
  strictRequest({
    path: `/admin/users/${userId}/status`,
    options: { method: 'PATCH', body: JSON.stringify({ status }) },
    extract: (payload) => payload?.user || payload
  });

export const updateAdminHrApproval = async (userId, approved) =>
  strictRequest({
    path: `/admin/hr/${userId}/approve`,
    options: { method: 'PATCH', body: JSON.stringify({ approved }) },
    extract: (payload) => payload?.user || payload
  });

// Jobs
export const getAdminJobs = async (filters = {}) =>
  readEntityCollection({
    path: '/admin/jobs',
    key: 'jobs',
    params: { status: filters.status || '' },
    emptyData: []
  });

export const updateAdminJobStatus = async (jobId, status) =>
  strictRequest({
    path: `/admin/jobs/${jobId}/status`,
    options: { method: 'PATCH', body: JSON.stringify({ status }) },
    extract: (payload) => payload?.job || payload
  });

export const updateAdminJobApproval = async (jobId, approvalPayload) =>
  strictRequest({
    path: `/admin/jobs/${jobId}/approval`,
    options: {
      method: 'PATCH',
      body: JSON.stringify({
        approvalStatus: approvalPayload.approvalStatus,
        approvalNote: approvalPayload.approvalNote || null
      })
    },
    extract: (payload) => payload?.job || payload
  });

export const deleteAdminJob = async (jobId) =>
  deleteEntityItem({ path: `/admin/jobs/${jobId}` });

// Reports
export const getAdminReports = async (filters = {}) =>
  readEntityCollection({
    path: '/admin/reports',
    key: 'reports',
    params: { status: filters.status || '' },
    emptyData: []
  });

export const updateAdminReport = async (reportId, reportPayload) =>
  strictRequest({
    path: `/admin/reports/${reportId}`,
    options: {
      method: 'PATCH',
      body: JSON.stringify({
        status: reportPayload.status,
        adminNote: reportPayload.adminNote || null
      })
    },
    extract: (payload) => payload?.report || payload
  });

// Applications
export const getAdminApplications = async (filters = {}) =>
  readEntityCollection({
    path: '/admin/applications',
    key: 'applications',
    params: { status: filters.status || '' },
    emptyData: []
  });

// Master data
export const getAdminCategories = async () =>
  readEntityCollection({ path: '/admin/categories', key: 'categories', emptyData: [] });
export const createAdminCategory = async (payload) =>
  createEntityItem({ path: '/admin/categories', key: 'category', body: payload });
export const updateAdminCategory = async (id, payload) =>
  updateEntityItem({ path: `/admin/categories/${id}`, key: 'category', body: payload });
export const deleteAdminCategory = async (id) =>
  deleteEntityItem({ path: `/admin/categories/${id}` });

export const getAdminLocations = async () =>
  readEntityCollection({ path: '/admin/locations', key: 'locations', emptyData: [] });
export const createAdminLocation = async (payload) =>
  createEntityItem({ path: '/admin/locations', key: 'location', body: payload });
export const updateAdminLocation = async (id, payload) =>
  updateEntityItem({ path: `/admin/locations/${id}`, key: 'location', body: payload });
export const deleteAdminLocation = async (id) =>
  deleteEntityItem({ path: `/admin/locations/${id}` });

export const getAdminStates = async () =>
  readEntityCollection({ path: '/admin/states', key: 'states', emptyData: [] });
export const createAdminState = async (payload) =>
  createEntityItem({ path: '/admin/states', key: 'state', body: payload });
export const updateAdminState = async (id, payload) =>
  updateEntityItem({ path: `/admin/states/${id}`, key: 'state', body: payload });
export const deleteAdminState = async (id) =>
  deleteEntityItem({ path: `/admin/states/${id}` });

export const getAdminDistricts = async (stateId = '') =>
  readEntityCollection({
    path: '/admin/districts',
    key: 'districts',
    params: { stateId },
    emptyData: []
  });
export const createAdminDistrict = async (payload) =>
  createEntityItem({ path: '/admin/districts', key: 'district', body: payload });
export const updateAdminDistrict = async (id, payload) =>
  updateEntityItem({ path: `/admin/districts/${id}`, key: 'district', body: payload });
export const deleteAdminDistrict = async (id) =>
  deleteEntityItem({ path: `/admin/districts/${id}` });

export const getAdminTehsils = async (districtId = '') =>
  readEntityCollection({
    path: '/admin/tehsils',
    key: 'tehsils',
    params: { districtId },
    emptyData: []
  });
export const createAdminTehsil = async (payload) =>
  createEntityItem({ path: '/admin/tehsils', key: 'tehsil', body: payload });
export const updateAdminTehsil = async (id, payload) =>
  updateEntityItem({ path: `/admin/tehsils/${id}`, key: 'tehsil', body: payload });
export const deleteAdminTehsil = async (id) =>
  deleteEntityItem({ path: `/admin/tehsils/${id}` });

export const getAdminVillages = async (tehsilId = '') =>
  readEntityCollection({
    path: '/admin/villages',
    key: 'villages',
    params: { tehsilId },
    emptyData: []
  });
export const createAdminVillage = async (payload) =>
  createEntityItem({ path: '/admin/villages', key: 'village', body: payload });
export const updateAdminVillage = async (id, payload) =>
  updateEntityItem({ path: `/admin/villages/${id}`, key: 'village', body: payload });
export const deleteAdminVillage = async (id) =>
  deleteEntityItem({ path: `/admin/villages/${id}` });

export const getAdminPincodes = async (filters = {}) =>
  readEntityCollection({
    path: '/admin/pincodes',
    key: 'pincodes',
    params: {
      stateId: filters.stateId || '',
      districtId: filters.districtId || ''
    },
    emptyData: []
  });
export const createAdminPincode = async (payload) =>
  createEntityItem({ path: '/admin/pincodes', key: 'pincode', body: payload });
export const deleteAdminPincode = async (id) =>
  deleteEntityItem({ path: `/admin/pincodes/${id}` });

export const getAdminIndustries = async () =>
  readEntityCollection({ path: '/admin/industries', key: 'industries', emptyData: [] });
export const createAdminIndustry = async (payload) =>
  createEntityItem({ path: '/admin/industries', key: 'industry', body: payload });
export const updateAdminIndustry = async (id, payload) =>
  updateEntityItem({ path: `/admin/industries/${id}`, key: 'industry', body: payload });
export const deleteAdminIndustry = async (id) =>
  deleteEntityItem({ path: `/admin/industries/${id}` });

export const getAdminSkills = async (industryId = '') =>
  readEntityCollection({
    path: '/admin/skills',
    key: 'skills',
    params: { industryId },
    emptyData: []
  });
export const createAdminSkill = async (payload) =>
  createEntityItem({ path: '/admin/skills', key: 'skill', body: payload });
export const updateAdminSkill = async (id, payload) =>
  updateEntityItem({ path: `/admin/skills/${id}`, key: 'skill', body: payload });
export const deleteAdminSkill = async (id) =>
  deleteEntityItem({ path: `/admin/skills/${id}` });

// Payments
export const getAdminPayments = async (status = '') =>
  readEntityCollection({
    path: '/admin/payments',
    key: 'payments',
    params: { status },
    emptyData: []
  });

export const updateAdminPayment = async (paymentId, payload) =>
  strictRequest({
    path: `/admin/payments/${paymentId}`,
    options: {
      method: 'PATCH',
      body: JSON.stringify({
        status: payload.status,
        note: payload.note || null,
        provider: payload.provider || null,
        referenceId: payload.referenceId || null
      })
    },
    extract: (responsePayload) => responsePayload?.payment || responsePayload
  });

// Pricing plans and purchases
export const getAdminPricingPlans = async () =>
  safeRequest({
    path: '/pricing/admin/plans',
    emptyData: [],
    extract: (payload) => payload?.plans || []
  });

export const updateAdminPricingPlan = async (planSlug, payload) =>
  strictRequest({
    path: `/pricing/plans/${planSlug}`,
    options: { method: 'PATCH', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload?.plan || responsePayload
  });

export const getAdminPlanPurchases = async (filters = {}) =>
  readEntityCollection({
    path: '/pricing/purchases',
    key: 'purchases',
    params: {
      status: filters.status || '',
      planSlug: filters.planSlug || '',
      hrId: filters.hrId || ''
    },
    emptyData: []
  });

export const updateAdminPlanPurchaseStatus = async (purchaseId, payload) =>
  strictRequest({
    path: `/pricing/purchases/${purchaseId}/status`,
    options: {
      method: 'PATCH',
      body: JSON.stringify({
        status: payload.status,
        provider: payload.provider || null,
        referenceId: payload.referenceId || null,
        note: payload.note || null
      })
    },
    extract: (responsePayload) => responsePayload?.purchase || responsePayload
  });

export const grantAdminPostingCredits = async (payload) =>
  strictRequest({
    path: '/pricing/credits/grant',
    options: {
      method: 'POST',
      body: JSON.stringify({
        hrId: payload.hrId,
        planSlug: payload.planSlug,
        quantity: Number(payload.quantity || 1),
        expiresAt: payload.expiresAt || null
      })
    },
    extract: (responsePayload) => responsePayload?.credit || responsePayload
  });

export const getAdminRolePricingPlans = async (audienceRole = '') =>
  safeRequest({
    path: `/pricing/admin/role-plans${buildQueryString({ audienceRole }) ? `?${buildQueryString({ audienceRole })}` : ''}`,
    emptyData: [],
    extract: (payload) => payload?.plans || []
  });

export const updateAdminRolePricingPlan = async (planSlug, payload) =>
  strictRequest({
    path: `/pricing/role-plans/${planSlug}`,
    options: { method: 'PATCH', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload?.plan || responsePayload
  });

export const getAdminRolePlanPurchases = async (filters = {}) =>
  readEntityCollection({
    path: '/pricing/role-plan-purchases',
    key: 'purchases',
    params: {
      status: filters.status || '',
      audienceRole: filters.audienceRole || '',
      userId: filters.userId || ''
    },
    emptyData: []
  });

export const updateAdminRolePlanPurchaseStatus = async (purchaseId, payload) =>
  strictRequest({
    path: `/pricing/role-plan-purchases/${purchaseId}/status`,
    options: {
      method: 'PATCH',
      body: JSON.stringify({
        status: payload.status,
        provider: payload.provider || null,
        referenceId: payload.referenceId || null,
        note: payload.note || null
      })
    },
    extract: (responsePayload) => responsePayload?.purchase || responsePayload
  });

export const getAdminSalesCoupons = async () =>
  safeRequest({
    path: '/sales/coupons',
    emptyData: [],
    extract: (payload) => payload?.coupons || []
  });

export const createAdminSalesCoupon = async (payload) =>
  strictRequest({
    path: '/sales/coupons',
    options: {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    extract: (responsePayload) => responsePayload?.coupon || responsePayload
  });

export const updateAdminSalesCoupon = async (couponId, payload) =>
  strictRequest({
    path: `/sales/coupons/${couponId}`,
    options: {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    extract: (responsePayload) => responsePayload?.coupon || responsePayload
  });

// Audit logs
export const getAdminAuditLogs = async (filters = {}) =>
  safeRequest({
    path: `/admin/audit-logs${buildQueryString(filters) ? `?${buildQueryString(filters)}` : ''}`,
    emptyData: {
      auditLogs: [],
      pagination: {
        page: Number(filters.page || 1),
        limit: Number(filters.limit || 50),
        total: 0,
        totalPages: 1
      }
    },
    extract: (payload) => ({
      auditLogs: payload?.auditLogs || [],
      pagination: payload?.pagination || {
        page: Number(filters.page || 1),
        limit: Number(filters.limit || 50),
        total: 0,
        totalPages: 1
      }
    })
  });

// Admin settings
export const getAdminSettings = async () =>
  safeRequest({
    path: '/admin/settings',
    emptyData: null,
    extract: (payload) => payload?.settings || null
  });

export const saveAdminSettings = async (settingsPayload) =>
  safeRequest({
    path: '/admin/settings',
    options: {
      method: 'PUT',
      body: JSON.stringify(settingsPayload)
    },
    emptyData: null,
    extract: (payload) => payload?.settings || null
  });

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};
