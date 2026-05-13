export const MAINTENANCE_MODE_STORAGE_KEY = 'hhh_jobs_maintenance_mode';
export const MAINTENANCE_MODE_EVENT = 'hhh-jobs:maintenance-mode';

const getStorage = (storage) => {
  if (storage) return storage;
  if (typeof globalThis === 'undefined') return null;
  return globalThis.localStorage || null;
};

const normalizeEnabled = (value) => {
  if (typeof value === 'boolean') return value;

  const normalized = String(value || '').trim().toLowerCase();
  if (['true', '1', 'on', 'enabled'].includes(normalized)) return true;
  if (['false', '0', 'off', 'disabled'].includes(normalized)) return false;
  return Boolean(value);
};

export const readMaintenanceModeSnapshot = (storage) => {
  const targetStorage = getStorage(storage);
  if (!targetStorage) {
    return { known: false, enabled: false, updatedAt: 0 };
  }

  try {
    const rawSnapshot = targetStorage.getItem(MAINTENANCE_MODE_STORAGE_KEY);
    if (!rawSnapshot) {
      return { known: false, enabled: false, updatedAt: 0 };
    }

    const parsedSnapshot = JSON.parse(rawSnapshot);
    const enabled = normalizeEnabled(parsedSnapshot?.enabled);
    const updatedAt = Number(parsedSnapshot?.updatedAt || 0);

    return {
      known: true,
      enabled,
      updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0
    };
  } catch {
    return { known: false, enabled: false, updatedAt: 0 };
  }
};

export const writeMaintenanceModeSnapshot = (enabled, storage) => {
  const targetStorage = getStorage(storage);
  const snapshot = {
    known: true,
    enabled: Boolean(enabled),
    updatedAt: Date.now()
  };

  if (!targetStorage) return snapshot;

  try {
    targetStorage.setItem(
      MAINTENANCE_MODE_STORAGE_KEY,
      JSON.stringify({ enabled: snapshot.enabled, updatedAt: snapshot.updatedAt })
    );
  } catch {
    // Ignore storage write failures and still return the in-memory snapshot.
  }

  return snapshot;
};

export const dispatchMaintenanceModeUpdate = (enabled, options = {}) => {
  const { storage, target = globalThis.window } = options;
  const snapshot = writeMaintenanceModeSnapshot(enabled, storage);

  if (!target?.dispatchEvent) return snapshot;

  try {
    target.dispatchEvent(new CustomEvent(MAINTENANCE_MODE_EVENT, { detail: snapshot }));
  } catch {
    target.dispatchEvent({ type: MAINTENANCE_MODE_EVENT, detail: snapshot });
  }

  return snapshot;
};

export const subscribeToMaintenanceModeUpdates = (listener, options = {}) => {
  const { storage, target = globalThis.window } = options;
  if (!target?.addEventListener) return () => {};

  const emitStoredSnapshot = (snapshot) => {
    listener(snapshot || readMaintenanceModeSnapshot(storage));
  };

  const handleStorage = (event) => {
    if (event?.key && event.key !== MAINTENANCE_MODE_STORAGE_KEY) return;
    emitStoredSnapshot();
  };

  const handleCustomEvent = (event) => {
    emitStoredSnapshot(event?.detail);
  };

  target.addEventListener('storage', handleStorage);
  target.addEventListener(MAINTENANCE_MODE_EVENT, handleCustomEvent);

  return () => {
    target.removeEventListener('storage', handleStorage);
    target.removeEventListener(MAINTENANCE_MODE_EVENT, handleCustomEvent);
  };
};
