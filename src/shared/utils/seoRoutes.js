const UUID_FRAGMENT_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export const extractUuidFromSlug = (value = '') => {
  const rawValue = String(value || '').trim();
  const match = rawValue.match(UUID_FRAGMENT_PATTERN);
  if (match) return match[0].toLowerCase();

  const lastSegment = rawValue
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .pop() || '';

  return lastSegment || rawValue;
};

export const extractSeoPathSegment = (value = '') => {
  const rawValue = String(value || '').trim();
  return rawValue
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .pop() || rawValue;
};

export const slugify = (value = '') => String(value || '')
  .normalize('NFKD')
  .replace(UUID_FRAGMENT_PATTERN, ' ')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

const cleanBasePath = (basePath = '') => String(basePath || '').replace(/\/+$/, '');
const MAX_ENTITY_SLUG_LENGTH = 96;

const trimSlug = (value = '', maxLength = MAX_ENTITY_SLUG_LENGTH) => {
  const slug = String(value || '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (slug.length <= maxLength) return slug;

  return slug
    .slice(0, maxLength)
    .replace(/-[^-]*$/g, '')
    .replace(/^-+|-+$/g, '') || slug.slice(0, maxLength).replace(/-+$/g, '');
};

const collapseRepeatedSlugWords = (value = '') => {
  const words = String(value || '').split('-').filter(Boolean);
  const collapsed = [];

  words.forEach((word) => {
    if (word !== collapsed[collapsed.length - 1]) {
      collapsed.push(word);
    }
  });

  return collapsed.join('-');
};

const dedupeSlugWords = (value = '') => {
  const words = String(value || '').split('-').filter(Boolean);
  const seen = new Set();
  const deduped = [];

  words.forEach((word) => {
    if (seen.has(word)) return;
    seen.add(word);
    deduped.push(word);
  });

  return deduped.join('-');
};

const joinSlugParts = (...parts) => {
  const slug = parts
    .map(slugify)
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'details';
};

const joinEntitySlugParts = (...parts) =>
  trimSlug(collapseRepeatedSlugWords(joinSlugParts(...parts)));

const joinCanonicalSlugParts = (...parts) =>
  trimSlug(collapseRepeatedSlugWords(joinSlugParts(...parts)));

const joinCanonicalJobSlugParts = (...parts) =>
  trimSlug(dedupeSlugWords(joinSlugParts(...parts)));

const pickShortestNonEmptySlug = (...candidates) => {
  const uniqueCandidates = [...new Set(candidates.map((candidate) => String(candidate || '').trim()).filter(Boolean))];
  if (uniqueCandidates.length === 0) return '';

  return uniqueCandidates.sort((left, right) => left.length - right.length)[0];
};

export const buildSeoPath = (basePath, ...parts) =>
  `${cleanBasePath(basePath)}/${joinSlugParts(...parts)}`;

export const buildSeoEntityPath = (basePath, id, ...parts) => {
  const entityId = extractUuidFromSlug(id);
  if (!entityId) return cleanBasePath(basePath) || '/';
  return `${cleanBasePath(basePath)}/${joinEntitySlugParts(...parts)}-${entityId}`;
};

export const buildJobSeoPath = (basePath, job = {}) => {
  const nestedJob = job?.job && typeof job.job === 'object' ? job.job : {};
  const title = job.jobTitle
    || job.job_title
    || job.title
    || job.roleTitle
    || nestedJob.jobTitle
    || nestedJob.job_title
    || nestedJob.title
    || nestedJob.roleTitle;
  const company = job.companyName
    || job.company_name
    || job.company
    || nestedJob.companyName
    || nestedJob.company_name
    || nestedJob.company;
  const location = job.cityName
    || job.city_name
    || job.jobLocation
    || job.job_location
    || job.location
    || nestedJob.cityName
    || nestedJob.city_name
    || nestedJob.jobLocation
    || nestedJob.job_location
    || nestedJob.location;
  const rawSeoSlug = job.seoSlug
    || job.seo_slug
    || job.slug
    || nestedJob.seoSlug
    || nestedJob.seo_slug
    || nestedJob.slug;
  const fallbackIdentifier = extractUuidFromSlug(
    job.id
      || job._id
      || job.jobId
      || job.job_id
      || nestedJob.id
      || nestedJob._id
      || nestedJob.jobId
      || nestedJob.job_id
      || ''
  );
  const structuredSlug = [title, company, location].some(Boolean)
    ? joinCanonicalJobSlugParts(title, company, location)
    : '';
  const explicitSlug = rawSeoSlug
    ? joinCanonicalJobSlugParts(rawSeoSlug)
    : '';
  const primarySlug = pickShortestNonEmptySlug(structuredSlug, explicitSlug);

  return `${cleanBasePath(basePath)}/${primarySlug || fallbackIdentifier || 'details'}`;
};

export const buildCompanySeoPath = (basePath = '/companies', company = {}) =>
  `${cleanBasePath(basePath)}/${joinCanonicalSlugParts(
    company.slug || company.companySlug || company.company_slug || company.name || company.companyName || company.company_name
  ) || 'company'}`;

export const buildGovtJobSeoPath = (basePath, job = {}) =>
  buildSeoPath(
    basePath,
    job.seoSlug || job.seo_slug || joinSlugParts(job.title, job.organization, job.state || job.category)
  );

export const buildCampusDriveSeoPath = (basePath, drive = {}) =>
  buildSeoEntityPath(
    basePath,
    drive.id || drive._id || drive.driveId || drive.drive_id,
    drive.seoSlug || drive.seo_slug,
    drive.jobTitle || drive.job_title || drive.title,
    drive.companyName || drive.company_name,
    drive.collegeName || drive.college_name || drive.location
  );
