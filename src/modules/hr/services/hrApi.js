import { apiFetch } from '../../../utils/api';

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
    return { data: clone(emptyData), isDemo: false, error: error.message || 'Request failed.' };
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

const defaultJobDraft = {
  jobTitle: '',
  planSlug: 'free',
  targetAudience: 'all',
  companyName: '',
  minPrice: '',
  maxPrice: '',
  salaryType: 'LPA',
  jobLocation: '',
  jobLocationsInput: '',
  postingDate: '',
  experienceLevel: '',
  skillsInput: '',
  companyLogo: '',
  employmentType: 'Full-Time',
  category: '',
  description: ''
};

const parseSkillsInput = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const formatJobDraftForApi = (draft = {}) => ({
  planSlug: draft.planSlug || 'free',
  targetAudience: draft.targetAudience || 'all',
  audience: draft.targetAudience || 'all',
  jobTitle: draft.jobTitle,
  companyName: draft.companyName,
  minPrice: draft.minPrice ? Number(draft.minPrice) : null,
  maxPrice: draft.maxPrice ? Number(draft.maxPrice) : null,
  salaryType: draft.salaryType,
  jobLocation: draft.jobLocation,
  jobLocations: [
    ...new Set(
      String(draft.jobLocationsInput || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .concat(String(draft.jobLocation || '').trim())
        .filter(Boolean)
    )
  ],
  postingDate: draft.postingDate || null,
  experienceLevel: draft.experienceLevel,
  skills: parseSkillsInput(draft.skillsInput),
  companyLogo: draft.companyLogo,
  employmentType: draft.employmentType,
  category: draft.category,
  description: draft.description
});

const hydrateJobDraftFromJob = (job = {}) => ({
  jobTitle: job.jobTitle || '',
  planSlug: job.planSlug || 'free',
  targetAudience: job.targetAudience || job.audience || 'all',
  companyName: job.companyName || '',
  minPrice: job.minPrice || '',
  maxPrice: job.maxPrice || '',
  salaryType: job.salaryType || 'LPA',
  jobLocation: job.jobLocation || '',
  jobLocationsInput: Array.isArray(job.jobLocations)
    ? job.jobLocations.join(', ')
    : (job.jobLocation || ''),
  postingDate: job.postingDate ? String(job.postingDate).slice(0, 10) : '',
  experienceLevel: job.experienceLevel || '',
  skillsInput: Array.isArray(job.skills) ? job.skills.join(', ') : '',
  companyLogo: job.companyLogo || '',
  employmentType: job.employmentType || 'Full-Time',
  category: job.category || '',
  description: job.description || ''
});

const normalizeHrProfile = (profile = {}) => ({
  companyName: profile.company_name || profile.companyName || '',
  companyWebsite: profile.company_website || profile.companyWebsite || '',
  companySize: profile.company_size || profile.companySize || '',
  industryType: profile.industry_type || profile.industryType || '',
  foundedYear: profile.founded_year || profile.foundedYear || '',
  companyType: profile.company_type || profile.companyType || '',
  location: profile.location || '',
  about: profile.about || '',
  logoUrl: profile.logo_url || profile.logoUrl || ''
});

export const getHrProfile = async () => {
  const result = await safeRequest({
    path: '/hr/profile',
    emptyData: {},
    extract: (payload) => payload?.profile || {}
  });

  return { ...result, data: normalizeHrProfile(result.data) };
};

export const updateHrProfile = async (formState) => {
  const payload = {
    companyName: formState.companyName,
    companyWebsite: formState.companyWebsite,
    companySize: formState.companySize,
    industryType: formState.industryType,
    foundedYear: formState.foundedYear,
    companyType: formState.companyType,
    location: formState.location,
    about: formState.about,
    logoUrl: formState.logoUrl
  };

  const updated = await strictRequest({
    path: '/hr/profile',
    options: { method: 'PUT', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload?.profile || payload
  });

  return normalizeHrProfile(updated);
};

export const getHrJobs = async () =>
  safeRequest({
    path: '/hr/jobs',
    emptyData: [],
    extract: (payload) => payload?.jobs || []
  });

export const getPricingPlans = async () =>
  safeRequest({
    path: '/pricing/plans',
    emptyData: [],
    extract: (payload) => payload?.plans || []
  });

export const getPricingPlanQuote = async ({ planSlug, quantity }) =>
  strictRequest({
    path: '/pricing/quote',
    options: {
      method: 'POST',
      body: JSON.stringify({ planSlug, quantity })
    },
    extract: (payload) => payload?.quote || payload
  });

export const checkoutPlanCredits = async ({
  planSlug,
  quantity,
  provider = 'manual',
  referenceId = '',
  note = '',
  paymentStatus = 'pending'
}) =>
  strictRequest({
    path: '/pricing/checkout',
    options: {
      method: 'POST',
      body: JSON.stringify({
        planSlug,
        quantity,
        provider,
        referenceId: referenceId || null,
        note: note || null,
        paymentStatus
      })
    },
    extract: (payload) => payload
  });

export const getHrPricingCredits = async () =>
  safeRequest({
    path: '/pricing/credits',
    emptyData: {
      credits: [],
      byPlan: {},
      totals: { total: 0, used: 0, remaining: 0 }
    },
    extract: (payload) => ({
      credits: payload?.credits || [],
      byPlan: payload?.byPlan || {},
      totals: payload?.totals || { total: 0, used: 0, remaining: 0 }
    })
  });

export const getHrPricingPurchases = async (filters = {}) => {
  const query = buildQueryString({
    status: filters.status || '',
    planSlug: filters.planSlug || ''
  });

  return safeRequest({
    path: `/pricing/purchases${query ? `?${query}` : ''}`,
    emptyData: [],
    extract: (payload) => payload?.purchases || []
  });
};

export const getRolePricingPlans = async (audienceRole = 'hr') =>
  safeRequest({
    path: `/pricing/role-plans?${buildQueryString({ audienceRole })}`,
    emptyData: [],
    extract: (payload) => payload?.plans || []
  });

export const getRolePricingPlanQuote = async ({ planSlug, quantity, couponCode = '' }) =>
  strictRequest({
    path: '/pricing/role-plans/quote',
    options: {
      method: 'POST',
      body: JSON.stringify({ planSlug, quantity, couponCode })
    },
    extract: (payload) => payload?.quote || payload
  });

export const checkoutRolePlan = async ({
  planSlug,
  quantity,
  couponCode = '',
  provider = 'razorpay',
  referenceId = '',
  note = '',
  paymentStatus = 'pending'
}) =>
  strictRequest({
    path: '/pricing/role-plans/checkout',
    options: {
      method: 'POST',
      body: JSON.stringify({
        planSlug,
        quantity,
        couponCode,
        provider,
        referenceId: referenceId || null,
        note: note || null,
        paymentStatus
      })
    },
    extract: (payload) => payload
  });

export const verifyRolePlanAutopay = async ({
  localSubscriptionId,
  razorpaySubscriptionId,
  razorpayPaymentId,
  razorpaySignature,
  audienceRole = 'hr'
}) =>
  strictRequest({
    path: '/payments/role-subscriptions/verify',
    options: {
      method: 'POST',
      body: JSON.stringify({
        localSubscriptionId,
        razorpaySubscriptionId,
        razorpayPaymentId,
        razorpaySignature,
        audienceRole
      })
    },
    extract: (payload) => payload?.subscription || payload
  });

export const getRolePlanPurchases = async (filters = {}) =>
  safeRequest({
    path: `/pricing/role-plan-purchases${buildQueryString({
      status: filters.status || '',
      audienceRole: filters.audienceRole || ''
    }) ? `?${buildQueryString({
      status: filters.status || '',
      audienceRole: filters.audienceRole || ''
    })}` : ''}`,
    emptyData: [],
    extract: (payload) => payload?.purchases || []
  });

export const getRolePlanSubscriptions = async (filters = {}) =>
  safeRequest({
    path: `/pricing/role-subscriptions${buildQueryString({
      status: filters.status || '',
      audienceRole: filters.audienceRole || ''
    }) ? `?${buildQueryString({
      status: filters.status || '',
      audienceRole: filters.audienceRole || ''
    })}` : ''}`,
    emptyData: [],
    extract: (payload) => payload?.subscriptions || []
  });

export const getCurrentRolePlanSubscription = async (audienceRole = 'hr') =>
  safeRequest({
    path: `/pricing/role-subscriptions/current?${buildQueryString({ audienceRole })}`,
    emptyData: null,
    extract: (payload) => payload?.subscription || null
  });

export const createHrJob = async (jobDraft) => {
  const payload = formatJobDraftForApi(jobDraft);
  return strictRequest({
    path: '/hr/jobs',
    options: { method: 'POST', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload?.job || payload
  });
};

export const updateHrJob = async (jobId, jobDraft) => {
  const payload = formatJobDraftForApi(jobDraft);
  return strictRequest({
    path: `/hr/jobs/${jobId}`,
    options: { method: 'PATCH', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload?.job || payload
  });
};

export const deleteHrJob = async (jobId) =>
  strictRequest({
    path: `/hr/jobs/${jobId}`,
    options: { method: 'DELETE' },
    extract: (responsePayload) => responsePayload
  });

export const closeHrJob = async (jobId) =>
  strictRequest({
    path: `/hr/jobs/${jobId}/close`,
    options: { method: 'PATCH', body: JSON.stringify({}) },
    extract: (responsePayload) => responsePayload?.job || responsePayload
  });

export const reopenHrJob = async (jobId) =>
  strictRequest({
    path: `/hr/jobs/${jobId}`,
    options: { method: 'PATCH', body: JSON.stringify({ status: 'open' }) },
    extract: (responsePayload) => responsePayload?.job || responsePayload
  });

export const payForHrJob = async (jobId, paymentPayload) =>
  strictRequest({
    path: `/hr/jobs/${jobId}/payment`,
    options: {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(paymentPayload.amount || 0),
        currency: paymentPayload.currency || 'INR',
        provider: paymentPayload.provider || 'manual',
        referenceId: paymentPayload.referenceId || null,
        note: paymentPayload.note || null
      })
    },
    extract: (responsePayload) => responsePayload?.payment || responsePayload
  });

export const getApplicantsForJob = async (jobId) =>
  safeRequest({
    path: `/hr/jobs/${jobId}/applicants`,
    emptyData: [],
    extract: (payload) => payload?.applicants || []
  });

export const updateApplicationStatus = async ({ applicationId, status, hrNotes = '' }) =>
  strictRequest({
    path: `/hr/applications/${applicationId}/status`,
    options: { method: 'PATCH', body: JSON.stringify({ status, hrNotes }) },
    extract: (responsePayload) => responsePayload?.application || responsePayload
  });

export const getHrAnalytics = async () =>
  safeRequest({
    path: '/hr/analytics',
    emptyData: {
      totalJobs: 0,
      openJobs: 0,
      closedJobs: 0,
      totalViews: 0,
      totalApplications: 0,
      pipeline: {
        applied: 0,
        shortlisted: 0,
        interviewed: 0,
        offered: 0,
        rejected: 0,
        hired: 0
      }
    },
    extract: (payload) => payload?.analytics || {}
  });

export const searchHrCandidates = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries({
    q: filters.search,
    skills: filters.skills,
    location: filters.location,
    experience: filters.experience
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, value);
    }
  });

  return safeRequest({
    path: `/hr/candidates/search${params.toString() ? `?${params.toString()}` : ''}`,
    emptyData: [],
    extract: (payload) => payload?.candidates || []
  });
};

