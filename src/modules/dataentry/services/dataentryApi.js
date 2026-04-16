import { apiFetch } from '../../../utils/api';

const DATA_ENTRY_BASE = '/dataentry';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const clone = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
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
    return {
      data: clone(emptyData),
      isDemo: false,
      error: error.message || 'Request failed.'
    };
  }
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value));
    }
  });

  return query.toString();
};

const readCollection = async ({ path, key, params = {}, emptyData = [] }) => {
  const query = buildQueryString(params);

  return safeRequest({
    path: `${path}${query ? `?${query}` : ''}`,
    emptyData,
    extract: (payload) => payload?.[key] || emptyData
  });
};

const createItem = async ({ path, key, body }) => {
  return strictRequest({
    path,
    options: { method: 'POST', body: JSON.stringify(body) },
    extract: (payload) => payload?.[key] || payload
  });
};

const updateItem = async ({ path, key, body }) => {
  return strictRequest({
    path,
    options: { method: 'PATCH', body: JSON.stringify(body) },
    extract: (payload) => payload?.[key] || payload
  });
};

export const defaultEntryFilters = {
  search: '',
  type: '',
  status: '',
  assignedTo: ''
};

export const defaultJobEntryDraft = {
  title: '',
  companyName: '',
  location: '',
  salaryMin: '',
  salaryMax: '',
  employmentType: 'Full-Time',
  experienceLevel: 'Entry',
  description: '',
  skillsInput: ''
};

export const defaultPropertyEntryDraft = {
  title: '',
  propertyType: 'Office',
  location: '',
  price: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  description: ''
};

export const defaultProfileDraft = {
  name: '',
  email: '',
  mobile: '',
  employeeId: '',
  shift: 'Morning',
  location: '',
  headline: '',
  dailyTarget: '25',
  notes: ''
};

const normalizeDataEntryProfile = (profile = {}) => ({
  ...defaultProfileDraft,
  ...profile,
  employeeId: profile.employeeId || profile.employee_id || '',
  shift: profile.shift || 'Morning',
  location: profile.location || '',
  headline: profile.headline || '',
  dailyTarget: profile.dailyTarget || profile.daily_target || '',
  queueName: profile.queueName || profile.queue_name || '',
  reviewerLevel: profile.reviewerLevel || profile.reviewer_level || '',
  qualityScore: profile.qualityScore || profile.quality_score || '',
  notes: profile.notes || ''
});

const parseListInput = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const formatJobEntryPayload = (draft = {}) => ({
  type: 'job',
  title: draft.title,
  companyName: draft.companyName,
  location: draft.location,
  salaryMin: draft.salaryMin ? Number(draft.salaryMin) : null,
  salaryMax: draft.salaryMax ? Number(draft.salaryMax) : null,
  employmentType: draft.employmentType,
  experienceLevel: draft.experienceLevel,
  description: draft.description,
  skills: parseListInput(draft.skillsInput)
});

export const formatPropertyEntryPayload = (draft = {}) => ({
  type: 'property',
  title: draft.title,
  propertyType: draft.propertyType,
  location: draft.location,
  price: draft.price ? Number(draft.price) : null,
  area: draft.area ? Number(draft.area) : null,
  bedrooms: draft.bedrooms ? Number(draft.bedrooms) : null,
  bathrooms: draft.bathrooms ? Number(draft.bathrooms) : null,
  description: draft.description
});

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const emptyDashboard = {
  stats: { total: 0, pending: 0, approved: 0, rejected: 0, drafts: 0 },
  recentEntries: []
};

export const getDataEntryDashboard = async () =>
  safeRequest({
    path: `${DATA_ENTRY_BASE}/dashboard`,
    emptyData: emptyDashboard,
    extract: (payload) => {
      const dashboard = payload?.dashboard || payload || {};
      const stats = dashboard.stats || {};
      const recentEntries = Array.isArray(dashboard.recentEntries) ? dashboard.recentEntries : [];

      return {
        totals: {
          candidatesAdded: Number(stats.approved || 0),
          jobsPosted: recentEntries.filter((entry) => entry.type === 'job').length,
          companiesAdded: recentEntries.filter((entry) => entry.type === 'property').length,
          hrContactsAdded: 0,
          totalEntries: Number(stats.total || 0)
        },
        candidateWorkflow: {
          profileCreated: Number(stats.total || 0),
          resumeUploaded: 0,
          detailsUpdated: recentEntries.length,
          candidateIdsGenerated: Number(stats.approved || 0)
        },
        companyWorkflow: {
          companyDetailsAdded: recentEntries.filter((entry) => entry.type === 'property').length,
          hrContactsAdded: 0,
          jobOpeningsAdded: recentEntries.filter((entry) => entry.type === 'job').length
        },
        pipeline: {
          applied: Number(stats.pending || 0),
          shortlisted: 0,
          interview: 0,
          selected: Number(stats.approved || 0),
          rejected: Number(stats.rejected || 0)
        },
        quality: {
          errors: 0,
          duplicateEntries: 0,
          pendingReview: Number(stats.pending || 0),
          approved: Number(stats.approved || 0),
          drafts: Number(stats.drafts || 0)
        },
        activityFeed: recentEntries.map((entry) => ({
          id: entry.id,
          title: entry.title,
          action: entry.type,
          description: `${entry.type} entry is currently ${entry.status}.`,
          status: entry.status,
          createdAt: entry.created_at
        }))
      };
    }
  });

