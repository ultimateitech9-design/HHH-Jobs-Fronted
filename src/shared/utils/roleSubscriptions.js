export const normalizeRoleSubscriptionStatus = (value = '') => String(value || '').trim().toLowerCase();

export const isPendingRoleSubscriptionSetup = (subscription = null) => {
  if (!subscription) return false;
  const status = normalizeRoleSubscriptionStatus(subscription.status);
  return Boolean(
    subscription?.meta?.pendingAutopaySetup
    || subscription?.meta?.pendingPlanChangeSetup
    || status === 'pending'
  );
};

export const isUsableRoleSubscription = (subscription = null) => {
  if (!subscription) return false;
  const status = normalizeRoleSubscriptionStatus(subscription.status);
  if (!['active', 'trialing'].includes(status)) return false;
  if (isPendingRoleSubscriptionSetup(subscription)) return false;
  if (!subscription.ends_at) return true;
  return new Date(subscription.ends_at).getTime() >= Date.now();
};

export const formatRoleTrialProgressLabel = (subscription = null, remainingDays = 0) => {
  const safeRemainingDays = Math.max(0, Number(remainingDays || 0));
  const totalTrialDays = Math.max(0, Number(subscription?.meta?.trialDays || 0));
  if (totalTrialDays > 0) {
    return `${safeRemainingDays} of ${totalTrialDays} trial days left`;
  }
  return `${safeRemainingDays} trial days left`;
};