export const getHrInterviews = async () =>
  safeRequest({
    path: '/hr/interviews',
    emptyData: [],
    extract: (payload) => payload?.interviews || []
  });

export const createHrInterview = async (payload) =>
  strictRequest({
    path: '/hr/interviews',
    options: {
      method: 'POST',
      body: JSON.stringify({
        applicationId: payload.applicationId,
        scheduledAt: payload.scheduledAt,
        title: payload.title,
        roundLabel: payload.roundLabel,
        durationMinutes: payload.durationMinutes,
        timezone: payload.timezone,
        mode: payload.mode,
        meetingLink: payload.meetingLink,
        location: payload.location,
        note: payload.note,
        panelMode: payload.panelMode,
        panelMembers: payload.panelMembers,
        calendarProvider: payload.calendarProvider,
        candidateConsentRequired: payload.candidateConsentRequired
      })
    },
    extract: (responsePayload) => responsePayload?.interview || responsePayload
  });

export const updateHrInterview = async (interviewId, payload) =>
  strictRequest({
    path: `/hr/interviews/${interviewId}`,
    options: {
      method: 'PATCH',
      body: JSON.stringify({
        status: payload.status,
        scheduledAt: payload.scheduledAt,
        title: payload.title,
        roundLabel: payload.roundLabel,
        durationMinutes: payload.durationMinutes,
        timezone: payload.timezone,
        mode: payload.mode,
        meetingLink: payload.meetingLink,
        location: payload.location,
        note: payload.note,
        panelMode: payload.panelMode,
        panelMembers: payload.panelMembers,
        calendarProvider: payload.calendarProvider,
        candidateConsentRequired: payload.candidateConsentRequired
      })
    },
    extract: (responsePayload) => responsePayload?.interview || responsePayload
  });