export const getDataEntryEntries = async (filters = {}) =>
  readCollection({
    path: `${DATA_ENTRY_BASE}/entries`,
    key: 'entries',
    params: filters,
    emptyData: []
  });

export const getDataEntryEntryById = async (entryId) =>
  safeRequest({
    path: `${DATA_ENTRY_BASE}/entries/${entryId}`,
    emptyData: {},
    extract: (payload) => payload?.entry || payload || {}
  });

export const createJobEntry = async (draft) =>
  createItem({
    path: `${DATA_ENTRY_BASE}/jobs`,
    key: 'entry',
    body: formatJobEntryPayload(draft)
  });

export const createPropertyEntry = async (draft) =>
  createItem({
    path: `${DATA_ENTRY_BASE}/properties`,
    key: 'entry',
    body: formatPropertyEntryPayload(draft)
  });

export const updateDataEntry = async (entryId, payload) =>
  updateItem({
    path: `${DATA_ENTRY_BASE}/entries/${entryId}`,
    key: 'entry',
    body: payload
  });

export const uploadEntryImages = async (entryId, imageUrls = []) =>
  strictRequest({
    path: `${DATA_ENTRY_BASE}/entries/${entryId}/images`,
    options: { method: 'POST', body: JSON.stringify({ images: imageUrls }) },
    extract: (payload) => payload?.images || []
  });

export const getDraftEntries = async (filters = {}) =>
  readCollection({
    path: `${DATA_ENTRY_BASE}/entries/drafts`,
    key: 'entries',
    params: filters,
    emptyData: []
  });

export const getPendingEntries = async (filters = {}) =>
  readCollection({
    path: `${DATA_ENTRY_BASE}/entries/pending`,
    key: 'entries',
    params: filters,
    emptyData: []
  });

export const getApprovedEntries = async (filters = {}) =>
  readCollection({
    path: `${DATA_ENTRY_BASE}/entries/approved`,
    key: 'entries',
    params: filters,
    emptyData: []
  });

export const getRejectedEntries = async (filters = {}) =>
  readCollection({
    path: `${DATA_ENTRY_BASE}/entries/rejected`,
    key: 'entries',
    params: filters,
    emptyData: []
  });

export const getAssignedTasks = async () =>
  safeRequest({
    path: `${DATA_ENTRY_BASE}/tasks/assigned`,
    emptyData: [],
    extract: (payload) => payload?.tasks || []
  });

export const getDataEntryNotifications = async () =>
  safeRequest({
    path: `${DATA_ENTRY_BASE}/notifications`,
    emptyData: [],
    extract: (payload) => payload?.notifications || []
  });

export const markDataEntryNotificationRead = async (notificationId) =>
  updateItem({
    path: `${DATA_ENTRY_BASE}/notifications/${notificationId}/read`,
    key: 'notification',
    body: { status: 'read' }
  });

export const getDataEntryProfile = async () =>
  safeRequest({
    path: `${DATA_ENTRY_BASE}/profile`,
    emptyData: defaultProfileDraft,
    extract: (payload) => normalizeDataEntryProfile(payload?.profile || payload || {})
  });

export const getDataEntryPortalRecords = async () =>
  safeRequest({
    path: `${DATA_ENTRY_BASE}/records`,
    emptyData: { summary: {}, jobs: [], candidates: [], companies: [], notifications: [], queue: {} },
    extract: (payload) => payload?.records || payload || {}
  });

export const updateDataEntryProfile = async (profilePayload) =>
  strictRequest({
    path: `${DATA_ENTRY_BASE}/profile`,
    options: { method: 'PATCH', body: JSON.stringify(profilePayload) },
    extract: (payload) => normalizeDataEntryProfile(payload?.profile || payload || {})
  });
