import { clearAuthSession, getCurrentUser, getToken, isEmailVerifiedUser } from './auth.js';

const env = import.meta.env || {};
const PRODUCTION_API_BASE_URL = 'https://api.hhh-jobs.com';
const LEGACY_RENDER_API_NAME = 'hhh-jobs-backend';

const isLocalOrigin = (value = '') => /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(value).trim());

const normalizeLoopbackHost = (value = '') => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';

  try {
    const url = new URL(rawValue);
    if (isLocalOrigin(url.origin)) {
      url.hostname = '127.0.0.1';
    }
    return url.toString().replace(/\/+$/, '');
  } catch (error) {
    return rawValue.replace(/\/+$/, '');
  }
};

const normalizeKnownApiBase = (value = '') => {
  const normalized = normalizeLoopbackHost(value);
  if (!normalized) return '';

  try {
    const url = new URL(normalized);
    const hostname = url.hostname.toLowerCase();
    if (hostname.includes(LEGACY_RENDER_API_NAME) && hostname.endsWith('.onrender.com')) {
      return PRODUCTION_API_BASE_URL;
    }
  } catch (error) {
    const lowered = normalized.toLowerCase();
    if (lowered.includes(LEGACY_RENDER_API_NAME) && lowered.includes('onrender.com')) {
      return PRODUCTION_API_BASE_URL;
    }
  }

  return normalized;
};

const configuredApiBase = normalizeKnownApiBase(
  env.VITE_API_BASE_URL
  || env.VITE_API_URL
  || ''
);

const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const deployedApiFallbackBase = normalizeKnownApiBase(
  env.VITE_DEPLOYED_API_BASE_URL
  || env.VITE_LIVE_API_BASE_URL
  || PRODUCTION_API_BASE_URL
);

const deriveLocalRuntimeBase = (origin) => {
  if (!origin || !isLocalOrigin(origin)) return '';

  try {
    const url = new URL(origin);
    url.port = '5500';
    return url.origin;
  } catch (error) {
    return '';
  }
};

const shouldIgnoreConfiguredLocalhost =
  Boolean(browserOrigin)
  && !isLocalOrigin(browserOrigin)
  && isLocalOrigin(configuredApiBase);

const runtimeFallbackBase = normalizeLoopbackHost(
  deriveLocalRuntimeBase(browserOrigin)
  || (env.DEV ? 'http://localhost:5500' : (browserOrigin || 'http://localhost:5500'))
);

const effectiveFallbackBase = shouldIgnoreConfiguredLocalhost
  ? (deployedApiFallbackBase || runtimeFallbackBase)
  : runtimeFallbackBase;

export const API_BASE_URL = String(
  shouldIgnoreConfiguredLocalhost ? effectiveFallbackBase : (configuredApiBase || runtimeFallbackBase)
).replace(/\/+$/, '');
export const AUTH_REQUEST_TIMEOUT_MS = 60000;

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const areDemoFallbacksEnabled = () =>
  String(env.VITE_ENABLE_DEMO_FALLBACKS || '').trim().toLowerCase() === 'true';

const looksLikeJwt = (token) => /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i.test(String(token || '').trim());

const hasUsableApiToken = (token) =>
  Boolean(token)
  && looksLikeJwt(token)
  && !/^(managed-|local-|pending-)/i.test(String(token))
  && isEmailVerifiedUser(getCurrentUser());

const buildDevUserHeader = () => {
  if (!env.DEV || !isLocalOrigin(browserOrigin)) return '';
  const user = getCurrentUser();
  if (!user) return '';

  return encodeURIComponent(JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || 'active',
    isHrApproved: user.isHrApproved,
    is_hr_approved: user.is_hr_approved,
    isEmailVerified: user.isEmailVerified,
    is_email_verified: user.is_email_verified
  }));
};

export const hasApiAccessToken = () => {
  const token = getToken();
  return hasUsableApiToken(token);
};

export const hasBackendAuthSession = () => hasApiAccessToken() || Boolean(buildDevUserHeader());

export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const {
    timeoutMs = 0,
    signal: callerSignal,
    skipAuth = false,
    clearAuthOnUnauthorized = true,
    ...fetchOptions
  } = options;
  const shouldUseApiAuth = !skipAuth && hasUsableApiToken(token);
  const headers = { ...(fetchOptions.headers || {}) };

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth && !shouldUseApiAuth && !headers['X-HHH-Dev-User'] && !headers['x-hhh-dev-user']) {
    const devUserHeader = buildDevUserHeader();
    if (devUserHeader) headers['X-HHH-Dev-User'] = devUserHeader;
  }

  if (shouldUseApiAuth && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    shouldUseApiAuth
    && !headers['X-HHH-Auth-Token']
    && !headers['x-hhh-auth-token']
  ) {
    headers['X-HHH-Auth-Token'] = token;
  }

  const targetUrl = apiUrl(path);
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller && timeoutMs > 0 ? globalThis.setTimeout(() => controller.abort(), timeoutMs) : null;

  if (callerSignal && controller) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let response;
  try {
    response = await fetch(targetUrl, {
      ...fetchOptions,
      headers,
      signal: controller?.signal || callerSignal
    });
  } catch (error) {
    if (timeoutId) globalThis.clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s (${targetUrl}).`);
    }
    throw new Error(`Unable to connect to server (${targetUrl}). Please check backend is running.`);
  }
  if (timeoutId) globalThis.clearTimeout(timeoutId);

  if (clearAuthOnUnauthorized && !skipAuth && token && getCurrentUser() && response.status === 401) {
    clearAuthSession();
  }

  return response;
};
