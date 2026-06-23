import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_ORIGIN = 'https://hhh-jobs.com';
const SITE_NAME = 'HHH Jobs';
const PUBLIC_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, nofollow';

const pageDefinitions = [
  {
    match: /^\/$/,
    label: 'Home',
    title: 'HHH Jobs | Jobs in India, Fresher Jobs, Hiring and Campus Placement',
    description: 'Find private jobs, government jobs, fresher hiring, campus placement opportunities, ATS resume tools, and verified employer connections on HHH Jobs.'
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
  }
];

const noIndexPublicPathPattern = /^\/(?:login|verify-otp|forgot-password|oauth|auth\/oauth|forbidden)(?:\/|$)/i;

const normalizePathname = (pathname = '/') => {
  const normalized = String(pathname || '/').replace(/\/+$/g, '') || '/';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const getSeoForPath = (pathname = '/') => {
  const normalizedPathname = normalizePathname(pathname);
  return pageDefinitions.find((definition) => definition.match.test(normalizedPathname)) || {
    label: 'HHH Jobs',
    title: 'HHH Jobs | Career, Hiring and Placement Platform',
    description: 'HHH Jobs helps candidates, recruiters, employers, and campuses move hiring forward with jobs, applications, ATS tools, and support.'
  };
};

const buildCanonicalSearch = (pathname = '/', search = '') => {
  const params = new URLSearchParams(search || '');
  const canonicalParams = new URLSearchParams();

  if (pathname === '/jobs') {
    ['location', 'category', 'sector'].forEach((key) => {
      const value = params.get(key);
      if (value) canonicalParams.set(key, value);
    });
  }

  if (pathname === '/govt-jobs') {
    const state = params.get('state');
    if (state) canonicalParams.set('state', state);
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

const PublicSeo = ({ isPortalWorkbench = false }) => {
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);
  const seo = useMemo(() => getSeoForPath(pathname), [pathname]);
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
    ensureMetaByName('robots').setAttribute('content', robotsContent);
    ensureMetaByName('googlebot').setAttribute('content', robotsContent);
    ensureMetaByName('bingbot').setAttribute('content', robotsContent);
    ensureCanonicalLink().setAttribute('href', shouldNoIndex ? SITE_ORIGIN : canonicalUrl);
    ensureAlternateTextLink().setAttribute('href', `${SITE_ORIGIN}/llms.txt`);

    ensureMetaByProperty('og:url').setAttribute('content', shouldNoIndex ? SITE_ORIGIN : canonicalUrl);
    ensureMetaByProperty('og:title').setAttribute('content', title);
    ensureMetaByProperty('og:description').setAttribute('content', description);
    ensureMetaByProperty('og:site_name').setAttribute('content', SITE_NAME);
    ensureMetaByProperty('og:type').setAttribute('content', 'website');

    ensureMetaByName('twitter:url').setAttribute('content', shouldNoIndex ? SITE_ORIGIN : canonicalUrl);
    ensureMetaByName('twitter:title').setAttribute('content', title);
    ensureMetaByName('twitter:description').setAttribute('content', description);

    if (!shouldNoIndex) {
      ensureJsonLdScript('hhh-route-breadcrumb-jsonld').textContent = JSON.stringify(
        buildBreadcrumbJsonLd({ label: seo.label, canonicalUrl })
      );
    }
  }, [canonicalUrl, seo.description, seo.label, seo.title, shouldNoIndex]);

  return null;
};

export default PublicSeo;
