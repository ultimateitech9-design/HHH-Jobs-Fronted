import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_ORIGIN = 'https://hhh-jobs.com';
const SITE_NAME = 'HHH Jobs';
const PUBLIC_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, nofollow';
const DEFAULT_KEYWORDS = 'jobs in India, private jobs, government jobs, fresher jobs, verified employers, campus placements, HHH Jobs';

const pageDefinitions = [
  {
    match: /^\/$/,
    label: 'Home',
    title: 'HHH Jobs | Jobs in India, Fresher Jobs, Hiring and Campus Placement',
    description: 'Find private jobs, government jobs, fresher hiring, campus placement opportunities, ATS resume tools, and verified employer connections on HHH Jobs.'
  },
  {
    match: /^\/jobs\/categories$/,
    label: 'Jobs by Category',
    title: 'Jobs by Category and Role in India | HHH Jobs',
    description: 'Browse verified private jobs by role and category, compare active hiring demand, and find relevant openings across India.'
  },
  {
    match: /^\/jobs\/cities$/,
    label: 'Jobs by Location',
    title: 'Jobs by State, District, City and Pincode | HHH Jobs',
    description: 'Find nearby jobs across India using mapped state, district, city, locality, and pincode filters on HHH Jobs.'
  },
  {
    match: /^\/jobs\/sectors$/,
    label: 'Jobs by Sector',
    title: 'Jobs by Industry and Sector in India | HHH Jobs',
    description: 'Explore active job openings by industry and sector, including technology, sales, finance, healthcare, education, and manufacturing.'
  },
  {
    match: /^\/jobs(?:\/.*)?$/,
    label: 'Jobs',
    title: 'Jobs in India | Private Jobs, Fresher Jobs and Local Hiring | HHH Jobs',
    description: 'Search latest jobs by role, skill, company, sector, state, district, city, and pincode. Apply to relevant openings with HHH Jobs.'
  },
  {
    match: /^\/govt-jobs(?:\/.*)?$/,
    label: 'Government Jobs',
    title: 'Government Jobs in India | Sarkari Job Alerts | HHH Jobs',
    description: 'Explore government job updates, departments, eligibility, vacancies, state filters, and application links for serious candidates.'
  },
  {
    match: /^\/companies(?:\/.*)?$/,
    label: 'Companies',
    title: 'Companies Hiring on HHH Jobs | Employer Directory and Open Roles',
    description: 'Discover verified companies, employer profiles, active job openings, and hiring opportunities across India on HHH Jobs.'
  },
  {
    match: /^\/ats$/,
    label: 'ATS Resume Checker',
    title: 'Free ATS Resume Checker | Resume Score and Skill Match | HHH Jobs',
    description: 'Check resume quality, ATS readiness, keyword match, role fit, and improvement areas before applying to jobs.'
  },
  {
    match: /^\/job-seekers$/,
    label: 'Job Seekers',
    title: 'Job Seekers | Career Search, Applications and Alerts | HHH Jobs',
    description: 'Create a stronger job search workflow with profile guidance, job alerts, application tracking, and AI career support.'
  },
  {
    match: /^\/recruiters$/,
    label: 'Recruiters',
    title: 'Recruiters and HR Hiring Platform | Post Jobs and Find Candidates | HHH Jobs',
    description: 'Post jobs, discover relevant candidates, manage applications, use ATS scoring, and coordinate hiring with HHH Jobs.'
  },
  {
    match: /^\/freshers$/,
    label: 'Freshers',
    title: 'Fresher Jobs and Entry Level Hiring | HHH Jobs',
    description: 'Find fresher jobs, internships, entry-level roles, resume guidance, interview preparation, and campus hiring opportunities.'
  },
  {
    match: /^\/veterans$/,
    label: 'Experienced Professionals',
    title: 'Experienced Professional Jobs | Mid Career and Senior Roles | HHH Jobs',
    description: 'Explore professional roles, experienced hiring, career transitions, and relevant opportunities by skill, sector, and location.'
  },
  {
    match: /^\/campus-connect(?:\/.*)?$/,
    label: 'Campus Connect',
    title: 'Campus Placement and College Hiring Platform | HHH Jobs Campus Connect',
    description: 'Connect campuses with companies, manage drives, place students, and track campus hiring outcomes with HHH Jobs.'
  },
  {
    match: /^\/retired-employee$/,
    label: 'Retired Employee',
    title: 'Jobs for Retired Employees and Experienced Talent | HHH Jobs',
    description: 'Find suitable roles for retired employees, consultants, mentors, and experienced professionals looking for flexible work.'
  },
  {
    match: /^\/services$/,
    label: 'Services',
    title: 'HHH Jobs Services | Hiring, ATS, Career and Placement Support',
    description: 'Explore HHH Jobs services for employers, candidates, campuses, ATS scoring, career support, and recruitment workflows.'
  },
  {
    match: /^\/emp-verify$/,
    label: 'Employee Verification',
    title: 'Employee Verification and Background Support | HHH Jobs',
    description: 'Verify employment-related information and support safer hiring workflows with structured HHH Jobs verification services.'
  },
  {
    match: /^\/blog(?:\/.*)?$/,
    label: 'Blog',
    title: 'Career and Hiring Blog | Resume, Interview and HR Guidance | HHH Jobs',
    description: 'Read practical hiring, resume, ATS, interview, fresher, and application guidance from HHH Jobs.'
  },
  {
    match: /^\/about-us$/,
    label: 'About',
    title: 'About HHH Jobs | Hiring and Career Platform in India',
    description: 'Learn how HHH Jobs helps candidates, recruiters, employers, and campuses improve hiring outcomes with trusted workflows.'
  },
  {
    match: /^\/contact-us$/,
    label: 'Contact',
    title: 'Contact HHH Jobs | Support, Hiring and Partnership Enquiries',
    description: 'Contact HHH Jobs for account support, hiring assistance, partnerships, platform questions, and business enquiries.'
  },
  {
    match: /^\/help-center$/,
    label: 'Help Center',
    title: 'HHH Jobs Help Center | Candidate, Employer and Account Support',
    description: 'Find support guidance for job search, employer accounts, applications, subscriptions, safety, and platform access.'
  },
  {
    match: /^\/privacy-policy$/,
    label: 'Privacy Policy',
    title: 'Privacy Policy | HHH Jobs',
    description: 'Read how HHH Jobs handles user information, account data, hiring workflows, security, and privacy commitments.'
  },
  {
    match: /^\/terms-and-conditions$/,
    label: 'Terms',
    title: 'Terms and Conditions | HHH Jobs',
    description: 'Review HHH Jobs platform terms, user responsibilities, hiring usage, account rules, and service conditions.'
  },
  {
    match: /^\/trust-and-safety$/,
    label: 'Trust and Safety',
    title: 'Trust and Safety | HHH Jobs',
    description: 'Understand HHH Jobs safety standards for candidates, employers, campuses, listings, account usage, and support.'
  },
  {
    match: /^\/sitemap$/,
    label: 'Sitemap',
    title: 'Sitemap | HHH Jobs',
    description: 'Browse important public pages across jobs, companies, candidate resources, employer services, support, and policies.'
  },
  {
    match: /^\/careers$/,
    label: 'Careers',
    title: 'Careers at HHH Jobs | Join Our Team',
    description: 'Explore career opportunities at HHH Jobs and help build trusted hiring, placement, and career technology for India.'
  },
  {
    match: /^\/grievances$/,
    label: 'Grievances',
    title: 'Grievance Redressal | HHH Jobs',
    description: 'Submit and track platform grievances related to accounts, job listings, employers, safety, privacy, or HHH Jobs services.'
  },
  {
    match: /^\/report-issue$/,
    label: 'Report an Issue',
    title: 'Report a Job or Account Issue | HHH Jobs',
    description: 'Report suspicious jobs, account problems, incorrect company information, or platform issues to the HHH Jobs support team.'
  },
  {
    match: /^\/fraud-alert$/,
    label: 'Fraud Alert',
    title: 'Job Fraud Alerts and Safe Hiring Guidance | HHH Jobs',
    description: 'Learn how to identify fake jobs, payment scams, impersonation, and unsafe recruitment activity before applying.'
  },
  {
    match: /^\/summons-notices$/,
    label: 'Summons and Notices',
    title: 'Summons and Legal Notices | HHH Jobs',
    description: 'View official summons, legal notices, and compliance information published by HHH Jobs.'
  },
  {
    match: /^\/credits$/,
    label: 'Credits',
    title: 'Platform Credits and Acknowledgements | HHH Jobs',
    description: 'View technology, content, design, and platform acknowledgements for HHH Jobs.'
  }
];

