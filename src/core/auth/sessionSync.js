import { apiFetch, hasApiAccessToken } from '../../utils/api';
import { getCurrentUser, getToken, setAuthSession } from '../../utils/auth';

const DEFAULT_SESSION_SYNC_INTERVAL_MS = 2 * 60 * 1000;
const DEFAULT_RETRY_DELAY_MS = 30 * 1000;

let inflightSessionSync = null;
let lastSessionSyncAt = 0;
let nextSessionSyncAllowedAt = 0;
let lastSyncedUserId = '';

const resolveRetryDelayMs = (response, payload) => {
  const retryAfterHeader = Number(response?.headers?.get('Retry-After') || 0);
  if (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0) {
    return retryAfterHeader * 1000;
  }

  const retryAfterPayload = Number(payload?.retryAfterSeconds || payload?.retryAfter || 0);
  if (Number.isFinite(retryAfterPayload) && retryAfterPayload > 0) {
    return retryAfterPayload * 1000;
  }

  return DEFAULT_RETRY_DELAY_MS;
};

const ensureSyncStateForUser = (userId = '') => {
  const normalizedUserId = String(userId || '').trim();
  if (normalizedUserId === lastSyncedUserId) return;

  inflightSessionSync = null;
  lastSessionSyncAt = 0;
  nextSessionSyncAllowedAt = 0;
  lastSyncedUserId = normalizedUserId;
};

export const resetSessionSyncState = () => {
  inflightSessionSync = null;
  lastSessionSyncAt = 0;
  nextSessionSyncAllowedAt = 0;
  lastSyncedUserId = '';
};

export const syncSessionUser = async ({
  force = false,
  minIntervalMs = DEFAULT_SESSION_SYNC_INTERVAL_MS
} = {}) => {
  const currentUser = getCurrentUser();
  const token = getToken();

  if (!currentUser || !token || !hasApiAccessToken()) {
    return { user: currentUser, profile: null };
  }

  ensureSyncStateForUser(currentUser.id);

  const now = Date.now();
  if (!force && inflightSessionSync) {
    return inflightSessionSync;
  }

  if (!force && nextSessionSyncAllowedAt > now) {
    return { user: currentUser, profile: null };
  }

  if (!force && lastSessionSyncAt > 0 && now - lastSessionSyncAt < minIntervalMs) {
    return { user: currentUser, profile: null };
  }

  inflightSessionSync = (async () => {
    const response = await apiFetch('/auth/me');
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(payload?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.retryDelayMs = resolveRetryDelayMs(response, payload);
      nextSessionSyncAllowedAt = Date.now() + error.retryDelayMs;
      throw error;
    }

    const latestUser = payload?.user
      ? { ...currentUser, ...payload.user }
      : currentUser;

    setAuthSession(token, latestUser);
    lastSessionSyncAt = Date.now();
    nextSessionSyncAllowedAt = 0;

    return {
      user: latestUser,
      profile: payload?.profile || null
    };
  })();

  try {
    return await inflightSessionSync;
  } finally {
    inflightSessionSync = null;
  }
};
