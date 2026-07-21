import {
  FiBarChart2,
  FiFileText,
  FiGift,
  FiLayers,
  FiMessageCircle,
  FiPackage,
  FiSearch,
  FiShoppingCart,
  FiUserCheck,
  FiUsers
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import { getCurrentUser } from '../../../utils/auth';

const salesNavItems = [
  { to: '/portal/sales/overview', label: 'Sales Overview', icon: FiBarChart2, section: 'Overview' },
  { to: '/portal/sales/leads', label: 'Lead Pipeline', icon: FiUserCheck, section: 'Pipeline' },
  { to: '/portal/sales/customers', label: 'Customers', icon: FiUsers, section: 'Pipeline' },
  { to: '/portal/sales/consultancy', label: 'Consultancy Leads', icon: FiLayers, section: 'Pipeline' },
  { to: '/portal/sales/client-search', label: 'Client Search', icon: FiSearch, section: 'Pipeline' },
  { to: '/portal/sales/payments', label: 'Payments', icon: FiShoppingCart, section: 'Commercials' },
  { to: '/portal/sales/packages', label: 'Packages', icon: FiPackage, section: 'Commercials' },
  { to: '/portal/sales/coupons', label: 'Coupons', icon: FiGift, section: 'Commercials' },
  { to: '/portal/sales/team', label: 'Sales Team', icon: FiLayers, section: 'Management' },
  { to: '/portal/sales/reports', label: 'Sales Reports', icon: FiFileText, section: 'Management' },
  { to: '/portal/sales/live-chat', label: 'Client Messages', icon: FiMessageCircle, section: 'Support' }
];

const SalesModuleLayout = () => {
  const currentUser = getCurrentUser();
  const isSalesManager = ['admin', 'super_admin'].includes(String(currentUser?.role || '').toLowerCase());
  const visibleNavItems = isSalesManager
    ? salesNavItems
    : salesNavItems.filter((item) => item.to !== '/portal/sales/team');

  return (
    <PortalWorkbenchLayout
      portalKey="sales"
      portalLabel="Sales Dashboard"
      subtitle="Payments, leads, customers, team performance, packages, coupons, and sales reporting."
      navItems={visibleNavItems}
      expandSidebarOnHover
    />
  );
};

export default SalesModuleLayout;
