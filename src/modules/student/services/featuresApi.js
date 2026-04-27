import { apiFetch } from '../../../utils/api';

const parseJson = async (response) => {
  try { return await response.json(); } catch { return null; }
};

const strictRequest = async ({ path, options, extract = (p) => p }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);
  if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status})`);
  return extract(payload || {});
};

const safeRequest = async ({ path, options, emptyData, extract = (p) => p }) => {
  try {
    const data = await strictRequest({ path, options, extract });
    return { data, error: '' };
  } catch (error) {
    return { data: typeof emptyData === 'function' ? emptyData() : (emptyData ?? null), error: error.message };
  }
};

// ── Resume Builder ───────────────────────────────────────────────────────────
export const getResumeTemplates = () => safeRequest({ path: '/features/resume-builder/templates', emptyData: [], extract: (p) => p?.templates || [] });
export const getMyResumes = () => safeRequest({ path: '/features/resume-builder/my-resumes', emptyData: [], extract: (p) => p?.resumes || [] });
export const saveResume = ({ templateId, resumeData, title }) => strictRequest({ path: '/features/resume-builder/save', options: { method: 'POST', body: JSON.stringify({ templateId, resumeData, title }) }, extract: (p) => p?.resume || p });
export const deleteResume = (resumeId) => strictRequest({ path: `/features/resume-builder/${resumeId}`, options: { method: 'DELETE' } });
export const previewResume = async ({ templateId, resumeData }) => {
  const response = await apiFetch('/features/resume-builder/preview', { method: 'POST', body: JSON.stringify({ templateId, resumeData }) });
  return response.text();
};

// ── Mock Interviews ──────────────────────────────────────────────────────────
export const getMockInterviewCategories = () => safeRequest({ path: '/features/mock-interview/categories', emptyData: [], extract: (p) => p?.categories || [] });
export const generateMockQuestions = ({ category, role, experience, skills, count }) => strictRequest({ path: '/features/mock-interview/generate', options: { method: 'POST', body: JSON.stringify({ category, role, experience, skills, count }) }, extract: (p) => p?.questions || [] });
export const evaluateMockAnswer = ({ question, answer, role, category }) => strictRequest({ path: '/features/mock-interview/evaluate', options: { method: 'POST', body: JSON.stringify({ question, answer, role, category }) }, extract: (p) => p?.feedback || {} });
export const saveMockSession = (sessionData) => strictRequest({ path: '/features/mock-interview/save-session', options: { method: 'POST', body: JSON.stringify(sessionData) }, extract: (p) => p?.session || p });
export const getMockSessions = () => safeRequest({ path: '/features/mock-interview/sessions', emptyData: [], extract: (p) => p?.sessions || [] });
export const getMockSessionById = (sessionId) => safeRequest({ path: `/features/mock-interview/sessions/${sessionId}`, emptyData: null, extract: (p) => p?.session || null });

// ── Skill Assessments ────────────────────────────────────────────────────────
export const getAssessmentCategories = () => safeRequest({ path: '/features/assessments/categories', emptyData: [], extract: (p) => p?.categories || [] });
export const getAssessmentQuestions = (categoryId, count = 5) => safeRequest({ path: `/features/assessments/${categoryId}/questions?count=${count}`, emptyData: [], extract: (p) => p?.questions || [] });
export const submitAssessment = (categoryId, { answers, timeTaken }) => strictRequest({ path: `/features/assessments/${categoryId}/submit`, options: { method: 'POST', body: JSON.stringify({ answers, timeTaken }) }, extract: (p) => p });
export const getAssessmentAttempts = () => safeRequest({ path: '/features/assessments/attempts', emptyData: [], extract: (p) => p?.attempts || [] });
export const getAssessmentBadges = () => safeRequest({ path: '/features/assessments/badges', emptyData: [], extract: (p) => p?.badges || [] });

// ── Salary Insights ──────────────────────────────────────────────────────────
export const getSalaryRoles = () => safeRequest({ path: '/features/salary/roles', emptyData: [], extract: (p) => p?.roles || [] });
export const getSalaryLocations = () => safeRequest({ path: '/features/salary/locations', emptyData: [], extract: (p) => p?.locations || [] });
export const getSalaryInsight = ({ role, location, experience }) => safeRequest({ path: `/features/salary/insight?role=${encodeURIComponent(role)}&location=${encodeURIComponent(location || '')}&experience=${experience || 0}`, emptyData: null, extract: (p) => p?.insight || null });
export const compareSalaries = ({ roles, location, experience }) => strictRequest({ path: '/features/salary/compare', options: { method: 'POST', body: JSON.stringify({ roles, location, experience }) }, extract: (p) => p?.comparison || [] });

// ── Video Resume ─────────────────────────────────────────────────────────────
export const uploadVideoResume = async (file) => {
  const formData = new FormData();
  formData.append('video', file);
  return strictRequest({ path: '/features/video-resume/upload', options: { method: 'POST', body: formData }, extract: (p) => p });
};
export const getVideoResume = () => safeRequest({ path: '/features/video-resume', emptyData: { url: null }, extract: (p) => p });
export const deleteVideoResume = () => strictRequest({ path: '/features/video-resume', options: { method: 'DELETE' } });

// ── Employer Reviews ─────────────────────────────────────────────────────────
export const submitEmployerReview = (review) => strictRequest({ path: '/features/reviews/submit', options: { method: 'POST', body: JSON.stringify(review) }, extract: (p) => p?.review || p });
export const getCompanyReviewsList = ({ companyName, page = 1 }) => safeRequest({ path: `/features/reviews/company?companyName=${encodeURIComponent(companyName)}&page=${page}`, emptyData: [], extract: (p) => p?.reviews || [] });
export const getCompanyRatingSummary = (companyName) => safeRequest({ path: `/features/reviews/company/summary?companyName=${encodeURIComponent(companyName)}`, emptyData: { averageRating: 0, totalReviews: 0, distribution: {} }, extract: (p) => p?.summary || {} });
export const getMyReviews = () => safeRequest({ path: '/features/reviews/my-reviews', emptyData: [], extract: (p) => p?.reviews || [] });

// ── Referral Program ─────────────────────────────────────────────────────────
export const getReferralDashboard = () => safeRequest({ path: '/features/referral/dashboard', emptyData: { referralCode: '', stats: {}, recentReferrals: [], rewardStructure: {} }, extract: (p) => p });
export const getReferralCode = () => safeRequest({ path: '/features/referral/code', emptyData: { referralCode: '' }, extract: (p) => p });
export const trackReferral = (data) => strictRequest({ path: '/features/referral/track', options: { method: 'POST', body: JSON.stringify(data) }, extract: (p) => p?.result });
export const getReferralLeaderboard = () => safeRequest({ path: '/features/referral/leaderboard', emptyData: [], extract: (p) => p?.leaderboard || [] });

// ── Blog ─────────────────────────────────────────────────────────────────────
export const getBlogCategories = () => safeRequest({ path: '/features/blog/categories', emptyData: [], extract: (p) => p?.categories || [] });
export const getBlogArticles = ({ category, tag, page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (tag) params.set('tag', tag);
  params.set('page', page);
  return safeRequest({ path: `/features/blog/articles?${params}`, emptyData: [], extract: (p) => p?.articles || [] });
};
export const getBlogArticle = (slug) => safeRequest({ path: `/features/blog/articles/${slug}`, emptyData: null, extract: (p) => p?.article || null });

// ── Push Notifications ───────────────────────────────────────────────────────
export const getVapidPublicKey = () => safeRequest({ path: '/features/push/vapid-key', emptyData: '', extract: (p) => p?.publicKey || '' });
export const subscribePush = (subscription) => strictRequest({ path: '/features/push/subscribe', options: { method: 'POST', body: JSON.stringify(subscription) } });
export const unsubscribePush = (endpoint) => strictRequest({ path: '/features/push/unsubscribe', options: { method: 'POST', body: JSON.stringify({ endpoint }) } });

// ── WhatsApp ─────────────────────────────────────────────────────────────────
export const getWhatsAppPreference = () => safeRequest({ path: '/features/whatsapp/preference', emptyData: null, extract: (p) => p?.preference || null });
export const saveWhatsAppPreference = ({ phoneNumber, isEnabled }) => strictRequest({ path: '/features/whatsapp/preference', options: { method: 'POST', body: JSON.stringify({ phoneNumber, isEnabled }) }, extract: (p) => p?.preference || p });

// ── Razorpay ─────────────────────────────────────────────────────────────────
export const getRazorpayConfig = () => safeRequest({ path: '/payments/config', emptyData: { configured: false }, extract: (p) => p });
export const createRazorpayOrder = (data) => strictRequest({ path: '/payments/create-order', options: { method: 'POST', body: JSON.stringify(data) }, extract: (p) => p });
export const verifyRazorpayPayment = (data) => strictRequest({ path: '/payments/verify-payment', options: { method: 'POST', body: JSON.stringify(data) }, extract: (p) => p });
