import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const SupportModuleLayout = lazy(() => import('../modules/support/layouts/SupportModuleLayout'));
const SupportDashboard = lazy(() => import('../modules/support/pages/SupportDashboard'));
const Tickets = lazy(() => import('../modules/support/pages/Tickets'));
const TicketDetails = lazy(() => import('../modules/support/pages/TicketDetails'));
const CreateTicket = lazy(() => import('../modules/support/pages/CreateTicket'));
const LiveChat = lazy(() => import('../modules/support/pages/LiveChat'));
const FAQ = lazy(() => import('../modules/support/pages/FAQ'));
const Complaints = lazy(() => import('../modules/support/pages/Complaints'));
const Feedback = lazy(() => import('../modules/support/pages/Feedback'));
const KnowledgeBase = lazy(() => import('../modules/support/pages/KnowledgeBase'));
const SupportReports = lazy(() => import('../modules/support/pages/SupportReports'));

const supportRoutes = [
  {
    path: 'portal/support',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.support}>
        <SupportModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <SupportDashboard /> },
      { path: 'tickets', element: <Tickets /> },
      { path: 'ticket-details', element: <TicketDetails /> },
      { path: 'ticket-details/:ticketId', element: <TicketDetails /> },
      { path: 'create-ticket', element: <CreateTicket /> },
      { path: 'live-chat', element: <LiveChat /> },
      { path: 'faq', element: <FAQ /> },
      { path: 'complaints', element: <Complaints /> },
      { path: 'feedback', element: <Feedback /> },
      { path: 'knowledge-base', element: <KnowledgeBase /> },
      { path: 'reports', element: <SupportReports /> }
    ]
  },
  { path: 'support', element: <Navigate to="/portal/support/dashboard" replace /> }
];

export default supportRoutes;
