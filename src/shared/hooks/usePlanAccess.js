import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { getCurrentUser } from '../../utils/auth';
import {
  PLAN_TIERS,
  FEATURE_REQUIREMENTS,
  TIER_NAMES,
  TRIAL_DAYS,
  getPlanBySlug,
  getPlansForRole,
  getTrialDaysForRole,
  isSubscriptionActive,
  isTrialing as checkIsTrialing,
  getTrialRemainingDays,
  getSubscriptionRemainingDays,
  canAccessFeature,
  getMinimumPlanForFeature,
  formatTrialLabel
} from '../constants/planConfig';

const cache = { data: null, timestamp: 0, loading: false };
const CACHE_TTL = 5 * 60 * 1000;

export const usePlanAccess = () => {
  const [subscription, setSubscription] = useState(cache.data);
  const [loading, setLoading] = useState(!cache.data);
  const user = getCurrentUser();
  const role = user?.role || '';

  const audienceRole = role === 'hr' ? 'hr'
    : role === 'student' ? 'student'
    : role === 'campus_connect' ? 'campus_connect'
    : '';

  const fetchSubscription = useCallback(async () => {
    if (!audienceRole) return;

    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
      setSubscription(cache.data);
      setLoading(false);
      return;
    }

    if (cache.loading) return;
    cache.loading = true;

    try {
      const response = await apiFetch(`/pricing/role-subscriptions/current?audienceRole=${audienceRole}`);
      const payload = await response.json();
      const sub = payload?.subscription || null;

      cache.data = sub;
      cache.timestamp = Date.now();
      setSubscription(sub);
    } catch (error) {
      setSubscription(null);
    } finally {
      cache.loading = false;
      setLoading(false);
    }
  }, [audienceRole]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const currentPlanSlug = subscription?.role_plan_slug || 'free';
  const currentTier = PLAN_TIERS[currentPlanSlug] || 0;
  const planName = subscription?.plan_name || currentPlanSlug;
  const isActive = isSubscriptionActive(subscription);
  const isTrialing = checkIsTrialing(subscription);
  const trialDaysRemaining = getTrialRemainingDays(subscription);
  const subscriptionDaysRemaining = getSubscriptionRemainingDays(subscription);
  const trialDaysForRole = getTrialDaysForRole(audienceRole);

  const currentPlanConfig = useMemo(() => getPlanBySlug(currentPlanSlug), [currentPlanSlug]);
  const availablePlans = useMemo(() => getPlansForRole(audienceRole), [audienceRole]);

  const canAccess = useCallback((featureKey) => {
    if (!isActive && currentTier > 0) return false;
    return canAccessFeature(featureKey, currentTier, role);
  }, [currentTier, role, isActive]);

  const getRequiredTier = useCallback((featureKey) => {
    return FEATURE_REQUIREMENTS[featureKey] || 0;
  }, []);

  const getUpgradePlan = useCallback((featureKey) => {
    return getMinimumPlanForFeature(featureKey, audienceRole);
  }, [audienceRole]);

  const refresh = useCallback(() => {
    cache.data = null;
    cache.timestamp = 0;
    return fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    currentPlanSlug,
    currentTier,
    planName,
    isActive,
    isTrialing,
    trialDaysRemaining,
    subscriptionDaysRemaining,
    trialDaysForRole,
    currentPlanConfig,
    availablePlans,
    canAccess,
    getRequiredTier,
    getUpgradePlan,
    refresh,
    audienceRole
  };
};

export { getPlanTierName } from '../constants/planConfig';

export const getTrialLabel = (role) => formatTrialLabel(role);

export default usePlanAccess;
