import { FiBriefcase, FiMail, FiMessageCircle, FiPhone, FiTwitter } from 'react-icons/fi';
import { BLOG_BASE_URL } from '../../../../utils/externalLinks.js';
import { HHH_JOBS_MASTER_CONTACT_NUMBERS, HHH_JOBS_SUPPORT_EMAIL } from '../../../../constants/contactInfo.js';

export const footerSocialLinks = [
  { label: 'Support', href: '/contact-us', icon: FiMessageCircle },
  { label: 'Careers', href: '/careers', icon: FiBriefcase },
  { label: 'Updates', href: BLOG_BASE_URL, icon: FiTwitter, newTab: false },
  { label: 'Call', href: HHH_JOBS_MASTER_CONTACT_NUMBERS[0].href, icon: FiPhone },
  { label: 'Email', href: `mailto:${HHH_JOBS_SUPPORT_EMAIL}`, icon: FiMail }
];
