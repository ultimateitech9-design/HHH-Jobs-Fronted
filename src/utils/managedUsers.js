const DELETED_USERS_KEY = 'hhh_jobs_deleted_user_ids';
const MANAGED_ACCOUNTS_KEY = 'hhh_jobs_managed_accounts';

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
    id: `managed-${role}-${Date.now()}`,
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
