import { FiAlertTriangle, FiBarChart2, FiSearch } from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const auditNavItems = [
  { to: '/portal/audit/dashboard', label: 'Audit Overview', icon: FiBarChart2, section: 'Overview' },
  { to: '/portal/audit/events', label: 'Event Explorer', icon: FiSearch, section: 'Investigation' },
  { to: '/portal/audit/alerts', label: 'Alerts & Compliance', icon: FiAlertTriangle, section: 'Investigation' }
];

const AuditModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="audit"
      portalLabel="Audit Console"
      subtitle="Explore events, investigate alerts, and keep compliance trails complete."
      navItems={auditNavItems}
      expandSidebarOnHover
      support={{
        title: 'Audit Focus',
        text: 'Review unresolved high-severity alerts first each cycle.',
        to: '/portal/audit/alerts',
        cta: 'Open alerts',
        searchPlaceholder: 'Search events, alerts, entities'
      }}
    />
  );
};

export default AuditModuleLayout;
