import { apiUrl } from '../../../utils/api.js';

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

const normalizeLogoCandidate = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^(data:|blob:|\/)/i.test(raw)) return raw;
  if (isAlreadyProxiedLogoUrl(raw)) return raw;

  try {
    return new URL(raw).toString();
  } catch {
    try {
      return new URL(`https://${raw}`).toString();
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
    return `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(url.origin)}`;
  } catch {
    return '';
  }
};

export const buildCompanyLogoUrl = (logoUrl = '', fallbackLogoUrl = '', websiteUrl = '') => {
  const candidate = normalizeLogoCandidate(
    pickPreferredText(buildWebsiteLogoCandidate(websiteUrl), logoUrl, fallbackLogoUrl)
  );
  if (!candidate) return '';
  if (/^(data:|blob:|\/)/i.test(candidate)) return candidate;
  if (isAlreadyProxiedLogoUrl(candidate)) return candidate;

  return apiUrl(`/assets/logo?url=${encodeURIComponent(candidate)}`);
};
