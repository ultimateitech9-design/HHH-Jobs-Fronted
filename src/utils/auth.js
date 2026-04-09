const TOKEN_KEY = 'job_portal_token';
const USER_KEY = 'job_portal_user';
const PENDING_VERIFICATION_KEY = 'job_portal_pending_verification';

const DELETED_USERS_KEY = 'hhh_jobs_deleted_user_ids';
const DASHBOARD_REDIRECT_RULES = [
  { legacy: '/student', canonical: '/portal/student', defaultPath: '/portal/student/dashboard' },
  { legacy: '/hr', canonical: '/portal/hr', defaultPath: '/portal/hr/dashboard' },
  { legacy: '/admin', canonical: '/portal/admin', defaultPath: '/portal/admin/dashboard' },
  { legacy: '/super-admin', canonical: '/portal/super-admin', defaultPath: '/portal/super-admin/dashboard' },
  { legacy: '/dataentry', canonical: '/portal/dataentry', defaultPath: '/portal/dataentry/dashboard' },
  { legacy: '/support', canonical: '/portal/support', defaultPath: '/portal/support/dashboard' },
  { legacy: '/sales', canonical: '/portal/sales', defaultPath: '/portal/sales/overview' },
  { legacy: '/accounts', canonical: '/portal/accounts', defaultPath: '/portal/accounts/overview' },
  { legacy: '/platform', canonical: '/portal/platform', defaultPath: '/portal/platform/dashboard' },
  { legacy: '/audit', canonical: '/portal/audit', defaultPath: '/portal/audit/dashboard' }
];

const notifyAuthChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-changed'));
  }
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

const readStoredJson = (key) => {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    localStorage.removeItem(key);
    return null;
  }
};

export const isEmailVerifiedUser = (user) => Boolean(user)
  && user.isEmailVerified !== false
  && user.is_email_verified !== false;

export const getStoredUser = () => {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    const deletedRaw = localStorage.getItem(DELETED_USERS_KEY);
    const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];

    if (Array.isArray(deletedIds) && deletedIds.includes(user?.id)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      notifyAuthChange();
      return null;
    }

    return user;
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notifyAuthChange();
    return null;
  }
};

export const getCurrentUser = () => {
  const user = getStoredUser();
  return isEmailVerifiedUser(user) ? user : null;
};

export const getPendingVerificationSession = () => {
  const pendingSession = readStoredJson(PENDING_VERIFICATION_KEY);
  if (!pendingSession || typeof pendingSession !== 'object') return null;

  const email = String(pendingSession.email || '').trim().toLowerCase();
  if (!email) {
    localStorage.removeItem(PENDING_VERIFICATION_KEY);
    return null;
  }

  return {
    email,
    otp: String(pendingSession.otp || '').replace(/\D/g, '').slice(0, 6),
    emailWarning: String(pendingSession.emailWarning || '').trim()
  };
};

export const beginPendingVerificationSession = ({ email = '', otp = '', emailWarning = '' } = {}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  if (normalizedEmail) {
    localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify({
      email: normalizedEmail,
      otp: String(otp || '').replace(/\D/g, '').slice(0, 6),
      emailWarning: String(emailWarning || '').trim()
    }));
  } else {
    localStorage.removeItem(PENDING_VERIFICATION_KEY);
  }

  notifyAuthChange();
};

export const clearPendingVerificationSession = () => {
  localStorage.removeItem(PENDING_VERIFICATION_KEY);
  notifyAuthChange();
};

export const setAuthSession = (token, user) => {
  localStorage.removeItem(PENDING_VERIFICATION_KEY);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChange();
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PENDING_VERIFICATION_KEY);
  notifyAuthChange();
};

export const isAuthenticated = () => Boolean(getToken() && getCurrentUser());

export const normalizeRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!normalized) return null;
  if (normalized === 'data_entry') return 'dataentry';
  if (normalized === 'superadmin') return 'super_admin';
  return normalized;
};

export const getUserRole = () => normalizeRole(getCurrentUser()?.role);

export const getDashboardPathByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'super_admin') return '/portal/super-admin/dashboard';
  if (normalizedRole === 'admin') return '/portal/admin/dashboard';
  if (normalizedRole === 'hr') return '/portal/hr/dashboard';
  if (normalizedRole === 'platform') return '/portal/platform/dashboard';
  if (normalizedRole === 'audit') return '/portal/audit/dashboard';
  if (normalizedRole === 'dataentry') return '/portal/dataentry/dashboard';
  if (normalizedRole === 'support') return '/portal/support/dashboard';
  if (normalizedRole === 'accounts') return '/portal/accounts/overview';
  if (normalizedRole === 'sales') return '/portal/sales/overview';
  if (normalizedRole === 'retired_employee') return '/portal/student/dashboard';
  return '/portal/student/dashboard';
};

export const getNotificationPathByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'student' || normalizedRole === 'retired_employee') return '/portal/student/dashboard#student-alerts-workspace';
  if (normalizedRole === 'hr') return '/portal/hr/notifications';
  if (normalizedRole === 'dataentry') return '/portal/dataentry/notifications';
  return '';
};

export const getDashboardPath = () => getDashboardPathByRole(getUserRole());

const splitRedirectPath = (value = '') => {
  const rawValue = String(value || '').trim();
  const queryIndex = rawValue.search(/[?#]/);

  if (queryIndex === -1) {
    return { base: rawValue, suffix: '' };
  }

  return {
    base: rawValue.slice(0, queryIndex),
    suffix: rawValue.slice(queryIndex)
  };
};

export const normalizeRedirectPath = (path, fallbackRole = '') => {
  const rawPath = String(path || '').trim();
  if (!rawPath) {
    return fallbackRole ? getDashboardPathByRole(fallbackRole) : '';
  }

  if (rawPath.startsWith('/portal/')) {
    return rawPath;
  }

  const { base, suffix } = splitRedirectPath(rawPath);
  const rule = DASHBOARD_REDIRECT_RULES.find(({ legacy }) => base === legacy || base.startsWith(`${legacy}/`));

  if (!rule) {
    return rawPath;
  }

  if (base === rule.legacy) {
    return `${rule.defaultPath}${suffix}`;
  }

  return `${rule.canonical}${base.slice(rule.legacy.length)}${suffix}`;
};

export const canAccessRole = (currentRole, allowedRole) => {
  const normalizedCurrentRole = normalizeRole(currentRole);
  const normalizedAllowedRole = normalizeRole(allowedRole);
  if (!normalizedCurrentRole || !normalizedAllowedRole) return false;
  return normalizedCurrentRole === normalizedAllowedRole;
};

export const hasRole = (allowedRoles = []) => {
  const currentRole = getUserRole();
  return allowedRoles.some((allowedRole) => canAccessRole(currentRole, allowedRole));
};
