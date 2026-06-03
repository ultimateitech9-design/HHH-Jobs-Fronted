import { Briefcase, Mail, MessageCircle, Newspaper, Phone } from 'lucide-react';
import { BLOG_BASE_URL } from '../../../../utils/externalLinks.js';
import { HHH_JOBS_MASTER_CONTACT_NUMBERS, HHH_JOBS_SUPPORT_EMAIL } from '../../../../constants/contactInfo.js';

export const footerSocialLinks = [
  { label: 'Support', href: '/contact-us', icon: MessageCircle },
  { label: 'Careers', href: '/careers', icon: Briefcase },
  { label: 'Updates', href: BLOG_BASE_URL, icon: Newspaper, newTab: false },
  { label: 'Call', href: HHH_JOBS_MASTER_CONTACT_NUMBERS[0].href, icon: Phone },
  { label: 'Email', href: `mailto:${HHH_JOBS_SUPPORT_EMAIL}`, icon: Mail }
];
