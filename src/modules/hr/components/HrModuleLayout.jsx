import {
  FiBarChart2,
  FiBell,
  FiBook,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiHome,
  FiLink,
  FiSend,
  FiStar,
  FiUser,
  FiUsers,
  FiFileText
} from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const hrNavItems = [
  { to: '/portal/hr/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/portal/hr/jobs', label: 'Job Postings', icon: FiBriefcase },
  { to: '/portal/hr/candidates', label: 'Candidate DB', icon: FiUsers },
  { to: '/portal/hr/shortlisted', label: 'Shortlisted', icon: FiStar },
  { to: '/portal/hr/interests', label: 'Sent Interests', icon: FiSend },
  { to: '/portal/hr/interviews', label: 'Interviews', icon: FiCalendar },
  { to: '/portal/hr/campus-connections', label: 'Campus Connections', icon: FiLink },
  { to: '/portal/hr/campus-connections/activity/sent', label: 'Campus Activity', icon: FiClock },
  { to: '/portal/hr/campus-drives', label: 'Campus Drives', icon: FiBook },
  { to: '/portal/hr/notifications', label: 'Notifications', icon: FiBell },
  { to: '/portal/hr/analytics', label: 'Reports', icon: FiFileText },
  { to: '/portal/hr/employee-verification', label: 'Employee Verification', icon: FiCheckSquare },
  { to: '/portal/hr/profile', label: 'Company Profile', icon: FaBuilding }
];

const HrModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="hr"
      portalLabel="HR Dashboard"
      subtitle="Hiring"
      navItems={hrNavItems}
      support={{
        showCard: false,
        title: 'Hiring',
        text: 'Track roles, applicants, and interviews in one place.',
        to: '/portal/hr/jobs',
        cta: 'Open jobs',
        searchPlaceholder: 'Search candidates or jobs'
      }}
    />
  );
};

export default HrModuleLayout;
