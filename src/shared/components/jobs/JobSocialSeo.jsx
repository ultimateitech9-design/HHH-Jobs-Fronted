import { Helmet } from 'react-helmet-async';
import { canApplyInternallyToJob, getJobExternalApplyUrl } from '../../utils/jobApplication';
import { isJobSalaryDisclosed } from '../../utils/jobSalary';

const SITE_ORIGIN = 'https://hhh-jobs.com';
const DEFAULT_LOGO = `${SITE_ORIGIN}/favicon-circle.svg?v=20260713`;
const DEFAULT_SHARE_IMAGE = `${SITE_ORIGIN}/career-compass-hero-1024.webp?v=20260713`;

const cleanText = (value = '') => String(value || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const firstText = (...values) => values.map(cleanText).find(Boolean) || '';

const clampText = (value = '', maxLength = 160) => {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
};

const buildBrandedTitle = (primary, secondary = '') => {
  const fullTitle = [primary, secondary, 'HHH Jobs'].filter(Boolean).join(' | ');
  if (fullTitle.length <= 70) return fullTitle;
  return clampText(`${primary} | HHH Jobs`, 70);
};

const absoluteUrl = (value = '', fallback = '') => {
  const candidate = String(value || fallback || '').trim();
  if (!candidate) return '';

  try {
    return new URL(candidate, SITE_ORIGIN).toString();
  } catch {
    return fallback;
  }
};

const normalizeSkills = (job = {}) => {
  const values = [job.skills, job.requiredSkills, job.required_skills, job.tags]
    .flatMap((value) => Array.isArray(value) ? value : String(value || '').split(','))
    .map((value) => cleanText(value))
    .filter(Boolean);
  return [...new Set(values)].slice(0, 12);
};

const normalizeEmploymentType = (value = '') => {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return '';
  if (/full[ -]?time/.test(normalized)) return 'FULL_TIME';
  if (/part[ -]?time/.test(normalized)) return 'PART_TIME';
  if (/contract|freelance/.test(normalized)) return 'CONTRACTOR';
  if (/intern/.test(normalized)) return 'INTERN';
  if (/temporary/.test(normalized)) return 'TEMPORARY';
  if (/volunteer/.test(normalized)) return 'VOLUNTEER';
  return cleanText(value);
};

const normalizeSchemaDate = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const buildLocation = (job = {}) => {
  const locality = firstText(job.localityName, job.locality_name);
  const city = firstText(job.cityName, job.city_name, locality);
  const district = firstText(job.districtName, job.district_name);
  const state = firstText(job.stateName, job.state_name, job.state);
  const pincode = firstText(job.pincode, job.pinCode, job.pin_code);
  const raw = firstText(job.jobLocation, job.job_location, job.location);
  const label = [...new Set([locality, city, district, state].filter(Boolean))].join(', ') || raw || 'India';
  const rawParts = raw.split(',').map((part) => part.replace(/\b\d{6}\b/g, '').trim()).filter(Boolean);
  const headline = city || district || state || rawParts.at(-1) || 'India';
  return { locality, city, district, state, pincode, raw, label, headline };
};

const buildSalarySchema = (job = {}) => {
  if (!isJobSalaryDisclosed(job)) return null;
  const minValue = Number(job.salaryMin ?? job.salary_min ?? job.minSalary ?? job.minPrice ?? job.min_price ?? 0);
  const maxValue = Number(job.salaryMax ?? job.salary_max ?? job.maxSalary ?? job.maxPrice ?? job.max_price ?? 0);
  if (!(minValue > 0 || maxValue > 0)) return null;
  const salaryPeriod = firstText(job.salaryPeriod, job.salary_period, job.salaryType, job.salary_type).toLowerCase();
  const unitText = /year|annual|lpa|package/.test(salaryPeriod) ? 'YEAR' : 'MONTH';
  const isLpa = /lpa|lakh/.test(salaryPeriod);
  const normalizeSalaryValue = (value) => (isLpa && value > 0 && value < 1000 ? value * 100000 : value);

  return {
    '@type': 'MonetaryAmount',
    currency: firstText(job.salaryCurrency, job.salary_currency, 'INR'),
    value: {
      '@type': 'QuantitativeValue',
      ...(minValue > 0 ? { minValue: normalizeSalaryValue(minValue) } : {}),
      ...(maxValue > 0 ? { maxValue: normalizeSalaryValue(maxValue) } : {}),
      unitText
    }
  };
};

const buildJobPostingSchema = ({ job, canonicalUrl, kind }) => {
  const title = firstText(job.jobTitle, job.job_title, job.title, 'Job opportunity');
  const companyName = firstText(job.companyName, job.company_name, job.organization, job.department, 'HHH Jobs');
  const description = firstText(job.description, job.whoCanApply, job.who_can_apply, title);
  const category = firstText(job.category, job.sectorName, job.sector_name, job.sector);
  const employmentType = normalizeEmploymentType(firstText(job.employmentType, job.employment_type, job.postType, job.post_type));
  const experience = firstText(job.experienceLevel, job.experience_level, job.experienceRequired, job.experience_required);
  const qualification = firstText(job.qualification, job.qualLevel, job.qual_level, job.education);
  const location = buildLocation(job);
  const skills = normalizeSkills(job);
  const datePosted = normalizeSchemaDate(job.postingDate || job.postedAt || job.posted_at || job.createdAt || job.created_at);
  const validThrough = normalizeSchemaDate(job.validTill || job.valid_till || job.lastDate || job.last_date);
  const isRemote = /remote|work from home|wfh/i.test([
    employmentType,
    location.label,
    job.workMode,
    job.work_mode
  ].join(' '));
  const salary = buildSalarySchema(job);

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    url: canonicalUrl,
    directApply: kind !== 'government' && canApplyInternallyToJob(job),
    ...(datePosted ? { datePosted } : {}),
    ...(validThrough ? { validThrough } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(category ? { industry: category } : {}),
    ...(skills.length ? { skills: skills.join(', ') } : {}),
    ...(experience ? { experienceRequirements: experience } : {}),
    ...(qualification ? { qualifications: qualification } : {}),
    ...(salary ? { baseSalary: salary } : {}),
    ...(isRemote ? { jobLocationType: 'TELECOMMUTE' } : {}),
    ...(isRemote ? {
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'India'
      }
    } : {}),
    identifier: {
      '@type': 'PropertyValue',
      name: companyName,
      value: firstText(job.id, job.jobId, job.job_id, job.seoSlug, job.seo_slug, canonicalUrl)
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName,
      ...(kind === 'government' && absoluteUrl(job.officialUrl || job.official_url)
        ? { sameAs: absoluteUrl(job.officialUrl || job.official_url) }
        : absoluteUrl(job.companyWebsite || job.company_website)
          ? { sameAs: absoluteUrl(job.companyWebsite || job.company_website) }
          : {}),
      logo: absoluteUrl(job.companyLogo || job.company_logo, DEFAULT_LOGO)
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location.city || location.locality || location.district || location.state || location.raw || 'India',
        ...(location.state ? { addressRegion: location.state } : {}),
        ...(location.pincode ? { postalCode: location.pincode } : {}),
        addressCountry: 'IN'
      }
    }
  };
};

