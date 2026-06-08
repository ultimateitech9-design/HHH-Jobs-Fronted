import { apiFetch, areDemoFallbacksEnabled } from '../../../utils/api';
import {
  createManagedAccount,
  deleteManagedAccount,
  filterDeletedUsers,
  findManagedAccountByEmail,
  getManagedAccounts,
  getManagementDisplayId,
  isManagedAccountId,
  markUserDeleted
} from '../../../utils/managedUsers';
import { adminDummyData } from '../data/adminDummyData';
import { mapApiUserToUi } from './mappers';

export const SUPER_ADMIN_BASE = '/super-admin';
const USERS_BATCH_SIZE = 100;
const SUPPORT_CONTEXT_CACHE_KEY = 'hhh_super_admin_support_context_seed';

export const clone = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

const resolveFallbackData = (fallbackData) => (
  typeof fallbackData === 'function' ? fallbackData() : fallbackData
);

const isEmptyResponseData = (value) => {
  if (Array.isArray(value)) return value.length === 0;
  if (!value || typeof value !== 'object') return false;

  const entries = Object.values(value);
  if (entries.length === 0) return true;

  return entries.every((item) => {
    if (Array.isArray(item)) return item.length === 0;
    if (item && typeof item === 'object') return isEmptyResponseData(item);
    if (typeof item === 'number') return item === 0;
    return item === null || item === undefined || item === '';
  });
};

export const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

export const safeRequest = async ({ path, options, emptyData, fallbackData, extract = (payload) => payload }) => {
  const allowDemoFallback = areDemoFallbacksEnabled();

  try {
    const data = await strictRequest({ path, options, extract });
    if (allowDemoFallback && fallbackData !== undefined && isEmptyResponseData(data)) {
      return {
        data: clone(resolveFallbackData(fallbackData)),
        error: '',
        isDemo: true
      };
    }
    return { data, error: '', isDemo: false };
  } catch (error) {
    const resolvedFallback = allowDemoFallback && fallbackData !== undefined
      ? resolveFallbackData(fallbackData)
      : undefined;
    return {
      data: clone(resolvedFallback !== undefined ? resolvedFallback : emptyData),
      error: error.message || 'Request failed.',
      isDemo: resolvedFallback !== undefined
    };
  }
};

const filterUsers = (users, filters = {}) => {
  return users.filter((user) => {
    const search = String(filters.search || '').toLowerCase();
    const matchesSearch = !search || [user.name, user.email, user.company, user.id, user.displayId].some((value) => String(value || '').toLowerCase().includes(search));
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;
    return matchesSearch && matchesRole && matchesStatus;
  });
};

const mapManagedAccountToUser = (account) => ({
  id: account.id,
  displayId: getManagementDisplayId(account.id, account.role),
  name: account.name,
  email: account.email,
  role: account.role,
  company: account.department || 'HHH Jobs',
  assignedStates: Array.isArray(account.assignedStates) ? account.assignedStates : [],
  salesCode: account.salesCode || '',
  status: account.status || 'active',
  verified: true,
  lastActiveAt: account.last_login_at || null,
  createdAt: account.created_at || new Date().toISOString()
});

const buildVisibleUsers = (filters = {}) => {
  const mergedUsers = [
    ...adminDummyData.users,
    ...getManagedAccounts().map(mapManagedAccountToUser)
  ];

  return filterDeletedUsers(filterUsers(mergedUsers, filters));
};

const fetchUsersPage = async (page) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(USERS_BATCH_SIZE)
  });

  return strictRequest({
    path: `${SUPER_ADMIN_BASE}/users?${params.toString()}`
  });
};

const fetchAllApiUsers = async () => {
  const firstPayload = await fetchUsersPage(1);
  const firstBatch = Array.isArray(firstPayload?.users)
    ? firstPayload.users.map(mapApiUserToUi)
    : [];
  const total = Number(firstPayload?.total || firstBatch.length || 0);

  if (!firstBatch.length || total <= firstBatch.length) {
    return firstBatch;
  }

  const totalPages = Math.ceil(total / USERS_BATCH_SIZE);
  const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2);
  const remainingResults = await Promise.allSettled(remainingPages.map((page) => fetchUsersPage(page)));

  const users = [...firstBatch];
  remainingResults.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    const batch = Array.isArray(result.value?.users) ? result.value.users.map(mapApiUserToUi) : [];
    users.push(...batch);
  });

  return users;
};

