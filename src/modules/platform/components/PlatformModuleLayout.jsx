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
  { to: '/portal/platform/dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { to: '/portal/platform/tenants', label: 'Tenants', icon: FiBriefcase },
  { to: '/portal/platform/billing', label: 'Billing', icon: FiCreditCard },
  { to: '/portal/platform/customization', label: 'Customization', icon: FiSettings },
  { to: '/portal/platform/integrations', label: 'Integrations', icon: FiLayers },
  { to: '/portal/platform/security', label: 'Security', icon: FiLock },
  { to: '/portal/platform/support', label: 'Support', icon: FiHelpCircle },
  { to: '/portal/platform/external-jobs', label: 'External Jobs', icon: FiGlobe }
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