export const getHrNotifications = async () =>
  safeRequest({
    path: '/notifications',
    emptyData: [],
    extract: (payload) => payload?.notifications || []
  });

export const markHrNotificationRead = async (notificationId) =>
  strictRequest({
    path: `/notifications/${notificationId}/read`,
    options: { method: 'PATCH', body: JSON.stringify({}) },
    extract: (responsePayload) => responsePayload?.notification || responsePayload
  });

export const markAllHrNotificationsRead = async () =>
  strictRequest({
    path: '/notifications/read-all',
    options: { method: 'PATCH', body: JSON.stringify({}) },
    extract: (responsePayload) => responsePayload
  });

export const getHrAtsHistory = async (jobId = '') => {
  const params = new URLSearchParams();
  if (jobId) params.set('jobId', jobId);

  return safeRequest({
    path: `/ats/history${params.toString() ? `?${params.toString()}` : ''}`,
    emptyData: [],
    extract: (payload) => payload?.checks || []
  });
};

export const deleteHrAtsHistoryItem = async (checkId) =>
  strictRequest({
    path: `/ats/history/${checkId}`,
    options: { method: 'DELETE' },
    extract: (payload) => payload
  });

export const runHrAtsCheck = async ({ jobId, resumeText = '', resumeUrl = '' }) =>
  strictRequest({
    path: `/ats/check/${jobId}`,
    options: {
      method: 'POST',
      body: JSON.stringify({
        source: 'new_resume_upload',
        resumeText,
        resumeUrl
      })
    },
    extract: (payload) => ({
      atsCheckId: payload?.atsCheckId || null,
      result: payload?.result || null,
      saved: Boolean(payload?.saved),
      persistenceWarning: payload?.persistenceWarning || ''
    })
  });

