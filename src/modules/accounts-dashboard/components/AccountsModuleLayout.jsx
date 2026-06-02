import {
  FiBarChart2,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiLayers,
  FiMessageCircle,
  FiRefreshCcw,
  FiSearch,
  FiSettings,
  FiTrendingUp
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const accountsNavItems = [
  { to: '/portal/accounts/overview', label: 'Overview', icon: FiBarChart2 },
  { to: '/portal/accounts/transactions', label: 'Transactions', icon: FiCreditCard },
  { to: '/portal/accounts/invoices', label: 'Invoices', icon: FiFileText },
  { to: '/portal/accounts/subscriptions', label: 'Subscriptions', icon: FiLayers },
  { to: '/portal/accounts/expenses', label: 'Expenses', icon: FiDollarSign },
  { to: '/portal/accounts/payouts', label: 'Payouts', icon: FiTrendingUp },
  { to: '/portal/accounts/refunds', label: 'Refunds', icon: FiRefreshCcw },
  { to: '/portal/accounts/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/portal/accounts/client-search', label: 'Client Search', icon: FiSearch },
  { to: '/portal/accounts/live-chat', label: 'Live Chat', icon: FiMessageCircle },
  { to: '/portal/accounts/payment-settings', label: 'Payment Settings', icon: FiSettings }
];

const AccountsModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="accounts"
      portalLabel="Accounts Dashboard"
      subtitle="Revenue, invoices, subscription billing, payouts, refunds, and payment settings."
      navItems={accountsNavItems}
      expandSidebarOnHover
    />
  );
};

export default AccountsModuleLayout;
