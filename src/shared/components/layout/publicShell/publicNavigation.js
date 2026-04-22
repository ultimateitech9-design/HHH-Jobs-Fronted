import { BLOG_BASE_URL } from '../../../utils/externalLinks.js';

export const getPublicNavItems = ({ jobsNavPath }) => [
  {
    key: 'home',
    to: '/',
    label: 'Home',
    matchers: [/^\/$/]
  },
  {
    key: 'for-you',
    label: 'For You',
    children: [
      {
        key: 'for-job-seekers',
        label: 'Student/Professional',
        to: '/job-seekers',
        matchers: [/^\/job-seekers(?:\/.*)?$/]
      },
      {
        key: 'for-recruiters',
        label: 'HR',
        to: '/recruiters',
        matchers: [/^\/recruiters(?:\/.*)?$/]
      },
      {
        key: 'for-campus-connect',
        label: 'Campus Connect',
        to: '/campus-connect',
        matchers: [/^\/campus-connect(?:\/.*)?$/]
      }
    ]
  },
  {
    key: 'jobs',
    to: jobsNavPath,
    label: 'Jobs',
    matchers: [/^\/jobs(?:\/.*)?$/, /^\/global-jobs(?:\/.*)?$/]
  },
  {
    key: 'companies',
    to: '/companies',
    label: 'Companies',
    matchers: [/^\/companies(?:\/.*)?$/, /^\/employer-home(?:\/.*)?$/]
  },
  {
    key: 'pricing',
    to: '/services',
    label: 'Pricing',
    matchers: [/^\/services(?:\/.*)?$/]
  },
  {
    key: 'about',
    to: '/about-us',
    label: 'About',
    matchers: [/^\/about-us(?:\/.*)?$/]
  },
  {
    key: 'blog',
    to: BLOG_BASE_URL,
    label: 'Blog',
    matchers: [/^\/blog(?:\/.*)?$/]
  },
  {
    key: 'contact',
    to: '/contact-us',
    label: 'Contact',
    matchers: [/^\/contact-us(?:\/.*)?$/]
  }
];
