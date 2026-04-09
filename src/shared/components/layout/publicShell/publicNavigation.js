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
        label: 'For Job Seekers',
        to: '/job-seekers',
        matchers: [/^\/job-seekers(?:\/.*)?$/]
      },
      {
        key: 'for-recruiters',
        label: 'For Recruiters',
        to: '/recruiters',
        matchers: [/^\/recruiters(?:\/.*)?$/]
      },
      {
        key: 'for-veterans',
        label: 'For Veterans',
        to: '/veterans',
        matchers: [/^\/veterans(?:\/.*)?$/, /^\/retired-employee(?:\/.*)?$/]
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
