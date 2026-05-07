import { apiUrl } from '../../../utils/api.js';

const RESERVED_HOSTNAME_PATTERNS = [
  /(^|\.)example$/i,
  /(^|\.)example\.com$/i,
  /(^|\.)invalid$/i,
  /(^|\.)test$/i,
  /^localhost$/i
];

const pickPreferredText = (...values) => {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) return normalized;
  }

  return '';
};

const isAlreadyProxiedLogoUrl = (value = '') => {
  try {
    const url = new URL(String(value || '').trim());
    return url.pathname === '/assets/logo' && url.searchParams.has('url');
  } catch {
    return false;
  }
};

const isReservedHostname = (value = '') =>
  RESERVED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(String(value || '').trim().toLowerCase()));

const extractFaviconTargetHostname = (url) => {
  const rawTarget = url.searchParams.get('domain_url') || url.searchParams.get('url') || '';
  if (!rawTarget) return '';

  try {
    return new URL(rawTarget).hostname;
  } catch {
    try {
      return new URL(`https://${rawTarget}`).hostname;
    } catch {
      return '';
    }
  }
};

const isKnownBrokenFaviconUrl = (url) => {
  const hostname = String(url?.hostname || '').trim().toLowerCase();
  const isGoogleFaviconHost = hostname === 'www.google.com'
    || hostname === 'google.com'
    || hostname === 't3.gstatic.com'
    || hostname === 'gstatic.com'
    || hostname === 'www.gstatic.com';

  if (!isGoogleFaviconHost) return false;
  if (!/favicon/i.test(url?.pathname || '')) return false;

  return isReservedHostname(extractFaviconTargetHostname(url));
};

const normalizeLogoCandidate = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^(data:|blob:|\/)/i.test(raw)) return raw;
  if (isAlreadyProxiedLogoUrl(raw)) return raw;

  try {
    const parsedUrl = new URL(raw);
    if (isKnownBrokenFaviconUrl(parsedUrl)) return '';
    return parsedUrl.toString();
  } catch {
    try {
      const parsedUrl = new URL(`https://${raw}`);
      if (isKnownBrokenFaviconUrl(parsedUrl)) return '';
      return parsedUrl.toString();
    } catch {
      return raw;
    }
  }
};

const buildWebsiteLogoCandidate = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (isReservedHostname(url.hostname)) return '';
    return `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(url.origin)}`;
  } catch {
    return '';
  }
};

export const buildCompanyLogoUrl = (logoUrl = '', fallbackLogoUrl = '', websiteUrl = '') => {
  const candidate = normalizeLogoCandidate(
    pickPreferredText(logoUrl, fallbackLogoUrl, buildWebsiteLogoCandidate(websiteUrl))
  );
  if (!candidate) return '';
  if (/^(data:|blob:|\/)/i.test(candidate)) return candidate;
  if (isAlreadyProxiedLogoUrl(candidate)) return candidate;

  return apiUrl(`/assets/logo?url=${encodeURIComponent(candidate)}`);
};
