import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const SuperAdminLayout = lazy(() => import('../modules/super-admin/layouts/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('../modules/super-admin/pages/SuperAdminDashboard'));
const UsersManagement = lazy(() => import('../modules/super-admin/pages/UsersManagement'));
const CompaniesManagement = lazy(() => import('../modules/super-admin/pages/CompaniesManagement'));
const CampusesManagement = lazy(() => import('../modules/super-admin/pages/CampusesManagement'));
const JobsManagement = lazy(() => import('../modules/super-admin/pages/JobsManagement'));
const ApplicationsManagement = lazy(() => import('../modules/super-admin/pages/ApplicationsManagement'));
const PaymentsManagement = lazy(() => import('../modules/super-admin/pages/PaymentsManagement'));
const SubscriptionsManagement = lazy(() => import('../modules/super-admin/pages/SubscriptionsManagement'));
const ReportsAnalytics = lazy(() => import('../modules/super-admin/pages/ReportsAnalytics'));
const SupportTickets = lazy(() => import('../modules/super-admin/pages/SupportTickets'));
const SystemLogs = lazy(() => import('../modules/super-admin/pages/SystemLogs'));
const RolesPermissions = lazy(() => import('../modules/super-admin/pages/RolesPermissions'));
const SystemSettings = lazy(() => import('../modules/super-admin/pages/SystemSettings'));

const superAdminRoutes = [
  {
    path: 'portal/super-admin',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.superAdmin}>
        <SuperAdminLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <SuperAdminDashboard /> },
      { path: 'users', element: <UsersManagement /> },
      { path: 'companies', element: <CompaniesManagement /> },
      { path: 'campuses', element: <CampusesManagement /> },
      { path: 'jobs', element: <JobsManagement /> },
      { path: 'applications', element: <ApplicationsManagement /> },
      { path: 'payments', element: <PaymentsManagement /> },
      { path: 'subscriptions', element: <SubscriptionsManagement /> },
      { path: 'reports', element: <ReportsAnalytics /> },
      { path: 'support-tickets', element: <SupportTickets /> },
      { path: 'system-logs', element: <SystemLogs /> },
      { path: 'roles-permissions', element: <RolesPermissions /> },
      { path: 'system-settings', element: <SystemSettings /> }
    ]
  },
  { path: 'super-admin', element: <Navigate to="/portal/super-admin/dashboard" replace /> }
];

export default superAdminRoutes;
