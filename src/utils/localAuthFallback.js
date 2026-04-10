const USERS_KEY = 'job_portal_local_users';
const PENDING_OTP_KEY = 'job_portal_pending_otps';

const getMemoryStore = () => {
  if (typeof window === 'undefined') return {};
  if (!window.__hhhLocalAuthStore) {
    window.__hhhLocalAuthStore = {};
  }
  return window.__hhhLocalAuthStore;
};

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    const memoryStore = getMemoryStore();
    return key in memoryStore ? memoryStore[key] : fallback;
  }
};

const safeWrite = (key, value) => {
  const memoryStore = getMemoryStore();
  memoryStore[key] = value;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Memory store keeps local auth working even if persistent storage is blocked.
  }
};

const getUsers = () => safeRead(USERS_KEY, []);
const setUsers = (users) => safeWrite(USERS_KEY, users);
const getPendingOtps = () => safeRead(PENDING_OTP_KEY, []);
const setPendingOtps = (entries) => safeWrite(PENDING_OTP_KEY, entries);

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const generateToken = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const nowIso = () => new Date().toISOString();

const getRedirectPathByRole = (role) => {
  if (role === 'super_admin') return '/portal/super-admin/dashboard';
  if (role === 'admin') return '/portal/admin/dashboard';
  if (role === 'hr') return '/portal/hr/dashboard';
  if (role === 'retired_employee') return '/portal/student/home';
  return '/portal/student/home';
};

export const createLocalSignupFallback = ({
  name,
  email,
  mobile,
  password,
  role,
  companyName = '',
  dateOfBirth = '',
  gender = '',
  caste = '',
  religion = ''
}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const users = getUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('Email already registered.');
  }

  const otp = generateOtp();
  const user = {
    id: `local-user-${Date.now()}`,
    name,
    email: normalizedEmail,
    mobile,
    password,
    role,
    companyName,
    dateOfBirth,
    gender,
    caste,
    religion,
    is_email_verified: false,
    created_at: nowIso()
  };

  users.unshift(user);
  setUsers(users);

  const pendingOtps = getPendingOtps().filter((entry) => entry.email !== normalizedEmail);
  pendingOtps.unshift({
    email: normalizedEmail,
    otp,
    token: generateToken(),
    created_at: nowIso()
  });
  setPendingOtps(pendingOtps);

  return {
    status: true,
    token: `pending-${user.id}`,
    user,
    requiresOtpVerification: true,
    redirectTo: '/verify-otp',
    otp
  };
};

export const verifyLocalSignupOtp = ({ email, otp }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const pendingOtps = getPendingOtps();
  const pendingEntry = pendingOtps.find((entry) => entry.email === normalizedEmail);

  if (!pendingEntry || pendingEntry.otp !== String(otp || '').trim()) {
    throw new Error('Invalid OTP.');
  }

  const users = getUsers();
  const userIndex = users.findIndex((user) => user.email === normalizedEmail);
  if (userIndex === -1) {
    throw new Error('User not found.');
  }

  const nextUser = {
    ...users[userIndex],
    is_email_verified: true,
    updated_at: nowIso()
  };
  users[userIndex] = nextUser;
  setUsers(users);
  setPendingOtps(pendingOtps.filter((entry) => entry.email !== normalizedEmail));

  return {
    status: true,
    token: generateToken(),
    user: nextUser,
    redirectTo: getRedirectPathByRole(nextUser.role)
  };
};

export const resendLocalSignupOtp = (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const pendingOtps = getPendingOtps();
  const pendingIndex = pendingOtps.findIndex((entry) => entry.email === normalizedEmail);

  if (pendingIndex === -1) {
    throw new Error('OTP session not found.');
  }

  const nextOtp = generateOtp();
  pendingOtps[pendingIndex] = {
    ...pendingOtps[pendingIndex],
    otp: nextOtp,
    created_at: nowIso()
  };
  setPendingOtps(pendingOtps);

  return {
    status: true,
    message: 'OTP resent successfully.',
    otp: nextOtp
  };
};