export const getUsers = async (filters = {}) => {
  try {
    const apiUsers = await fetchAllApiUsers();
    const managedUsers = areDemoFallbacksEnabled()
      ? getManagedAccounts().map(mapManagedAccountToUser)
      : [];
    if (apiUsers.length === 0 && managedUsers.length === 0) {
      return {
        data: areDemoFallbacksEnabled() ? buildVisibleUsers(filters) : [],
        error: '',
        isDemo: areDemoFallbacksEnabled()
      };
    }
    return {
      data: filterDeletedUsers(filterUsers([...apiUsers, ...managedUsers], filters)),
      error: '',
      isDemo: false
    };
  } catch (error) {
    if (!areDemoFallbacksEnabled()) {
      return {
        data: [],
        error: error.message || 'Request failed.',
        isDemo: false
      };
    }

    return {
      data: buildVisibleUsers(filters),
      error: error.message || 'Request failed.',
      isDemo: true
    };
  }
};

export const getCommandSearchResults = async (filters = {}) => {
  const params = new URLSearchParams();
  const search = String(filters.q || filters.search || '').trim();

  if (search) params.set('q', search);
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);
  if (filters.limit) params.set('limit', String(filters.limit));

  return safeRequest({
    path: `${SUPER_ADMIN_BASE}/command-search?${params.toString()}`,
    emptyData: [],
    extract: (payload) => payload?.results || []
  });
};

export const getUserSupportContext = async (userId) =>
  strictRequest({
    path: `${SUPER_ADMIN_BASE}/users/${encodeURIComponent(userId)}/support-context`,
    extract: (payload) => payload?.context || null
  });

const readSupportContextCache = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage?.getItem(SUPPORT_CONTEXT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const writeSupportContextCache = (cache = {}) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage?.setItem(SUPPORT_CONTEXT_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Session storage can be unavailable in private modes; the API remains the source of truth.
  }
};

export const cacheSupportContextSeed = (record = {}) => {
  const id = String(record?.id || '').trim();
  if (!id) return;
  const cache = readSupportContextCache();
  cache[id] = {
    ...record,
    cachedAt: new Date().toISOString()
  };
  writeSupportContextCache(cache);
};

export const getCachedSupportContextSeed = (userId) => {
  const id = String(userId || '').trim();
  if (!id) return null;
  return readSupportContextCache()[id] || null;
};

export const updateUserStatus = async (userId, status) =>
  {
    try {
      return await strictRequest({
        path: `${SUPER_ADMIN_BASE}/users/${userId}/status`,
        options: { method: 'PATCH', body: JSON.stringify({ status }) },
        extract: (payload) => payload?.user || payload
      });
    } catch (error) {
      if (!areDemoFallbacksEnabled()) {
        throw error;
      }
      return { ...(adminDummyData.users.find((user) => user.id === userId) || {}), status };
    }
  };

export const createAdminUser = async (payload) => {
  const managedRole = String(payload.role || 'admin').trim().toLowerCase();
  const managedPayload = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: managedRole === 'data_entry' ? 'dataentry' : managedRole,
    department: payload.department || payload.company || '',
    assignedStates: payload.assignedStates || payload.assigned_states || [],
    salesCode: payload.salesCode || payload.sales_code || ''
  };

  try {
    const createdUser = await strictRequest({
      path: `${SUPER_ADMIN_BASE}/users`,
      options: { method: 'POST', body: JSON.stringify(payload) },
      extract: (response) => mapApiUserToUi(response?.user || response)
    });
    return createdUser;
  } catch (error) {
    if (!areDemoFallbacksEnabled()) {
      throw error;
    }

    if (!findManagedAccountByEmail(managedPayload.email)) {
      createManagedAccount(managedPayload);
    }

    const nextId = `USR-${1000 + adminDummyData.users.length + 1}`;
    return {
      id: nextId,
      displayId: getManagementDisplayId(nextId, managedPayload.role),
      name: payload.name,
      email: payload.email,
      role: managedPayload.role,
      company: payload.company || 'HHH Jobs',
      assignedStates: managedPayload.assignedStates,
      salesCode: managedPayload.salesCode,
      status: 'active',
      verified: true,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  }
};

export const deleteUser = async (userId) => {
  if (isManagedAccountId(userId)) {
    return deleteManagedAccount(userId);
  }

  try {
    const deletedUser = await strictRequest({
      path: `${SUPER_ADMIN_BASE}/users/${userId}`,
      options: { method: 'DELETE' },
      extract: (response) => response?.deletedUser || { id: userId }
    });
    markUserDeleted(userId);
    return deletedUser;
  } catch (error) {
    if (!areDemoFallbacksEnabled()) {
      throw error;
    }
    markUserDeleted(userId);
    return adminDummyData.users.find((user) => user.id === userId) || { id: userId };
  }
};
