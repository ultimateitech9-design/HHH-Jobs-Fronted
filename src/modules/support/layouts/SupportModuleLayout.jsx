import {
  FiBookOpen,
  FiClipboard,
  FiEdit3,
  FiFileText,
  FiGrid,
  FiMessageCircle,
  FiMessageSquare,
  FiShield,
  FiStar
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';

const supportNavItems = [
  { to: '/portal/support/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/portal/support/tickets', label: 'Tickets', icon: FiClipboard },
  { to: '/portal/support/ticket-details', label: 'Ticket Details', icon: FiFileText },
  { to: '/portal/support/create-ticket', label: 'Create Ticket', icon: FiEdit3 },
  { to: '/portal/support/live-chat', label: 'Live Chat', icon: FiMessageCircle },
  { to: '/portal/support/faq', label: 'FAQ', icon: FiMessageSquare },
  { to: '/portal/support/complaints', label: 'Complaints', icon: FiShield },
  { to: '/portal/support/feedback', label: 'Feedback', icon: FiStar },
  { to: '/portal/support/knowledge-base', label: 'Knowledge Base', icon: FiBookOpen },
  { to: '/portal/support/reports', label: 'Reports', icon: FiFileText }
];

const SupportModuleLayout = () => {
  return (
    <PortalWorkbenchLayout
      portalKey="support"
      portalLabel="Support Center"
      subtitle="Tickets, live chat, FAQ, complaints, feedback, knowledge content, and support reporting."
      navItems={supportNavItems}
    />
  );
};

export default SupportModuleLayout;
