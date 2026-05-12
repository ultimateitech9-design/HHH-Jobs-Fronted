import { adminDummyData } from '../data/adminDummyData';
import { SUPER_ADMIN_BASE, safeRequest, strictRequest } from './usersApi';
import { expandPermissionKeys, flattenPermissionKeys } from './mappers';

export const getRolesPermissions = async () =>
  safeRequest({
    path: `${SUPER_ADMIN_BASE}/roles-permissions`,
    emptyData: [],
    fallbackData: adminDummyData.rolesPermissions,
    extract: (payload) =>
      (payload?.roles || []).map((role) => ({
        ...role,
        permissions: flattenPermissionKeys(role.permissions)
      }))
  });

export const getSystemSettings = async () =>
  safeRequest({
    path: `${SUPER_ADMIN_BASE}/settings`,
    emptyData: {},
    fallbackData: adminDummyData.systemSettings,
    extract: (payload) => payload?.settings || payload || {}
  });

export const saveSystemSettings = async (settings) =>
  strictRequest({
    path: `${SUPER_ADMIN_BASE}/settings`,
    options: { method: 'PUT', body: JSON.stringify(settings) },
    extract: (payload) => payload?.settings || payload
  });

export const saveRolesPermissions = async (roles) => {
  try {
    return await strictRequest({
      path: `${SUPER_ADMIN_BASE}/roles-permissions`,
      options: {
        method: 'PUT',
        body: JSON.stringify({
          roles: roles.map((role) => ({
            ...role,
            permissions: expandPermissionKeys(role.permissions)
          }))
        })
      },
      extract: (payload) =>
        (payload?.roles || payload || []).map((role) => ({
          ...role,
          permissions: flattenPermissionKeys(role.permissions)
        }))
    });
  } catch (error) {
    return roles;
  }
};