export const runHrAtsPreview = async ({ resumeText = '', resumeUrl = '', targetText = '' }) =>
  strictRequest({
    path: '/ats/check-preview',
    options: {
      method: 'POST',
      body: JSON.stringify({
        source: 'new_resume_upload',
        resumeText,
        resumeUrl,
        targetText
      })
    },
    extract: (payload) => ({
      atsCheckId: payload?.atsCheckId || null,
      result: payload?.result || null,
      saved: Boolean(payload?.saved),
      persistenceWarning: payload?.persistenceWarning || ''
    })
  });

export const bulkUpdateApplications = async ({ jobId, applicationIds, action }) =>
  safeRequest({
    path: `/hr/jobs/${jobId}/applicants/bulk`,
    options: { method: 'POST', body: JSON.stringify({ applicationIds, action }) },
    emptyData: { updatedCount: 0 },
    extract: (payload) => ({ updatedCount: payload?.updatedCount || 0 })
  });

export const searchHrCandidatesV2 = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries({
    q: filters.search,
    skills: filters.skills,
    location: filters.location,
    experience: filters.experience,
    minCgpa: filters.minCgpa,
    degree: filters.degree,
    branch: filters.branch,
    college: filters.college,
    batchYear: filters.batchYear,
    available: filters.availableOnly ? 'true' : undefined,
    verified: filters.verifiedOnly ? 'true' : undefined,
    page: filters.page,
    limit: filters.limit
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') params.set(key, value);
  });

  return safeRequest({
    path: `/hr/candidates/search${params.toString() ? `?${params.toString()}` : ''}`,
    emptyData: {
      access: { hasPaidAccess: false, requiresUpgrade: true, activePlanSlug: 'free', activePlanName: 'Free' },
      summary: { total: 0, blurred: 0, connected: 0, availableNow: 0, verified: 0 },
      pagination: { page: 1, limit: 6, total: 0, totalPages: 1, count: 0 },
      candidates: []
    },
    extract: (payload) => ({
      access: payload?.access || { hasPaidAccess: false, requiresUpgrade: true, activePlanSlug: 'free', activePlanName: 'Free' },
      summary: payload?.summary || { total: 0, blurred: 0, connected: 0, availableNow: 0, verified: 0 },
      pagination: payload?.pagination || { page: 1, limit: 6, total: 0, totalPages: 1, count: 0 },
      candidates: payload?.candidates || []
    })
  });
};

