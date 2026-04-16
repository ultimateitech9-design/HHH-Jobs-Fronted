import {
  FiBarChart2,
  FiBriefcase,
  FiCreditCard,
  FiDatabase,
  FiFileText,
  FiFlag,
  FiUsers
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const adminNavItems = [
  { to: '/portal/admin/dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { to: '/portal/admin/users', label: 'Users', icon: FiUsers },
  { to: '/portal/admin/jobs', label: 'Jobs', icon: FiBriefcase },
  { to: '/portal/admin/reports', label: 'Reports', icon: FiFlag },
  { to: '/portal/admin/applications', label: 'Applications', icon: FiFileText },
  { to: '/portal/admin/master-data', label: 'Master Data', icon: FiDatabase },
  { to: '/portal/admin/payments', label: 'Payments', icon: FiCreditCard }
];

const AdminModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="admin"
      portalLabel="Admin Console"
      subtitle="Manage approvals, users, jobs, reports, and payments from one workspace."
      navItems={adminNavItems}
    />
  );
};

export default AdminModuleLayout;