const JobSocialSeo = ({ job, canonicalPath, kind = 'private' }) => {
  if (!job) return null;

  const jobTitle = firstText(job.jobTitle, job.job_title, job.title, 'Job opportunity');
  const organization = firstText(job.companyName, job.company_name, job.organization, job.department, 'HHH Jobs');
  const category = firstText(job.category, job.sectorName, job.sector_name, job.sector);
  const employmentType = firstText(job.employmentType, job.employment_type, job.postType, job.post_type);
  const location = buildLocation(job);
  const skills = normalizeSkills(job);
  const title = kind === 'government'
    ? buildBrandedTitle(`${jobTitle} Recruitment${location.state ? ` in ${location.state}` : ''}`, organization)
    : buildBrandedTitle(`${jobTitle} Jobs in ${location.headline}`, organization);
  const jobDetails = [category, employmentType, skills.slice(0, 4).join(', ')].filter(Boolean).join(', ');
  const privateApplyLabel = getJobExternalApplyUrl(job) && !canApplyInternallyToJob(job)
    ? 'apply on the company careers site'
    : 'apply on HHH Jobs';
  const factualIntro = kind === 'government'
    ? `${organization} ${jobTitle} recruitment${location.state ? ` in ${location.state}` : ''}. Check eligibility, vacancies, deadline, and official application details.`
    : `${jobTitle} opening at ${organization} in ${location.label}. ${jobDetails ? `Check ${jobDetails} and ${privateApplyLabel}.` : `Review the role details and ${privateApplyLabel}.`}`;
  const description = clampText(`${factualIntro} ${cleanText(job.description || '')}`, 165);
  const keywords = [...new Set([
    `${jobTitle} jobs`,
    `${jobTitle} jobs in ${location.headline}`,
    `${jobTitle} vacancy in ${location.headline}`,
    location.state && `${jobTitle} jobs in ${location.state}`,
    category && `${category} jobs in ${location.headline}`,
    `${organization} careers`,
    category,
    employmentType,
    ...skills.slice(0, 6),
    kind === 'government' ? 'government jobs' : 'private jobs',
    'HHH Jobs'
  ].map(cleanText).filter(Boolean))].join(', ');
  const canonicalUrl = absoluteUrl(canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '/jobs'));
  const imageUrl = absoluteUrl(job.companyLogo || job.company_logo, DEFAULT_SHARE_IMAGE);
  const schema = buildJobPostingSchema({ job, canonicalUrl, kind });

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={`${organization} ${jobTitle} job opportunity`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default JobSocialSeo;
