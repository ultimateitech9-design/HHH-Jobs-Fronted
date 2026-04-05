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

const setupAuthModule = async () => {
  const storage = createStorage();
  globalThis.localStorage = storage;
  globalThis.window = {
    location: { origin: 'http://localhost:4173' },
    dispatchEvent: () => {}
  };

  const authModule = await import('../../src/utils/auth.js');
  return { authModule, storage };
};

test('canonicalizes dashboard paths for portal redirects', async () => {
  const { authModule } = await setupAuthModule();

  assert.equal(authModule.getDashboardPathByRole('student'), '/portal/student/dashboard');
  assert.equal(authModule.getDashboardPathByRole('hr'), '/portal/hr/dashboard');
  assert.equal(authModule.getDashboardPathByRole('platform'), '/portal/platform/dashboard');
  assert.equal(authModule.getDashboardPathByRole('audit'), '/portal/audit/dashboard');
  assert.equal(authModule.getDashboardPathByRole('super_admin'), '/portal/super-admin/dashboard');
  assert.equal(authModule.getDashboardPathByRole('dataentry'), '/portal/dataentry/dashboard');
  assert.equal(authModule.getDashboardPathByRole('accounts'), '/portal/accounts/overview');
  assert.equal(authModule.normalizeRedirectPath('/student'), '/portal/student/dashboard');
  assert.equal(authModule.normalizeRedirectPath('/hr/analytics'), '/portal/hr/analytics');
  assert.equal(authModule.normalizeRedirectPath('/platform'), '/portal/platform/dashboard');
  assert.equal(authModule.normalizeRedirectPath('/audit/events'), '/portal/audit/events');
  assert.equal(authModule.normalizeRedirectPath('/portal/student/jobs'), '/portal/student/jobs');
});

test('clears malformed auth sessions instead of leaving stale tokens', async () => {
  const { authModule, storage } = await setupAuthModule();

  storage.setItem('job_portal_token', 'valid-token');
  storage.setItem('job_portal_user', '{not-json');

  assert.equal(authModule.getCurrentUser(), null);
  assert.equal(storage.getItem('job_portal_token'), null);
  assert.equal(storage.getItem('job_portal_user'), null);
});

test('clears deleted users from storage and reports unauthenticated', async () => {
  const { authModule, storage } = await setupAuthModule();

  storage.setItem('job_portal_token', 'valid-token');
  storage.setItem('job_portal_user', JSON.stringify({ id: 'user-123', role: 'student' }));
  storage.setItem('hhh_jobs_deleted_user_ids', JSON.stringify(['user-123']));

  assert.equal(authModule.getCurrentUser(), null);
  assert.equal(authModule.isAuthenticated(), false);
  assert.equal(storage.getItem('job_portal_token'), null);
  assert.equal(storage.getItem('job_portal_user'), null);
});

test('starts pending verification without leaving an authenticated session behind', async () => {
  const { authModule, storage } = await setupAuthModule();

  authModule.setAuthSession('valid-token', { id: 'user-1', role: 'student', isEmailVerified: true });
  authModule.beginPendingVerificationSession({
    email: '  Pending.User@example.com ',
    otp: '12a34567',
    emailWarning: 'Check mailbox'
  });

  assert.equal(storage.getItem('job_portal_token'), null);
  assert.equal(storage.getItem('job_portal_user'), null);
  assert.deepEqual(authModule.getPendingVerificationSession(), {
    email: 'pending.user@example.com',
    otp: '123456',
    emailWarning: 'Check mailbox'
  });
  assert.equal(authModule.isAuthenticated(), false);
});

test('treats unverified stored users as unauthenticated', async () => {
  const { authModule, storage } = await setupAuthModule();

  storage.setItem('job_portal_token', 'valid-token');
  storage.setItem('job_portal_user', JSON.stringify({
    id: 'user-2',
    role: 'student',
    isEmailVerified: false
  }));

  assert.equal(authModule.getCurrentUser(), null);
  assert.equal(authModule.getStoredUser()?.id, 'user-2');
  assert.equal(authModule.isAuthenticated(), false);
});