const noIndexPublicPathPattern = /^\/(?:login|verify-otp|forgot-password|oauth|auth\/oauth|forbidden)(?:\/|$)/i;

const normalizePathname = (pathname = '/') => {
  const normalized = String(pathname || '/').replace(/\/+$/g, '') || '/';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const cleanSeoValue = (value = '', maxLength = 80) => String(value || '')
  .replace(/[<>]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

const clampSeoText = (value = '', maxLength = 160) => {
  const text = cleanSeoValue(value, maxLength + 20);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
};

const humanizeSlug = (value = '') => {
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();
  return cleanSeoValue(decoded.replace(/[-_]+/g, ' '), 90)
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const joinKeywords = (...values) => [...new Set(values
  .flatMap((value) => String(value || '').split(','))
  .map((value) => cleanSeoValue(value, 60))
  .filter(Boolean))]
  .slice(0, 16)
  .join(', ');

const getSearchContext = (search = '') => {
  const params = new URLSearchParams(search || '');
  const firstParam = (...keys) => cleanSeoValue(
    keys.map((key) => params.get(key)).find(Boolean) || '',
    60
  );

  const role = firstParam('search', 'role', 'keyword', 'q');
  const company = firstParam('company');
  const category = firstParam('category', 'sector');
  const state = firstParam('stateName', 'state');
  const district = firstParam('districtName', 'district');
  const city = firstParam('cityName', 'city');
  const locality = firstParam('localityName', 'locality');
  const pincode = firstParam('pincode', 'pinCode', 'pin_code');
  const fallbackLocation = firstParam('location');
  const location = locality || city || district || state || pincode || fallbackLocation;
  const locationTrail = [...new Set([locality, city, district, state].filter(Boolean))].join(', ')
    || pincode
    || fallbackLocation;

  return { role, company, category, state, district, city, locality, pincode, location, locationTrail };
};

const buildJobsListingSeo = (search = '') => {
  const { role, company, category, state, district, city, locality, pincode, location, locationTrail } = getSearchContext(search);
  const intent = role || company || category || 'Private';
  const heading = `${intent} Jobs${location ? ` in ${location}` : ' in India'}`;
  const targetLocation = locationTrail || 'India';

  return {
    label: heading,
    title: clampSeoText(`${heading} | Latest Verified Openings | HHH Jobs`, 68),
    description: clampSeoText(
      `Find latest ${intent.toLowerCase()} job openings in ${targetLocation}. Compare verified employers, required skills, salary, experience, and application details on HHH Jobs.`,
      160
    ),
    keywords: joinKeywords(
      heading,
      role && location && `${role} jobs in ${location}`,
      role && location && `${role} vacancy in ${location}`,
      category && location && `${category} jobs in ${location}`,
      category && city && `${category} careers in ${city}`,
      company && location && `${company} jobs in ${location}`,
      company && `${company} careers`,
      role && `${role} vacancies`,
      category && `${category} careers`,
      location && `jobs near ${location}`,
      city && `latest jobs in ${city}`,
      locality && `jobs in ${locality}`,
      district && `jobs in ${district} district`,
      state && `jobs in ${state}`,
      pincode && `jobs near ${pincode}`,
      'private jobs',
      'fresher jobs',
      SITE_NAME
    )
  };
};

const buildGovernmentJobsSeo = (search = '') => {
  const { role, category, state } = getSearchContext(search);
  const intent = role || category || 'Government';
  const heading = `${intent} Jobs${state ? ` in ${state}` : ' in India'}`;
  return {
    label: heading,
    title: clampSeoText(`${heading} | Latest Sarkari Vacancies | HHH Jobs`, 68),
    description: clampSeoText(
      `Explore latest ${heading.toLowerCase()}, eligibility, vacancies, deadlines, results, admit cards, and official application links on HHH Jobs.`,
      160
    ),
    keywords: joinKeywords(heading, role, category, state, 'sarkari jobs', 'government vacancies', 'government job alerts', SITE_NAME)
  };
};

const getSeoForRoute = (pathname = '/', search = '') => {
  const normalizedPathname = normalizePathname(pathname);
  if (normalizedPathname === '/jobs') return buildJobsListingSeo(search);
  if (normalizedPathname === '/govt-jobs') return buildGovernmentJobsSeo(search);

  const companyMatch = normalizedPathname.match(/^\/companies\/([^/]+)$/i);
  if (companyMatch) {
    const company = humanizeSlug(companyMatch[1]);
    return {
      label: company,
      title: clampSeoText(`${company} Jobs and Company Profile | HHH Jobs`, 68),
      description: clampSeoText(`View ${company} company information, active job openings, hiring categories, locations, and application details on HHH Jobs.`),
      keywords: joinKeywords(`${company} jobs`, `${company} careers`, `${company} vacancies`, 'company jobs', SITE_NAME)
    };
  }

  const blogMatch = normalizedPathname.match(/^\/blog\/([^/]+)$/i);
  if (blogMatch) {
    const topic = humanizeSlug(blogMatch[1]);
    return {
      label: topic,
      title: clampSeoText(`${topic} | HHH Jobs Career Guide`, 68),
      description: clampSeoText(`Read practical guidance about ${topic.toLowerCase()}, careers, hiring, resumes, interviews, and job search from HHH Jobs.`),
      keywords: joinKeywords(topic, 'career guide', 'job search tips', 'hiring advice', SITE_NAME)
    };
  }

  const definition = pageDefinitions.find((candidate) => candidate.match.test(normalizedPathname));
  if (definition) {
    return {
      ...definition,
      keywords: definition.keywords || joinKeywords(definition.label, definition.title, DEFAULT_KEYWORDS)
    };
  }

  const fallbackLabel = humanizeSlug(normalizedPathname.split('/').filter(Boolean).pop() || SITE_NAME);
  return {
    label: fallbackLabel || SITE_NAME,
    title: clampSeoText(`${fallbackLabel || SITE_NAME} | Career and Hiring Platform`, 68),
    description: clampSeoText(`${SITE_NAME} helps candidates, recruiters, employers, and campuses with ${fallbackLabel.toLowerCase()}, jobs, applications, ATS tools, and support.`),
    keywords: joinKeywords(fallbackLabel, DEFAULT_KEYWORDS)
  };
};

const buildCanonicalSearch = (pathname = '/', search = '') => {
  const canonicalParams = new URLSearchParams();

  if (pathname === '/jobs') {
    const context = getSearchContext(search);
    if (context.role) canonicalParams.set('search', context.role);
    if (context.company) canonicalParams.set('company', context.company);
    if (context.state) canonicalParams.set('stateName', context.state);
    if (context.district) canonicalParams.set('districtName', context.district);
    if (context.city) canonicalParams.set('cityName', context.city);
    if (context.locality) canonicalParams.set('localityName', context.locality);
    if (context.location && !context.locality && !context.city && !context.district && !context.state && !context.pincode) {
      canonicalParams.set('location', context.location);
    }
    if (context.pincode) canonicalParams.set('pincode', context.pincode);
    if (context.category) canonicalParams.set('category', context.category);
  }

  if (pathname === '/govt-jobs') {
    const context = getSearchContext(search);
    if (context.role) canonicalParams.set('search', context.role);
    if (context.state) canonicalParams.set('state', context.state);
    if (context.category) canonicalParams.set('category', context.category);
  }

  const canonicalSearch = canonicalParams.toString();
  return canonicalSearch ? `?${canonicalSearch}` : '';
};

const buildCanonicalUrl = (pathname = '/', search = '') => {
  const normalizedPathname = normalizePathname(pathname);
  return `${SITE_ORIGIN}${normalizedPathname}${buildCanonicalSearch(normalizedPathname, search)}`;
};

const ensureMetaByName = (name) => {
  let node = document.head.querySelector(`meta[name="${name}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute('name', name);
    document.head.appendChild(node);
  }
  return node;
};

const ensureMetaByProperty = (property) => {
  let node = document.head.querySelector(`meta[property="${property}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute('property', property);
    document.head.appendChild(node);
  }
  return node;
};

const ensureCanonicalLink = () => {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'canonical');
    document.head.appendChild(node);
  }
  return node;
};

const ensureAlternateTextLink = () => {
  let node = document.head.querySelector('link[data-hhh-ai-discovery="true"]');
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'alternate');
    node.setAttribute('type', 'text/plain');
    node.setAttribute('title', 'HHH Jobs AI discovery map');
    node.setAttribute('data-hhh-ai-discovery', 'true');
    document.head.appendChild(node);
  }
  return node;
};

