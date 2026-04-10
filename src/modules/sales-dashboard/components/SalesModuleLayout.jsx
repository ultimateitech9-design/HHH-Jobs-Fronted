import {
  FiBarChart2,
  FiDollarSign,
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

const salesNavItems = [
  { to: '/portal/sales/overview', label: 'Overview', icon: FiBarChart2 },
  { to: '/portal/sales/orders', label: 'Orders', icon: FiShoppingCart },
  { to: '/portal/sales/leads', label: 'Leads', icon: FiUserCheck },
  { to: '/portal/sales/customers', label: 'Customers', icon: FiUsers },
  { to: '/portal/sales/team', label: 'Sales Team', icon: FiLayers },
  { to: '/portal/sales/products', label: 'Products', icon: FiPackage },
  { to: '/portal/sales/coupons', label: 'Coupons', icon: FiGift },
  { to: '/portal/sales/refunds', label: 'Refunds', icon: FiRefreshCcw },
  { to: '/portal/sales/reports', label: 'Reports', icon: FiFileText },
  { to: '/portal/sales/order-details', label: 'Order Details', icon: FiDollarSign },
  { to: '/portal/sales/lead-details', label: 'Lead Details', icon: FiDollarSign },
  { to: '/portal/sales/customer-details', label: 'Customer Details', icon: FiDollarSign }
];

const SalesModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="sales"
      portalLabel="Sales Dashboard"
      subtitle="Orders, leads, customers, team performance, products, coupons, refunds, and sales reporting."
      navItems={salesNavItems}
    />
  );
};

export default SalesModuleLayout;
