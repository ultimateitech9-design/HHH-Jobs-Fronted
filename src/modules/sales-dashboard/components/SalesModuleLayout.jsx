import {
  FiBarChart2,
  FiFileText,
  FiGift,
  FiLayers,
  FiPackage,
  FiRefreshCcw,
  FiShoppingCart,
  FiUserCheck,
  FiUsers
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import { getCurrentUser } from '../../../utils/auth';

const salesNavItems = [
  { to: '/portal/sales/overview', label: 'Overview', icon: FiBarChart2 },
  { to: '/portal/sales/orders', label: 'Orders', icon: FiShoppingCart },
  { to: '/portal/sales/leads', label: 'Leads', icon: FiUserCheck },
  { to: '/portal/sales/customers', label: 'Customers', icon: FiUsers },
  { to: '/portal/sales/team', label: 'Sales Team', icon: FiLayers },
  { to: '/portal/sales/products', label: 'Products', icon: FiPackage },
  { to: '/portal/sales/coupons', label: 'Coupons', icon: FiGift },
  { to: '/portal/sales/refunds', label: 'Refunds', icon: FiRefreshCcw },
  { to: '/portal/sales/reports', label: 'Reports', icon: FiFileText }
];

const SalesModuleLayout = () => {
  const currentUser = getCurrentUser();
  const isSalesManager = ['admin', 'super_admin'].includes(String(currentUser?.role || '').toLowerCase());
  const visibleNavItems = isSalesManager
    ? salesNavItems
    : salesNavItems.filter((item) => !['/portal/sales/team', '/portal/sales/refunds'].includes(item.to));

  return (
    <PortalWorkbenchLayout
      portalKey="sales"
      portalLabel="Sales Dashboard"
      subtitle="Orders, leads, customers, team performance, products, coupons, refunds, and sales reporting."
      navItems={visibleNavItems}
    />
  );
};

export default SalesModuleLayout;
