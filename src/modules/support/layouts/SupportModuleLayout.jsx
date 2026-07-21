import {
  FiBookOpen,
  FiClipboard,
  FiEdit3,
  FiFileText,
  FiGrid,
  FiMessageCircle,
  FiMessageSquare,
  FiSearch,
  FiShield,
  FiStar
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const supportNavItems = [
  { to: '/portal/support/dashboard', label: 'Support Overview', icon: FiGrid, section: 'Overview' },
  { to: '/portal/support/tickets', label: 'Ticket Queue', icon: FiClipboard, section: 'Customer Support' },
  { to: '/portal/support/live-chat', label: 'Live Conversations', icon: FiMessageCircle, section: 'Customer Support' },
  { to: '/portal/support/complaints', label: 'Complaints', icon: FiShield, section: 'Customer Support' },
  { to: '/portal/support/create-ticket', label: 'Create Ticket', icon: FiEdit3, section: 'Actions' },
  { to: '/portal/support/client-search', label: 'Client Search', icon: FiSearch, section: 'Actions' },
  { to: '/portal/support/knowledge-base', label: 'Knowledge Base', icon: FiBookOpen, section: 'Knowledge' },
  { to: '/portal/support/faq', label: 'FAQ Management', icon: FiMessageSquare, section: 'Knowledge' },
  { to: '/portal/support/feedback', label: 'Customer Feedback', icon: FiStar, section: 'Insights' },
  { to: '/portal/support/reports', label: 'Support Reports', icon: FiFileText, section: 'Insights' }
];

const SupportModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="support"
      portalLabel="Support Center"
      subtitle="Tickets, live chat, FAQ, complaints, feedback, knowledge content, and support reporting."
      navItems={supportNavItems}
      expandSidebarOnHover
    />
  );
};

export default SupportModuleLayout;
