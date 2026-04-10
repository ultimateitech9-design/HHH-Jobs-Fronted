import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const AdminModuleLayout = lazy(() => import('../modules/admin/components/AdminModuleLayout'));
const AdminControlPage = lazy(() => import('../modules/admin/pages/AdminControlPage'));
const AdminDashboardPage = lazy(() => import('../modules/admin/pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('../modules/admin/pages/AdminUsersPage'));
const AdminJobsPage = lazy(() => import('../modules/admin/pages/AdminJobsPage'));
const AdminReportsPage = lazy(() => import('../modules/admin/pages/AdminReportsPage'));
const AdminApplicationsPage = lazy(() => import('../modules/admin/pages/AdminApplicationsPage'));
const AdminMasterDataPage = lazy(() => import('../modules/admin/pages/AdminMasterDataPage'));
const AdminPaymentsPage = lazy(() => import('../modules/admin/pages/AdminPaymentsPage'));
const AdminAuditLogsPage = lazy(() => import('../modules/admin/pages/AdminAuditLogsPage'));
const AdminSettingsPage = lazy(() => import('../modules/admin/pages/AdminSettingsPage'));
const ExternalJobsMonitorPage = lazy(() => import('../modules/platform/pages/ExternalJobsMonitorPage'));

const adminRoutes = [
  {
    path: 'portal/admin',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.admin}>
        <AdminModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'jobs', element: <AdminJobsPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: 'applications', element: <AdminApplicationsPage /> },
      { path: 'master-data', element: <AdminMasterDataPage /> },
      { path: 'payments', element: <AdminPaymentsPage /> },
      { path: 'audit', element: <AdminAuditLogsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'control', element: <AdminControlPage /> },
      { path: 'external-jobs', element: <ExternalJobsMonitorPage /> }
    ]
  },
  { path: 'admin', element: <Navigate to="/portal/admin/dashboard" replace /> }
];

export default adminRoutes;
