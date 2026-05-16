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

export const clone = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
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
  try {
    const data = await strictRequest({ path, options, extract });
    return { data, error: '', isDemo: false };
  } catch (error) {
    const resolvedFallback = areDemoFallbacksEnabled()
      ? (typeof fallbackData === 'function' ? fallbackData() : fallbackData)
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
    return {
      data: filterDeletedUsers(filterUsers([...apiUsers, ...managedUsers], filters)),
      error: '',
      isDemo: false
    };
  } catch (error) {
    return {
      data: buildVisibleUsers(filters),
      error: error.message || 'Request failed.',
      isDemo: true
    };
  }
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
      return { ...(adminDummyData.users.find((user) => user.id === userId) || {}), status };
    }
  };

export const createAdminUser = async (payload) => {
  const managedRole = String(payload.role || 'admin').trim().toLowerCase();
  const managedPayload = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: managedRole === 'data_entry' ? 'dataentry' : managedRole
  };

  if (!findManagedAccountByEmail(managedPayload.email)) {
    createManagedAccount(managedPayload);
  }

  try {
    return await strictRequest({
      path: `${SUPER_ADMIN_BASE}/users`,
      options: { method: 'POST', body: JSON.stringify(payload) },
      extract: (response) => mapApiUserToUi(response?.user || response)
    });
  } catch (error) {
    const nextId = `USR-${1000 + adminDummyData.users.length + 1}`;
    return {
      id: nextId,
      displayId: getManagementDisplayId(nextId, managedPayload.role),
      name: payload.name,
      email: payload.email,
      role: managedPayload.role,
      company: payload.company || 'HHH Jobs',
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
    markUserDeleted(userId);
    return adminDummyData.users.find((user) => user.id === userId) || { id: userId };
  }
};
