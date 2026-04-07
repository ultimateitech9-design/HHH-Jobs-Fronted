import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const AuditModuleLayout = lazy(() => import('../modules/audit/components/AuditModuleLayout'));
const AuditDashboardPage = lazy(() => import('../modules/audit/pages/AuditDashboardPage'));
const AuditEventsPage = lazy(() => import('../modules/audit/pages/AuditEventsPage'));
const AuditAlertsPage = lazy(() => import('../modules/audit/pages/AuditAlertsPage'));
const AuditLogsPage = lazy(() => import('../modules/audit/pages/AuditLogsPage'));

const auditRoutes = [
  {
    path: 'portal/audit',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.audit}>
        <AuditModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AuditDashboardPage /> },
      { path: 'events', element: <AuditEventsPage /> },
      { path: 'alerts', element: <AuditAlertsPage /> },
      { path: 'logs', element: <AuditLogsPage /> }
    ]
  },
  { path: 'audit', element: <Navigate to="/portal/audit/dashboard" replace /> }
];

export default auditRoutes;
