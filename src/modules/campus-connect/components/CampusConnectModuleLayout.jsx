import {
  FiBarChart2,
  FiBell,
  FiBriefcase,
  FiFileText,
  FiLink,
  FiUser,
  FiUsers
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const campusNavItems = [
  { to: '/portal/campus-connect/dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { to: '/portal/campus-connect/students', label: 'Students', icon: FiUsers },
  { to: '/portal/campus-connect/drives', label: 'Campus Drives', icon: FiBriefcase },
  { to: '/portal/campus-connect/notifications', label: 'Notifications', icon: FiBell },
  { to: '/portal/campus-connect/connections', label: 'Company Connections', icon: FiLink },
  { to: '/portal/campus-connect/reports', label: 'Placement Reports', icon: FiFileText },
  { to: '/portal/campus-connect/profile', label: 'College Profile', icon: FiUser }
];

const CampusConnectModuleLayout = () => (
  <PortalWorkbenchLayout
    portalKey="campus-connect"
    portalLabel="Campus Connect"
    subtitle="Manage students, schedule drives, connect with companies, and track placements."
    navItems={campusNavItems}
  />
);

export default CampusConnectModuleLayout;
