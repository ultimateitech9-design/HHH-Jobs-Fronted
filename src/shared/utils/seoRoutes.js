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

  if (!lastSegment || !lastSegment.includes('-')) return lastSegment || rawValue;

  const parts = lastSegment.split('-').filter(Boolean);
  const candidate = parts[parts.length - 1] || '';
  return /^[a-z0-9]{6,}$/i.test(candidate) ? candidate : lastSegment;
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

const joinSlugParts = (...parts) => {
  const slug = parts
    .map(slugify)
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'details';
};

export const buildSeoPath = (basePath, ...parts) =>
  `${cleanBasePath(basePath)}/${joinSlugParts(...parts)}`;

export const buildSeoEntityPath = (basePath, id, ...parts) => {
  const entityId = extractUuidFromSlug(id);
  if (!entityId) return cleanBasePath(basePath) || '/';
  return `${cleanBasePath(basePath)}/${joinSlugParts(...parts)}-${entityId}`;
};

export const buildJobSeoPath = (basePath, job = {}) =>
  buildSeoEntityPath(
    basePath,
    job.details_id || job.id || job._id || job.portalJobId || job.jobId || job.job_id,
    job.seoSlug,
    job.jobTitle || job.job_title || job.title,
    job.companyName || job.company_name || job.company,
    job.cityName || job.city_name || job.jobLocation || job.job_location || job.location
  );

export const buildGovtJobSeoPath = (basePath, job = {}) =>
  buildSeoPath(
    basePath,
    job.seoSlug || job.seo_slug,
    job.title,
    job.organization,
    job.state || job.category
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
