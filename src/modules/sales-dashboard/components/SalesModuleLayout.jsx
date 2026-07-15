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
  { to: '/portal/sales/overview', label: 'Overview', icon: FiBarChart2 },
  { to: '/portal/sales/payments', label: 'Payments', icon: FiShoppingCart },
  { to: '/portal/sales/leads', label: 'Leads', icon: FiUserCheck },
  { to: '/portal/sales/consultancy', label: 'Consultancy', icon: FiLayers },
  { to: '/portal/sales/customers', label: 'Customers', icon: FiUsers },
  { to: '/portal/sales/client-search', label: 'Client Search', icon: FiSearch },
  { to: '/portal/sales/team', label: 'Sales Team', icon: FiLayers },
  { to: '/portal/sales/packages', label: 'Packages', icon: FiPackage },
  { to: '/portal/sales/coupons', label: 'Coupons', icon: FiGift },
  { to: '/portal/sales/live-chat', label: 'Live Chat', icon: FiMessageCircle },
  { to: '/portal/sales/reports', label: 'Reports', icon: FiFileText }
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
