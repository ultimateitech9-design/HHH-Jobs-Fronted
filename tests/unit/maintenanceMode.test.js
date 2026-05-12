import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAINTENANCE_MODE_EVENT,
  MAINTENANCE_MODE_STORAGE_KEY,
  dispatchMaintenanceModeUpdate,
  readMaintenanceModeSnapshot,
  subscribeToMaintenanceModeUpdates,
  writeMaintenanceModeSnapshot
} from '../../src/shared/utils/maintenanceMode.js';

const createStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    }
  };
};

const createEventTarget = () => {
  const listeners = new Map();

  return {
    addEventListener(name, handler) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(handler);
    },
    removeEventListener(name, handler) {
      listeners.get(name)?.delete(handler);
    },
    dispatchEvent(event) {
      for (const handler of listeners.get(event.type) || []) {
        handler(event);
      }
    }
  };
};

test('reads and writes maintenance snapshots safely', () => {
  const storage = createStorage();

  assert.deepEqual(readMaintenanceModeSnapshot(storage), {
    known: false,
    enabled: false,
    updatedAt: 0
  });

  const snapshot = writeMaintenanceModeSnapshot(true, storage);
  assert.equal(snapshot.known, true);
  assert.equal(snapshot.enabled, true);

  const stored = readMaintenanceModeSnapshot(storage);
  assert.equal(stored.known, true);
  assert.equal(stored.enabled, true);
  assert.equal(typeof stored.updatedAt, 'number');

  storage.setItem(MAINTENANCE_MODE_STORAGE_KEY, '{broken-json');
  assert.deepEqual(readMaintenanceModeSnapshot(storage), {
    known: false,
    enabled: false,
    updatedAt: 0
  });
});

test('broadcasts maintenance updates to subscribers', () => {
  const storage = createStorage();
  const target = createEventTarget();
  const snapshots = [];

  const unsubscribe = subscribeToMaintenanceModeUpdates((snapshot) => {
    snapshots.push(snapshot);
  }, { storage, target });

  const dispatched = dispatchMaintenanceModeUpdate(true, { storage, target });
  assert.equal(dispatched.enabled, true);

  target.dispatchEvent({ type: 'storage', key: MAINTENANCE_MODE_STORAGE_KEY });
  unsubscribe();
  target.dispatchEvent({ type: MAINTENANCE_MODE_EVENT, detail: { known: true, enabled: false, updatedAt: Date.now() } });

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].enabled, true);
  assert.equal(snapshots[1].enabled, true);
});
