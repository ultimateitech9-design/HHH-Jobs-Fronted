import {
  FiBarChart2,
  FiCreditCard,
  FiFileText,
  FiLayers,
  FiMessageCircle,
  FiRefreshCcw,
  FiSearch,
  FiSettings,
  FiTrendingUp
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const accountsNavItems = [
  { to: '/portal/accounts/overview', label: 'Accounts Overview', icon: FiBarChart2, section: 'Overview' },
  { to: '/portal/accounts/transactions', label: 'Transactions', icon: FiCreditCard, section: 'Money Movement' },
  { to: '/portal/accounts/invoices', label: 'Invoices', icon: FiFileText, section: 'Money Movement' },
  { to: '/portal/accounts/expenses', label: 'Expenses', icon: FaRupeeSign, section: 'Money Movement' },
  { to: '/portal/accounts/payouts', label: 'Payouts', icon: FiTrendingUp, section: 'Money Movement' },
  { to: '/portal/accounts/refunds', label: 'Refunds', icon: FiRefreshCcw, section: 'Money Movement' },
  { to: '/portal/accounts/subscriptions', label: 'Subscriptions', icon: FiLayers, section: 'Billing' },
  { to: '/portal/accounts/consultancy', label: 'Consultancy Billing', icon: FiLayers, section: 'Billing' },
  { to: '/portal/accounts/reports', label: 'Financial Reports', icon: FiBarChart2, section: 'Insights' },
  { to: '/portal/accounts/client-search', label: 'Client Search', icon: FiSearch, section: 'Insights' },
  { to: '/portal/accounts/live-chat', label: 'Client Messages', icon: FiMessageCircle, section: 'Support & Settings' },
  { to: '/portal/accounts/payment-settings', label: 'Payment Settings', icon: FiSettings, section: 'Support & Settings' }
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
