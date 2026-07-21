import {
  FiBarChart2,
  FiBriefcase,
  FiCreditCard,
  FiGlobe,
  FiHelpCircle,
  FiLayers,
  FiLock,
  FiSettings
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const platformNavItems = [
  { to: '/portal/platform/dashboard', label: 'Platform Overview', icon: FiBarChart2, section: 'Overview' },
  { to: '/portal/platform/tenants', label: 'Tenant Directory', icon: FiBriefcase, section: 'Customers' },
  { to: '/portal/platform/billing', label: 'Tenant Billing', icon: FiCreditCard, section: 'Customers' },
  { to: '/portal/platform/integrations', label: 'Integrations', icon: FiLayers, section: 'Infrastructure' },
  { to: '/portal/platform/external-jobs', label: 'External Job Sources', icon: FiGlobe, section: 'Infrastructure' },
  { to: '/portal/platform/security', label: 'Security', icon: FiLock, section: 'Governance' },
  { to: '/portal/platform/customization', label: 'Workspace Settings', icon: FiSettings, section: 'Governance' },
  { to: '/portal/platform/support', label: 'Tenant Support', icon: FiHelpCircle, section: 'Support' }
];

const PlatformModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="platform"
      portalLabel="Platform Console"
      subtitle="Manage tenants, billing, integrations, and support operations from one console."
      navItems={platformNavItems}
      expandSidebarOnHover
      support={{
        title: 'Platform Ops',
        text: 'Track degraded integrations and open tickets to avoid tenant downtime.',
        to: '/portal/platform/dashboard',
        cta: 'Open operations',
        searchPlaceholder: 'Search tenants, tickets, integrations'
      }}
    />
  );
};

export default PlatformModuleLayout;
