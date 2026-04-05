import { clearAuthSession, getCurrentUser, getToken, isEmailVerifiedUser } from './auth.js';

const env = import.meta.env || {};

const configuredApiBase =
  env.VITE_API_BASE_URL
  || env.VITE_API_URL
  || '';

const isLocalOrigin = (value = '') => /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(value).trim());

const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';

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

const runtimeFallbackBase = deriveLocalRuntimeBase(browserOrigin)
  || (env.DEV ? 'http://localhost:5500' : (browserOrigin || 'http://localhost:5500'));

export const API_BASE_URL = String(
  shouldIgnoreConfiguredLocalhost ? runtimeFallbackBase : (configuredApiBase || runtimeFallbackBase)
).replace(/\/+$/, '');

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const areDemoFallbacksEnabled = () =>
  String(env.VITE_ENABLE_DEMO_FALLBACKS || '').trim().toLowerCase() === 'true';

const hasUsableApiToken = (token) =>
  Boolean(token)
  && !/^(managed-|local-|pending-)/i.test(String(token))
  && isEmailVerifiedUser(getCurrentUser());

export const hasApiAccessToken = () => {
  const token = getToken();
  return hasUsableApiToken(token);
};

export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const shouldUseApiAuth = hasUsableApiToken(token);
  const headers = { ...(options.headers || {}) };

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (shouldUseApiAuth && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const targetUrl = apiUrl(path);
  let response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers
    });
  } catch (error) {
    throw new Error(`Unable to connect to server (${targetUrl}). Please check backend is running.`);
  }

  if (shouldUseApiAuth && response.status === 401) {
    clearAuthSession();
  }

  return response;
};
