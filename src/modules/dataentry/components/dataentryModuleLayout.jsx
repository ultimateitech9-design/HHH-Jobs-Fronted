import {
  FiBarChart2,
  FiBell,
  FiCheckCircle,
  FiClock,
  FiFilePlus,
  FiFolder,
  FiList,
  FiThumbsDown,
  FiUser
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const dataEntryNavItems = [
  { to: '/portal/dataentry/dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { to: '/portal/dataentry/add-job', label: 'Post Job', icon: FiFilePlus },
  { to: '/portal/dataentry/records', label: 'Data Records', icon: FiList },
  { to: '/portal/dataentry/manage-entries', label: 'Manage Jobs', icon: FiList },
  { to: '/portal/dataentry/drafts', label: 'Draft Jobs', icon: FiFolder },
  { to: '/portal/dataentry/pending', label: 'Pending Approval', icon: FiClock },
  { to: '/portal/dataentry/approved', label: 'Approved Jobs', icon: FiCheckCircle },
  { to: '/portal/dataentry/rejected', label: 'Rejected Jobs', icon: FiThumbsDown },
  { to: '/portal/dataentry/notifications', label: 'Notifications', icon: FiBell },
  { to: '/portal/dataentry/profile', label: 'Profile', icon: FiUser }
];

const DataEntryModuleLayout = () => {
  return (  
    <PortalWorkbenchLayout
      portalKey="dataentry"
      portalLabel="Data Entry Workspace"
      subtitle="Create job posts, manage approval queues, and track publishing status in one place."
      navItems={dataEntryNavItems}
    />
  );
};

export default DataEntryModuleLayout;
