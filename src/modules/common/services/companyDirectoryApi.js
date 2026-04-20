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

  if (!branding) {
    return {
      ...entry,
      logoUrl: preferredLogoUrl || null,
      websiteUrl: websiteUrl || null
    };
  }

  return {
    ...entry,
    logoUrl: preferredLogoUrl || null,
    websiteUrl: websiteUrl || null
  };
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