const ensureJsonLdScript = (id) => {
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement('script');
    node.id = id;
    node.type = 'application/ld+json';
    document.head.appendChild(node);
  }
  return node;
};

const buildBreadcrumbJsonLd = ({ label, canonicalUrl }) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_ORIGIN
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: label || SITE_NAME,
      item: canonicalUrl
    }
  ]
});

const getWebPageType = (pathname = '/') => {
  if (pathname === '/jobs' || pathname === '/govt-jobs') return 'SearchResultsPage';
  if (/^\/(?:jobs\/(?:categories|cities|sectors)|companies|blog)$/.test(pathname)) return 'CollectionPage';
  if (pathname === '/about-us') return 'AboutPage';
  if (pathname === '/contact-us') return 'ContactPage';
  return 'WebPage';
};

const buildWebPageJsonLd = ({ label, title, description, canonicalUrl, pathname }) => ({
  '@context': 'https://schema.org',
  '@type': getWebPageType(pathname),
  name: title,
  description,
  url: canonicalUrl,
  inLanguage: 'en-IN',
  isPartOf: {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_ORIGIN
  },
  about: {
    '@type': 'Thing',
    name: label
  }
});

const PublicSeo = ({ isPortalWorkbench = false }) => {
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);
  const seo = useMemo(
    () => getSeoForRoute(pathname, location.search),
    [location.search, pathname]
  );
  const canonicalUrl = useMemo(
    () => buildCanonicalUrl(pathname, location.search),
    [location.search, pathname]
  );
  const shouldNoIndex = isPortalWorkbench || noIndexPublicPathPattern.test(pathname);

  useEffect(() => {
    const robotsContent = shouldNoIndex ? NOINDEX_ROBOTS : PUBLIC_ROBOTS;
    const title = shouldNoIndex ? `${SITE_NAME} Account Access` : seo.title;
    const description = shouldNoIndex
      ? 'Account access page for HHH Jobs users.'
      : seo.description;

    document.title = title;
    ensureMetaByName('title').setAttribute('content', title);
    ensureMetaByName('description').setAttribute('content', description);
    ensureMetaByName('keywords').setAttribute('content', shouldNoIndex ? SITE_NAME : seo.keywords || DEFAULT_KEYWORDS);
    ensureMetaByName('robots').setAttribute('content', robotsContent);
    ensureMetaByName('googlebot').setAttribute('content', robotsContent);
    ensureMetaByName('bingbot').setAttribute('content', robotsContent);
    ensureCanonicalLink().setAttribute('href', shouldNoIndex ? SITE_ORIGIN : canonicalUrl);
    ensureAlternateTextLink().setAttribute('href', `${SITE_ORIGIN}/llms.txt`);

    ensureMetaByProperty('og:url').setAttribute('content', shouldNoIndex ? SITE_ORIGIN : canonicalUrl);
    ensureMetaByProperty('og:title').setAttribute('content', title);
    ensureMetaByProperty('og:description').setAttribute('content', description);
    ensureMetaByProperty('og:site_name').setAttribute('content', SITE_NAME);
    ensureMetaByProperty('og:type').setAttribute('content', /^\/blog\//.test(pathname) ? 'article' : 'website');

    ensureMetaByName('twitter:url').setAttribute('content', shouldNoIndex ? SITE_ORIGIN : canonicalUrl);
    ensureMetaByName('twitter:title').setAttribute('content', title);
    ensureMetaByName('twitter:description').setAttribute('content', description);

    if (!shouldNoIndex) {
      ensureJsonLdScript('hhh-route-breadcrumb-jsonld').textContent = JSON.stringify(
        buildBreadcrumbJsonLd({ label: seo.label, canonicalUrl })
      );
      ensureJsonLdScript('hhh-route-webpage-jsonld').textContent = JSON.stringify(
        buildWebPageJsonLd({
          label: seo.label,
          title,
          description,
          canonicalUrl,
          pathname
        })
      );
    } else {
      document.getElementById('hhh-route-breadcrumb-jsonld')?.remove();
      document.getElementById('hhh-route-webpage-jsonld')?.remove();
    }
  }, [canonicalUrl, pathname, seo.description, seo.keywords, seo.label, seo.title, shouldNoIndex]);

  return null;
};

export default PublicSeo;
