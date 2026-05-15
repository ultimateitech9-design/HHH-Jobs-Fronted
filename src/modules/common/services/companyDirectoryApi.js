import { apiFetch } from '../../../utils/api';
import { buildCompanyLogoUrl } from './companyLogoUrl';

const COMPANY_BRANDING_OVERRIDES = [
  {
    names: ['indian trade mart'],
    slugs: ['indian-trade-mart'],
    domains: ['indiantrademart.com', 'www.indiantrademart.com'],
    logoUrl: 'https://indiantrademart.com/favicon-512x512.png',
    websiteUrl: 'https://indiantrademart.com/'
  }
];

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const normalizeKey = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase();

const pickPreferredText = (...values) => {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) return normalized;
  }

  return '';
};

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toBoolean = (value) => Boolean(value);

const toTextArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

const UPPERCASE_NAME_TOKENS = new Set(['ai', 'api', 'b2b', 'b2c', 'hr', 'it', 'qa', 'saas', 'seo', 'ui', 'ux']);

const titleCaseWord = (word = '') => {
  const raw = String(word || '').trim();
  if (!raw) return '';
  if (/[A-Z]/.test(raw)) return raw;
  if (UPPERCASE_NAME_TOKENS.has(raw.toLowerCase())) return raw.toUpperCase();
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
};

const normalizeCompanyDisplayName = (value = '', fallback = '') => {
  const candidate = pickPreferredText(value, fallback);
  if (!candidate) return 'Company';
  if (/[A-Z]/.test(candidate)) return candidate;

  return candidate
    .split(/\s+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(' ');
};

const toSlug = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toHostname = (value = '') => {
  const source = String(value || '').trim();
  if (!source) return '';

  try {
    const url = new URL(/^https?:\/\//i.test(source) ? source : `https://${source}`);
    return normalizeKey(url.hostname);
  } catch {
    return '';
  }
};

const findCompanyBrandingOverride = (entry = {}) => {
  const nameKey = normalizeKey(entry.name || entry.companyName);
  const slugKey = normalizeKey(entry.slug || entry.companySlug);
  const domainKey = toHostname(entry.websiteUrl || entry.companyWebsite || entry.applyUrl);

  return (
    COMPANY_BRANDING_OVERRIDES.find((branding) =>
      branding.names.includes(nameKey)
      || branding.slugs.includes(slugKey)
      || branding.domains.includes(domainKey)
    ) || null
  );
};

const normalizeCompanyBranding = (entry) => {
  if (!entry || typeof entry !== 'object') return entry;

  const branding = findCompanyBrandingOverride(entry);
  const websiteUrl = pickPreferredText(entry.websiteUrl, entry.companyWebsite, branding?.websiteUrl);
  const preferredLogoUrl = buildCompanyLogoUrl(entry.logoUrl, branding?.logoUrl, websiteUrl);
  const name = normalizeCompanyDisplayName(
    entry.name,
    pickPreferredText(entry.companyName, entry.company_name, entry.slug)
  );
  const categories = Array.from(
    new Set(
      toTextArray(entry.categories).concat(toTextArray(entry.display_tags))
    )
  ).slice(0, 4);

  const normalizedEntry = {
    ...entry,
    id: pickPreferredText(entry.id, entry.slug, entry.companySlug, normalizeKey(name)),
    slug: pickPreferredText(entry.slug, entry.companySlug, toSlug(name)),
    name,
    logoUrl: preferredLogoUrl || null,
    websiteUrl: websiteUrl || null,
    websiteHost: pickPreferredText(entry.websiteHost, toHostname(websiteUrl)) || null,
    location: pickPreferredText(entry.location, entry.city, entry.jobLocation) || null,
    description: pickPreferredText(entry.description, entry.about) || null,
    companySize: pickPreferredText(entry.companySize, entry.company_size) || null,
    industry: pickPreferredText(entry.industry, entry.industryType, entry.industry_type) || null,
    companyType: pickPreferredText(entry.companyType, entry.company_type) || null,
    portalProfile: toBoolean(entry.portalProfile),
    verifiedEmployer: toBoolean(entry.verifiedEmployer ?? entry.is_verified),
    portalJobs: toNumber(entry.portalJobs),
    liveJobs: toNumber(entry.liveJobs),
    totalJobs: toNumber(entry.totalJobs),
    remoteJobs: toNumber(entry.remoteJobs),
    applicationCount: toNumber(entry.applicationCount),
    liveFeed: toBoolean(entry.liveFeed),
    liveSourceCount: toNumber(entry.liveSourceCount),
    sponsored: toBoolean(entry.sponsored),
    sponsorRating: entry.sponsorRating ?? entry.display_rating ?? null,
    sponsorReviewsLabel: pickPreferredText(entry.sponsorReviewsLabel, entry.reviews_label) || null,
    sponsorSortOrder: entry.sponsorSortOrder ?? null,
    categories,
    premium: toBoolean(entry.premium),
    headline: pickPreferredText(entry.headline),
    latestActivityAt: entry.latestActivityAt || null
  };

  if (!branding) {
    return normalizedEntry;
  }

  return normalizedEntry;
};

const normalizeCompanyCollection = (companies = []) =>
  Array.isArray(companies) ? companies.map((company) => normalizeCompanyBranding(company)) : [];

const normalizeCompanyJobs = (jobs = {}) => ({
  total: Number(jobs?.total || 0),
  portal: Array.isArray(jobs?.portal)
    ? jobs.portal.map((job) => {
        const branding = findCompanyBrandingOverride(job);
        return {
          ...job,
          companyLogo: buildCompanyLogoUrl(
            job.companyLogo,
            branding?.logoUrl,
            pickPreferredText(job.companyWebsite, branding?.websiteUrl)
          ) || null
        };
      })
    : [],
  external: Array.isArray(jobs?.external)
    ? jobs.external.map((job) => {
        const branding = findCompanyBrandingOverride(job);
        return {
          ...job,
          companyLogo: buildCompanyLogoUrl(
            job.companyLogo,
            branding?.logoUrl,
            pickPreferredText(job.applyUrl, job.companyWebsite, branding?.websiteUrl)
          ) || null
        };
      })
    : []
});

export const getPublicCompanies = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);

  const query = params.toString();
  const path = query ? `/companies?${query}` : '/companies';

  try {
    const response = await apiFetch(path);
    const payload = await parseJson(response);

    if (!response.ok) {
      return {
        data: { companies: [], summary: null },
        error: payload?.message || `Request failed (${response.status})`
      };
    }

    return {
      data: {
        companies: normalizeCompanyCollection(payload?.companies || []),
        summary: payload?.summary || null
      },
      error: ''
    };
  } catch (error) {
    return {
      data: { companies: [], summary: null },
      error: error.message || 'Unable to load companies'
    };
  }
};

