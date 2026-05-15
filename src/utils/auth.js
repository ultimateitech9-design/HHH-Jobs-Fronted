const TOKEN_KEY = 'job_portal_token';
const USER_KEY = 'job_portal_user';
const PENDING_VERIFICATION_KEY = 'job_portal_pending_verification';

const DELETED_USERS_KEY = 'hhh_jobs_deleted_user_ids';
const DASHBOARD_REDIRECT_RULES = [
  { legacy: '/student', canonical: '/portal/student', defaultPath: '/portal/student/companies' },
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
const PORTAL_ROLE_METADATA = Object.freeze({
  student: Object.freeze({
    label: 'Student Dashboard',
    dashboardPath: '/portal/student/companies',
    profilePath: '/portal/student/profile',
    notificationPath: '/portal/student/notifications'
  }),
  retired_employee: Object.freeze({
    label: 'Retired Professional Dashboard',
    dashboardPath: '/portal/student/companies',
    profilePath: '/portal/student/profile',
    notificationPath: '/portal/student/notifications'
  }),
  hr: Object.freeze({
    label: 'HR Dashboard',
    dashboardPath: '/portal/hr/dashboard',
    profilePath: '/portal/hr/profile',
    notificationPath: '/portal/hr/notifications'
  }),
  admin: Object.freeze({
    label: 'Admin Console',
    dashboardPath: '/portal/admin/dashboard',
    profilePath: '/portal/admin/dashboard',
    notificationPath: ''
  }),
  super_admin: Object.freeze({
    label: 'Super Admin',
    dashboardPath: '/portal/super-admin/dashboard',
    profilePath: '/portal/super-admin/dashboard',
    notificationPath: ''
  }),
  platform: Object.freeze({
    label: 'Platform Console',
    dashboardPath: '/portal/platform/dashboard',
    profilePath: '/portal/platform/dashboard',
    notificationPath: ''
  }),
  audit: Object.freeze({
    label: 'Audit Console',
    dashboardPath: '/portal/audit/dashboard',
    profilePath: '/portal/audit/dashboard',
    notificationPath: ''
  }),
  support: Object.freeze({
    label: 'Support Center',
    dashboardPath: '/portal/support/dashboard',
    profilePath: '/portal/support/dashboard',
    notificationPath: ''
  }),
  sales: Object.freeze({
    label: 'Sales Dashboard',
    dashboardPath: '/portal/sales/overview',
    profilePath: '/portal/sales/overview',
    notificationPath: ''
  }),
  accounts: Object.freeze({
    label: 'Accounts Dashboard',
    dashboardPath: '/portal/accounts/overview',
    profilePath: '/portal/accounts/overview',
    notificationPath: ''
  }),
  dataentry: Object.freeze({
    label: 'Data Entry Workspace',
    dashboardPath: '/portal/dataentry/dashboard',
    profilePath: '/portal/dataentry/profile',
    notificationPath: '/portal/dataentry/notifications'
  }),
  campus_connect: Object.freeze({
    label: 'Campus Connect',
    dashboardPath: '/portal/campus-connect/dashboard',
    profilePath: '/portal/campus-connect/profile',
    notificationPath: '/portal/campus-connect/notifications'
  })
});
const ADMIN_PORTAL_SWITCH_ROLES = Object.freeze([
  'admin',
  'super_admin',
  'hr',
  'student',
  'platform',
  'audit',
  'support',
  'sales',
  'accounts',
  'dataentry',
  'campus_connect'
]);
const ADMIN_ACCESS_ROLES = new Set(['admin', 'super_admin']);

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
    emailWarning: String(pendingSession.emailWarning || '').trim(),
    allowedLoginRoles: Array.isArray(pendingSession.allowedLoginRoles)
      ? pendingSession.allowedLoginRoles
        .map((role) => normalizeRole(role))
        .filter(Boolean)
      : []
  };
};

export const beginPendingVerificationSession = ({ email = '', emailWarning = '', allowedLoginRoles = [] } = {}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedAllowedLoginRoles = Array.isArray(allowedLoginRoles)
    ? allowedLoginRoles
      .map((role) => normalizeRole(role))
      .filter(Boolean)
    : [];

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  if (normalizedEmail) {
    localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify({
      email: normalizedEmail,
      emailWarning: String(emailWarning || '').trim(),
      allowedLoginRoles: normalizedAllowedLoginRoles
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

export const getRoleLabel = (role) => {
  const normalizedRole = normalizeRole(role);
  return PORTAL_ROLE_METADATA[normalizedRole]?.label || String(role || '').trim() || 'Dashboard';
};

export const getProfilePathByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return PORTAL_ROLE_METADATA[normalizedRole]?.profilePath || getDashboardPathByRole(normalizedRole);
};

export const isAdminAccessRole = (role) => ADMIN_ACCESS_ROLES.has(normalizeRole(role));

export const getPortalRoleForKey = (portalKey = '') => {
  const normalizedPortalRole = normalizeRole(portalKey);
  if (normalizedPortalRole === 'retired') return 'retired_employee';
  return normalizedPortalRole;
};

export const resolvePortalViewRole = ({ userRole, portalKey } = {}) => {
  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole) return null;

  if (isAdminAccessRole(normalizedUserRole)) {
    return getPortalRoleForKey(portalKey) || normalizedUserRole;
  }

  return normalizedUserRole;
};

export const getPortalSwitchOptions = (userRole, activeRole = '') => {
  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole || !isAdminAccessRole(normalizedUserRole)) return [];

  const normalizedActiveRole = normalizeRole(activeRole);
  return ADMIN_PORTAL_SWITCH_ROLES
    .map((role) => ({
      role,
      label: getRoleLabel(role),
      path: getDashboardPathByRole(role),
      isActive: role === normalizedActiveRole
    }));
};

export const getDashboardPathByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return PORTAL_ROLE_METADATA[normalizedRole]?.dashboardPath || '/portal/student/companies';
};

export const getNotificationPathByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return PORTAL_ROLE_METADATA[normalizedRole]?.notificationPath || '';
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

export const isRedirectPathAllowedForRole = (path, role) => {
  if (!path) return true;

  if (isAdminAccessRole(role)) {
    return true;
  }

  const normalizedRedirect = normalizeRedirectPath(path, role);
  if (!normalizedRedirect.startsWith('/portal/')) {
    return true;
  }

  const allowedPortalPrefix = getDashboardPathByRole(role)
    .replace(/\/(dashboard|overview)$/, '');

  if (!allowedPortalPrefix) {
    return true;
  }

  return normalizedRedirect.startsWith(allowedPortalPrefix);
};

export const canAccessRole = (currentRole, allowedRole) => {
  const normalizedCurrentRole = normalizeRole(currentRole);
  const normalizedAllowedRole = normalizeRole(allowedRole);
  if (!normalizedCurrentRole || !normalizedAllowedRole) return false;
  return normalizedCurrentRole === normalizedAllowedRole;
};

const normalizeAllowedRoles = (allowedRoles = []) => {
  if (Array.isArray(allowedRoles)) return allowedRoles;
  return allowedRoles ? [allowedRoles] : [];
};

export const hasRole = (allowedRoles = [], currentRoleOverride) => {
  const normalizedAllowedRoles = normalizeAllowedRoles(allowedRoles);
  const currentRole = getUserRole();
  const effectiveRole = currentRoleOverride ?? currentRole;
  return normalizedAllowedRoles.some((allowedRole) => canAccessRole(effectiveRole, allowedRole));
};
