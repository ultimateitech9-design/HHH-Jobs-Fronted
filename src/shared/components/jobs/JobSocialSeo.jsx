import { Helmet } from 'react-helmet-async';

const SITE_ORIGIN = 'https://hhh-jobs.com';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/hhh-job-logo.png`;

const cleanText = (value = '') => String(value || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const absoluteUrl = (value = '', fallback = '') => {
  const candidate = String(value || fallback || '').trim();
  if (!candidate) return '';

  try {
    return new URL(candidate, SITE_ORIGIN).toString();
  } catch {
    return fallback;
  }
};

const buildJobPostingSchema = ({ job, canonicalUrl, kind }) => {
  const title = cleanText(job?.jobTitle || job?.title || 'Job opportunity');
  const companyName = cleanText(job?.companyName || job?.organization || 'HHH Jobs');
  const description = cleanText(job?.description || job?.whoCanApply || title);
  const location = cleanText(job?.jobLocation || job?.state || 'India');
  const datePosted = job?.postingDate || job?.createdAt || job?.created_at || undefined;
  const validThrough = job?.validTill || job?.valid_till || job?.lastDate || undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    url: canonicalUrl,
    ...(datePosted ? { datePosted } : {}),
    ...(validThrough ? { validThrough } : {}),
    ...(job?.employmentType ? { employmentType: cleanText(job.employmentType) } : {}),
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName,
      sameAs: kind === 'government' ? absoluteUrl(job?.officialUrl) || undefined : undefined,
      logo: absoluteUrl(job?.companyLogo || job?.company_logo, DEFAULT_IMAGE)
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
        addressCountry: 'IN'
      }
    }
  };
};

const JobSocialSeo = ({ job, canonicalPath, kind = 'private' }) => {
  if (!job) return null;

  const jobTitle = cleanText(job.jobTitle || job.title || 'Job opportunity');
  const organization = cleanText(job.companyName || job.organization || 'HHH Jobs');
  const title = `${jobTitle} at ${organization} | HHH Jobs`;
  const fallbackDescription = kind === 'government'
    ? `View eligibility, deadline, vacancies, and official application details for ${jobTitle}.`
    : `View skills, location, salary, and application details for ${jobTitle} at ${organization}.`;
  const description = cleanText(job.description || fallbackDescription).slice(0, 180);
  const canonicalUrl = absoluteUrl(canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '/jobs'));
  const imageUrl = absoluteUrl(job.companyLogo || job.company_logo, DEFAULT_IMAGE);
  const schema = buildJobPostingSchema({ job, canonicalUrl, kind });

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={`${organization} job opportunity`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default JobSocialSeo;