export const sendCandidateInterest = async (studentId, { message = '', templateId = '', campaignLabel = '' } = {}) =>
  strictRequest({
    path: `/hr/candidates/${studentId}/interest`,
    options: { method: 'POST', body: JSON.stringify({ message, templateId, campaignLabel }) },
    extract: (payload) => payload?.interest || payload
  });

export const sendBulkCandidateInterest = async (studentIds, { message = '', templateId = '', campaignLabel = '' } = {}) =>
  strictRequest({
    path: '/hr/candidates/bulk-interest',
    options: { method: 'POST', body: JSON.stringify({ studentIds, message, templateId, campaignLabel }) },
    extract: (payload) => ({ sentCount: payload?.sentCount || 0 })
  });

export const getHrCandidateMessageTemplates = async () =>
  safeRequest({
    path: '/hr/candidates/message-templates',
    emptyData: {
      access: { hasPaidAccess: false, requiresUpgrade: true, activePlanSlug: 'free', activePlanName: 'Free' },
      templates: []
    },
    extract: (payload) => ({
      access: payload?.access || { hasPaidAccess: false, requiresUpgrade: true, activePlanSlug: 'free', activePlanName: 'Free' },
      templates: payload?.templates || []
    })
  });

export const createHrCandidateMessageTemplate = async ({ name, message, isDefault = false }) =>
  strictRequest({
    path: '/hr/candidates/message-templates',
    options: { method: 'POST', body: JSON.stringify({ name, message, isDefault }) },
    extract: (payload) => payload?.template || payload
  });

export const updateHrCandidateMessageTemplate = async (templateId, { name, message, isDefault = false }) =>
  strictRequest({
    path: `/hr/candidates/message-templates/${templateId}`,
    options: { method: 'PATCH', body: JSON.stringify({ name, message, isDefault }) },
    extract: (payload) => payload?.template || payload
  });

export const deleteHrCandidateMessageTemplate = async (templateId) =>
  strictRequest({
    path: `/hr/candidates/message-templates/${templateId}`,
    options: { method: 'DELETE' },
    extract: (payload) => payload
  });

