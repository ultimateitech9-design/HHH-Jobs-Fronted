const DELETED_USERS_KEY = 'hhh_jobs_deleted_user_ids';
const MANAGED_ACCOUNTS_KEY = 'hhh_jobs_managed_accounts';
const MANAGEMENT_ID_PREFIX = 'M';
const MANAGEMENT_ID_LENGTH = 12;
const MANAGEMENT_ROLE_TOKENS = Object.freeze({
  admin: 'AD',
  super_admin: 'SA',
  hr: 'HR',
  student: 'ST',
  retired_employee: 'RE',
  support: 'SP',
  sales: 'SL',
  accounts: 'AC',
  dataentry: 'DE',
  data_entry: 'DE',
  campus_connect: 'CC',
  platform: 'PF',
  audit: 'AU',
  company_admin: 'CA'
});

const notifyManagedUsersChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('managed-users-changed'));
  }
};

const readDeletedUserIds = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(DELETED_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
};

const writeDeletedUserIds = (ids) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(new Set(ids))));
  notifyManagedUsersChanged();
};

export const getDeletedUserIds = () => readDeletedUserIds();

export const filterDeletedUsers = (users = []) => {
  const deletedIds = new Set(readDeletedUserIds());
  if (deletedIds.size === 0) return users;
  return users.filter((user) => !deletedIds.has(user?.id));
};

export const markUserDeleted = (userId) => {
  if (!userId) return;
  const current = readDeletedUserIds();
  writeDeletedUserIds([...current, userId]);
};

const readManagedAccounts = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(MANAGED_ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
};

const writeManagedAccounts = (accounts) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MANAGED_ACCOUNTS_KEY, JSON.stringify(accounts));
  notifyManagedUsersChanged();
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isStrongAuthKey = (value) => {
  const password = String(value || '');
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
};
const nowIso = () => new Date().toISOString();
const normalizeAlphaNumeric = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const normalizeRoleToken = (role) => String(role || '').trim().toLowerCase();

const getManagementRoleToken = (role) => {
  const normalizedRole = normalizeRoleToken(role);
  return MANAGEMENT_ROLE_TOKENS[normalizedRole]
    || normalizeAlphaNumeric(normalizedRole).slice(0, 2).padEnd(2, 'X');
};

const createHashToken = (value, length) => {
  let hash = 2166136261;
  const input = String(value || '');

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  let token = '';
  let rollingHash = hash >>> 0;
  while (token.length < length) {
    rollingHash = Math.imul(rollingHash ^ 0x9e3779b9, 2246822519) >>> 0;
    token += rollingHash.toString(36).toUpperCase();
  }

  return token.slice(0, length);
};

const createRandomToken = (length) => {
  let token = '';

  while (token.length < length) {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      const values = new Uint32Array(2);
      globalThis.crypto.getRandomValues(values);
      token += Array.from(values, (value) => value.toString(36).toUpperCase()).join('');
    } else {
      token += Math.random().toString(36).slice(2).toUpperCase();
    }
  }

  return normalizeAlphaNumeric(token).slice(0, length);
};

export const isManagedAccountId = (value) =>
  new RegExp(`^${MANAGEMENT_ID_PREFIX}[A-Z0-9]{${MANAGEMENT_ID_LENGTH - 1}}$`, 'i').test(String(value || '').trim());

export const getManagementDisplayId = (value, role = '') => {
  const normalizedValue = normalizeAlphaNumeric(value);
  if (isManagedAccountId(normalizedValue)) {
    return normalizedValue.slice(0, MANAGEMENT_ID_LENGTH);
  }

  const roleToken = getManagementRoleToken(role);
  const sourceToken = normalizedValue.slice(-2).padStart(2, '0');
  const hashLength = MANAGEMENT_ID_LENGTH - MANAGEMENT_ID_PREFIX.length - roleToken.length - sourceToken.length;
  const hashToken = createHashToken(`${role}:${value}`, hashLength);
  return `${MANAGEMENT_ID_PREFIX}${roleToken}${sourceToken}${hashToken}`;
};

export const generateManagedAccountId = (role, existingAccounts = []) => {
  const roleToken = getManagementRoleToken(role);
  const existingIds = new Set(
    existingAccounts.map((account) => normalizeAlphaNumeric(account?.id)).filter(Boolean)
  );

  let nextId = '';
  do {
    nextId = `${MANAGEMENT_ID_PREFIX}${roleToken}${createRandomToken(MANAGEMENT_ID_LENGTH - MANAGEMENT_ID_PREFIX.length - roleToken.length)}`;
  } while (existingIds.has(nextId));

  return nextId;
};

export const getManagedAccounts = () => filterDeletedUsers(readManagedAccounts());

export const findManagedAccountByEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return getManagedAccounts().find((account) => normalizeEmail(account.email) === normalizedEmail) || null;
};

export const createManagedAccount = ({ name, email, password, role, phone, department }) => {
  const normalizedEmail = normalizeEmail(email);
  const current = readManagedAccounts();

  if (!normalizedEmail || !password || !role) {
    throw new Error('Name, email, password, and role are required.');
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Enter a valid email address like user@example.com.');
  }

  if (!isStrongAuthKey(password)) {
    throw new Error('Auth Key must be at least 8 characters and include uppercase, lowercase, number, and special symbol.');
  }

  if (current.some((account) => normalizeEmail(account.email) === normalizedEmail)) {
    throw new Error('Email already registered.');
  }

  const newAccount = {
    id: generateManagedAccountId(role, current),
    name: String(name || '').trim() || `${role} operator`,
    email: normalizedEmail,
    password: String(password),
    role: String(role).trim().toLowerCase(),
    phone: String(phone || '').trim(),
    department: String(department || '').trim(),
    status: 'active',
    created_at: nowIso(),
    last_login_at: null
  };

  writeManagedAccounts([newAccount, ...current]);
  return newAccount;
};

export const updateManagedAccountLogin = (userId) => {
  const current = readManagedAccounts();
  const next = current.map((account) => (
    account.id === userId
      ? { ...account, last_login_at: nowIso() }
      : account
  ));
  writeManagedAccounts(next);
  return next.find((account) => account.id === userId) || null;
};

export const deleteManagedAccount = (userId) => {
  const current = readManagedAccounts();
  const target = current.find((account) => account.id === userId) || null;
  if (!target) {
    throw new Error('Account not found.');
  }

  markUserDeleted(userId);
  writeManagedAccounts(current.filter((account) => account.id !== userId));
  return target;
};
