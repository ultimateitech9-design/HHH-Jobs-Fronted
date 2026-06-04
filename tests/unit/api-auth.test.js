import test from 'node:test';
import assert from 'node:assert/strict';

const createStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    }
  };
};

const setupBrowserGlobals = () => {
  const storage = createStorage();
  globalThis.localStorage = storage;
  globalThis.window = {
    location: {
      origin: 'https://hhh-jobs.com'
    },
    dispatchEvent: () => {}
  };
  return storage;
};

test('API auth rejects stale non-JWT portal tokens', async () => {
  setupBrowserGlobals();
  const authModule = await import('../../src/utils/auth.js');
  const apiModule = await import('../../src/utils/api.js');

  authModule.setAuthSession('stale-token', {
    id: 'hr-user-1',
    role: 'hr',
    isEmailVerified: true
  });

  assert.equal(apiModule.hasApiAccessToken(), false);

  authModule.setAuthSession('header.payload.signature', {
    id: 'hr-user-1',
    role: 'hr',
    isEmailVerified: true
  });

  assert.equal(apiModule.hasApiAccessToken(), true);
});

test('protected API 401 clears stale dashboard sessions', async () => {
  setupBrowserGlobals();
  const originalFetch = globalThis.fetch;
  let requestHeaders = null;

  globalThis.fetch = async (_url, init) => {
    requestHeaders = init?.headers || {};
    return new Response(JSON.stringify({ status: false, message: 'User session is invalid' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    const authModule = await import('../../src/utils/auth.js');
    const apiModule = await import('../../src/utils/api.js');

    authModule.setAuthSession('stale-token', {
      id: 'hr-user-2',
      role: 'hr',
      isEmailVerified: true
    });

    const response = await apiModule.apiFetch('/hr/dashboard');

    assert.equal(response.status, 401);
    assert.equal(requestHeaders.Authorization, undefined);
    assert.equal(authModule.getToken(), null);
    assert.equal(authModule.getCurrentUser(), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('valid API sessions send bearer and proxy-safe auth headers', async () => {
  setupBrowserGlobals();
  const originalFetch = globalThis.fetch;
  let requestHeaders = null;

  globalThis.fetch = async (_url, init) => {
    requestHeaders = init?.headers || {};
    return new Response(JSON.stringify({ status: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    const authModule = await import('../../src/utils/auth.js');
    const apiModule = await import('../../src/utils/api.js');

    authModule.setAuthSession('header.payload.signature', {
      id: 'hr-user-proxy-header',
      role: 'hr',
      isEmailVerified: true
    });

    const response = await apiModule.apiFetch('/hr/dashboard');

    assert.equal(response.status, 200);
    assert.equal(requestHeaders.Authorization, 'Bearer header.payload.signature');
    assert.equal(requestHeaders['X-HHH-Auth-Token'], 'header.payload.signature');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('passive auth refresh 401 does not destroy a fresh portal session', async () => {
  setupBrowserGlobals();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => new Response(JSON.stringify({
    status: false,
    message: 'User session is invalid'
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    const authModule = await import('../../src/utils/auth.js');
    const apiModule = await import('../../src/utils/api.js');

    authModule.setAuthSession('header.payload.signature', {
      id: 'hr-user-3',
      role: 'hr',
      isEmailVerified: true
    });

    const response = await apiModule.apiFetch('/auth/me', {
      clearAuthOnUnauthorized: false
    });

    assert.equal(response.status, 401);
    assert.equal(authModule.getToken(), 'header.payload.signature');
    assert.equal(authModule.getCurrentUser()?.role, 'hr');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