export const getHrCandidateInterests = async () =>
  safeRequest({
    path: '/hr/candidates/interests',
    emptyData: {
      access: { hasPaidAccess: false, requiresUpgrade: true, activePlanSlug: 'free', activePlanName: 'Free' },
      summary: { total: 0, pending: 0, accepted: 0, declined: 0 },
      interests: []
    },
    extract: (payload) => ({
      access: payload?.access || { hasPaidAccess: false, requiresUpgrade: true, activePlanSlug: 'free', activePlanName: 'Free' },
      summary: payload?.summary || { total: 0, pending: 0, accepted: 0, declined: 0 },
      interests: payload?.interests || []
    })
  });

export const getHrShortlisted = async () =>
  safeRequest({
    path: '/hr/shortlisted',
    emptyData: {
      access: { hasPaidAccess: false, requiresUpgrade: true, activePlanSlug: 'free', activePlanName: 'Free' },
      summary: { total: 0, connected: 0 },
      shortlisted: []
    },
    extract: (payload) => ({
      access: payload?.access || { hasPaidAccess: false, requiresUpgrade: true, activePlanSlug: 'free', activePlanName: 'Free' },
      summary: payload?.summary || { total: 0, connected: 0 },
      shortlisted: payload?.shortlisted || []
    })
  });

export const addToShortlist = async (studentId, { tags = [], notes = '' } = {}) =>
  strictRequest({
    path: '/hr/shortlisted',
    options: { method: 'POST', body: JSON.stringify({ studentId, tags, notes }) },
    extract: (payload) => payload?.shortlisted || payload
  });

export const updateShortlistEntry = async (studentId, { tags, notes } = {}) =>
  strictRequest({
    path: `/hr/shortlisted/${studentId}`,
    options: { method: 'PATCH', body: JSON.stringify({ tags, notes }) },
    extract: (payload) => payload?.shortlisted || payload
  });

export const removeFromShortlist = async (studentId) =>
  strictRequest({
    path: `/hr/shortlisted/${studentId}`,
    options: { method: 'DELETE' },
    extract: (payload) => payload
  });

export const getEmptyJobDraft = () => clone(defaultJobDraft);
export const getJobDraftFromJob = (job) => hydrateJobDraftFromJob(job);
export const getSkillsArrayFromInput = (value = '') => parseSkillsInput(value);

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

// ── HR Campus Drives ────────────────────────────────────────────────────────

export const fetchHrCampusDrives = async () =>
  safeRequest({
    path: '/hr/campus-drives',
    emptyData: [],
    extract: (payload) => payload?.drives || []
  });

export const fetchHrCampusDriveApplications = async (driveId) =>
  strictRequest({
    path: `/hr/campus-drives/${driveId}/applications`,
    extract: (payload) => ({
      drive: payload?.drive || null,
      applications: payload?.applications || [],
      summary: payload?.summary || { total: 0 }
    })
  });

export const updateHrCampusDriveApplication = async (driveId, applicationId, { status, currentRound, notes, eliminatedInRound } = {}) =>
  strictRequest({
    path: `/hr/campus-drives/${driveId}/applications/${applicationId}`,
    options: {
      method: 'PATCH',
      body: JSON.stringify({ status, currentRound, notes, eliminatedInRound })
    },
    extract: (payload) => payload?.application || payload
  });

export const fetchHrCampusConnections = async () =>
  safeRequest({
    path: '/hr/campus-connections',
    emptyData: [],
    extract: (payload) => payload?.connections || []
  });

export const fetchHrCampusConnectionDirectory = async () =>
  safeRequest({
    path: '/hr/campus-connections/directory',
    emptyData: { colleges: [], summary: null },
    extract: (payload) => ({
      colleges: payload?.colleges || [],
      summary: payload?.summary || null
    })
  });

export const createHrCampusConnection = async ({ collegeId, message }) =>
  strictRequest({
    path: '/hr/campus-connections',
    options: {
      method: 'POST',
      body: JSON.stringify({ collegeId, message })
    },
    extract: (payload) => payload?.connection || payload
  });

export const respondHrCampusConnection = async (connectionId, status) =>
  strictRequest({
    path: `/hr/campus-connections/${connectionId}`,
    options: {
      method: 'PATCH',
      body: JSON.stringify({ status })
    },
    extract: (payload) => payload?.connection || payload
  });
