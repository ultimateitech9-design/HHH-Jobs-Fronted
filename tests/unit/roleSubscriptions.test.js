import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatRoleTrialProgressLabel,
  isPendingRoleSubscriptionSetup,
  isUsableRoleSubscription
} from '../../src/shared/utils/roleSubscriptions.js';

const daysFromNow = (days) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString();
};

test('coupon-backed active trial without autopay remains usable on the frontend', () => {
  assert.equal(isUsableRoleSubscription({
    status: 'active',
    autopay_enabled: false,
    ends_at: daysFromNow(60),
    meta: { isTrial: true }
  }), true);
});

test('pending setup subscriptions stay blocked until activation completes', () => {
  const subscription = {
    status: 'pending',
    autopay_enabled: false,
    ends_at: daysFromNow(60),
    meta: { pendingAutopaySetup: true, isTrial: true }
  };

  assert.equal(isPendingRoleSubscriptionSetup(subscription), true);
  assert.equal(isUsableRoleSubscription(subscription), false);
});

test('trial progress label includes total trial duration when available', () => {
  assert.equal(
    formatRoleTrialProgressLabel({ meta: { trialDays: 60 } }, 47),
    '47 of 60 trial days left'
  );
});