export const getSponsoredCompanies = async () => {
  try {
    const response = await apiFetch('/companies/sponsors');
    const payload = await parseJson(response);

    if (!response.ok) {
      return {
        data: { companies: [], summary: null },
        error: payload?.message || `Request failed (${response.status})`
      };
    }

    return {
      data: {
        companies: normalizeCompanyCollection(payload?.companies || []),
        summary: payload?.summary || null
      },
      error: ''
    };
  } catch (error) {
    return {
      data: { companies: [], summary: null },
      error: error.message || 'Unable to load sponsor companies'
    };
  }
};

export const getPublicCompanyDetail = async (companySlug) => {
  const slug = String(companySlug || '').trim();

  if (!slug) {
    return {
      data: { company: null, jobs: { total: 0, portal: [], external: [] } },
      error: 'Company slug is required'
    };
  }

  try {
    const response = await apiFetch(`/companies/${encodeURIComponent(slug)}`);
    const payload = await parseJson(response);

    if (!response.ok) {
      return {
        data: { company: null, jobs: { total: 0, portal: [], external: [] } },
        error: payload?.message || `Request failed (${response.status})`
      };
    }

    return {
      data: {
        company: normalizeCompanyBranding(payload?.company || null),
        jobs: normalizeCompanyJobs(payload?.jobs || { total: 0, portal: [], external: [] })
      },
      error: ''
    };
  } catch (error) {
    return {
      data: { company: null, jobs: { total: 0, portal: [], external: [] } },
      error: error.message || 'Unable to load company details'
    };
  }
};
