import { BLOG_BASE_URL } from '../../../../utils/externalLinks.js';

export const footerLinkColumns = [
  {
    title: 'Latest Jobs',
    links: [
      { label: 'Latest Private Jobs', to: '/jobs' },
      { label: 'Fresher Jobs', to: '/freshers' },
      { label: 'Government Jobs', to: '/govt-jobs' },
      { label: 'Jobs by City', to: '/jobs/cities' },
      { label: 'Jobs by Sector', to: '/jobs/sectors' }
    ]
  },
  {
    title: 'Candidates',
    links: [
      { label: 'For Professionals', to: '/job-seekers' },
      { label: 'Resume ATS', to: '/ats' },
      { label: 'For Veterans', to: '/veterans' },
      { label: 'Career Resources', to: BLOG_BASE_URL }
    ]
  },
  {
    title: 'Employers',
    links: [
      { label: 'For Recruiters', to: '/recruiters' },
      { label: 'Companies', to: '/companies' },
      { label: 'Services', to: '/services' },
      { label: 'Employee Verification', to: '/emp-verify' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about-us' },
      { label: 'Contact Us', to: '/contact-us' },
      { label: 'Careers', to: '/careers' },
      { label: 'Blog', to: BLOG_BASE_URL }
    ]
  },
  {
    title: 'Legal & Safety',
    links: [
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms & Conditions', to: '/terms-and-conditions' },
      { label: 'Fraud Alert', to: '/fraud-alert' },
      { label: 'Trust & Safety', to: '/trust-and-safety' },
      { label: 'Grievances', to: '/grievances' }
    ]
  }
];
