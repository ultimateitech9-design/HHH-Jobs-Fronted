import {
  FiBarChart2,
  FiBell,
  FiCheckCircle,
  FiClock,
  FiFilePlus,
  FiFolder,
  FiList,
  FiMessageCircle,
  FiThumbsDown,
  FiUser
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const dataEntryNavItems = [
  { to: '/portal/dataentry/dashboard', label: 'Entry Overview', icon: FiBarChart2, section: 'Overview' },
  { to: '/portal/dataentry/add-job', label: 'Create Job', icon: FiFilePlus, section: 'Create' },
  { to: '/portal/dataentry/records', label: 'Data Records', icon: FiList, section: 'Records' },
  { to: '/portal/dataentry/manage-entries', label: 'Manage Jobs', icon: FiList, section: 'Records' },
  { to: '/portal/dataentry/drafts', label: 'Draft Jobs', icon: FiFolder, section: 'Publishing Queue' },
  { to: '/portal/dataentry/pending', label: 'Pending Approval', icon: FiClock, section: 'Publishing Queue' },
  { to: '/portal/dataentry/approved', label: 'Approved Jobs', icon: FiCheckCircle, section: 'Publishing Queue' },
  { to: '/portal/dataentry/rejected', label: 'Rejected Jobs', icon: FiThumbsDown, section: 'Publishing Queue' },
  { to: '/portal/dataentry/notifications', label: 'Notifications', icon: FiBell, section: 'Account' },
  { to: '/portal/dataentry/live-chat', label: 'Support Chat', icon: FiMessageCircle, section: 'Account' },
  { to: '/portal/dataentry/profile', label: 'Account Profile', icon: FiUser, section: 'Account' }
];

const DataEntryModuleLayout = () => {
  return (  
    <PortalWorkbenchLayout
      portalKey="dataentry"
      portalLabel="Data Entry Workspace"
      subtitle="Create job posts, manage approval queues, and track publishing status in one place."
      navItems={dataEntryNavItems}
      expandSidebarOnHover
    />
  );
};

export default DataEntryModuleLayout;
