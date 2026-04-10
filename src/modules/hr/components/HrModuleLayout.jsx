import {
  FiBarChart2,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiHome,
  FiUser,
  FiUsers,
  FiFileText
} from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const hrNavItems = [
  { to: '/portal/hr/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/portal/hr/jobs', label: 'Job Postings', icon: FiBriefcase },
  { to: '/portal/hr/candidates', label: 'Applicants', icon: FiUsers },
  { to: '/portal/hr/interviews', label: 'Interviews', icon: FiCalendar },
  { to: '/portal/hr/notifications', label: 'Hired', icon: FiBell },
  { to: '/portal/hr/analytics', label: 'Reports', icon: FiFileText },
  { to: '/portal/hr/employee-verification', label: 'Employee Verification', icon: FiCheckSquare },
  { to: '/portal/hr/profile', label: 'Company Profile', icon: FaBuilding }
];

const HrModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="hr"
      portalLabel="HR Dashboard"
      subtitle="Recruitment Workspace"
      navItems={hrNavItems}
      support={{
        showCard: false,
        title: 'Plan Status',
        text: 'Premium plan active. Keep job postings updated daily.',
        to: '/portal/hr/jobs',
        cta: 'Open hiring queue',
        searchPlaceholder: 'Search candidates, jobs, interviews'
      }}
    />
  );
};

export default HrModuleLayout;
