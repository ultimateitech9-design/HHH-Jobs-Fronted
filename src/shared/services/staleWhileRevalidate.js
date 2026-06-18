const CACHE_PREFIX = 'hhh_swr_cache:';
const pendingRefreshes = new Map();

const now = () => Date.now();

const safeStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
};

const makeCacheKey = (key = '') => `${CACHE_PREFIX}${String(key || '').trim()}`;

const readCache = (key) => {
  const storage = safeStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(makeCacheKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (key, value) => {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(makeCacheKey(key), JSON.stringify({
      value,
      updatedAt: now()
    }));
  } catch {
    // Storage can be full or disabled; network result still works.
  }
};

export const clearSWRCache = (keyPrefix = '') => {
  const storage = safeStorage();
  if (!storage) return;

  const prefix = makeCacheKey(keyPrefix);
  Object.keys(storage)
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => storage.removeItem(key));
};

export const staleWhileRevalidate = async ({
  key,
  maxAgeMs = 30_000,
  staleMs = 180_000,
  loader
} = {}) => {
  if (typeof loader !== 'function') {
    throw new Error('staleWhileRevalidate requires a loader function');
  }

  if (!key) {
    return loader();
  }

  const cached = readCache(key);
  const ageMs = cached?.updatedAt ? now() - Number(cached.updatedAt) : Number.POSITIVE_INFINITY;

  if (cached && ageMs <= maxAgeMs) {
    return cached.value;
  }

  if (cached && ageMs <= maxAgeMs + staleMs) {
    if (!pendingRefreshes.has(key)) {
      const refresh = loader()
        .then((value) => {
          writeCache(key, value);
          return value;
        })
        .finally(() => pendingRefreshes.delete(key));
      pendingRefreshes.set(key, refresh);
    }
    return cached.value;
  }

  const value = await loader();
  writeCache(key, value);
  return value;
};
