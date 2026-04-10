import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import { superAdminNavItems } from '../components/AdminSidebar';

const SuperAdminLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="super-admin"
      portalLabel="Super Admin"
      subtitle="Full platform control over users, companies, jobs, billing, support, reporting, permissions, and system policies."
      navItems={superAdminNavItems}
    />
  );
};

export default SuperAdminLayout;
