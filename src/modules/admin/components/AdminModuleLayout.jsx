import {
  FiBarChart2,
  FiBriefcase,
  FiCreditCard,
  FiDatabase,
  FiFileText,
  FiFlag,
  FiLayers,
  FiSearch,
  FiUsers
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const adminNavItems = [
  { to: '/portal/admin/dashboard', label: 'Operations Overview', icon: FiBarChart2, section: 'Overview' },
  { to: '/portal/admin/users', label: 'Users & Access', icon: FiUsers, section: 'People' },
  { to: '/portal/admin/360-search', label: 'Account Search', icon: FiSearch, section: 'People' },
  { to: '/portal/admin/jobs', label: 'Job Review', icon: FiBriefcase, section: 'Marketplace' },
  { to: '/portal/admin/applications', label: 'Applications', icon: FiFileText, section: 'Marketplace' },
  { to: '/portal/admin/consultancy', label: 'Consultancy Pipeline', icon: FiLayers, section: 'Business' },
  { to: '/portal/admin/reports', label: 'Reports & Issues', icon: FiFlag, section: 'Business' },
  { to: '/portal/admin/master-data', label: 'Master Data', icon: FiDatabase, section: 'Administration' },
  { to: '/portal/admin/payments', label: 'Payments', icon: FiCreditCard, section: 'Administration' }
];

const AdminModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="admin"
      portalLabel="Admin Console"
      subtitle="Manage users, jobs, reports, approvals, and payments from one workspace."
      navItems={adminNavItems}
      expandSidebarOnHover
      hideProfileShortcut
    />
  );
};

export default AdminModuleLayout;
