import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const PlatformModuleLayout = lazy(() => import('../modules/platform/components/PlatformModuleLayout'));
const PlatformDashboardPage = lazy(() => import('../modules/platform/pages/PlatformDashboardPage'));
const PlatformOperationsPage = lazy(() => import('../modules/platform/pages/PlatformOperationsPage'));
const PlatformTenantsPage = lazy(() => import('../modules/platform/pages/PlatformTenantsPage'));
const PlatformBillingPage = lazy(() => import('../modules/platform/pages/PlatformBillingPage'));
const PlatformCustomizationPage = lazy(() => import('../modules/platform/pages/PlatformCustomizationPage'));
const PlatformIntegrationsPage = lazy(() => import('../modules/platform/pages/PlatformIntegrationsPage'));
const PlatformSecurityPage = lazy(() => import('../modules/platform/pages/PlatformSecurityPage'));
const PlatformSupportPage = lazy(() => import('../modules/platform/pages/PlatformSupportPage'));
const ExternalJobsMonitorPage = lazy(() => import('../modules/platform/pages/ExternalJobsMonitorPage'));

const platformRoutes = [
  {
    path: 'portal/platform',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.platform}>
        <PlatformModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <PlatformDashboardPage /> },
      { path: 'tenants', element: <PlatformTenantsPage /> },
      { path: 'billing', element: <PlatformBillingPage /> },
      { path: 'customization', element: <PlatformCustomizationPage /> },
      { path: 'integrations', element: <PlatformIntegrationsPage /> },
      { path: 'security', element: <PlatformSecurityPage /> },
      { path: 'support', element: <PlatformSupportPage /> },
      { path: 'operations', element: <PlatformOperationsPage /> },
      { path: 'external-jobs', element: <ExternalJobsMonitorPage /> }
    ]
  },
  { path: 'platform', element: <Navigate to="/portal/platform/dashboard" replace /> }
];

export default platformRoutes;
