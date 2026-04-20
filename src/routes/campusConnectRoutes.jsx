import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const CampusConnectModuleLayout = lazy(() => import('../modules/campus-connect/components/CampusConnectModuleLayout'));
const CampusDashboardPage = lazy(() => import('../modules/campus-connect/pages/CampusDashboardPage'));
const CampusStudentsPage = lazy(() => import('../modules/campus-connect/pages/CampusStudentsPage'));
const CampusDrivesPage = lazy(() => import('../modules/campus-connect/pages/CampusDrivesPage'));
const CampusConnectionsPage = lazy(() => import('../modules/campus-connect/pages/CampusConnectionsPage'));
const CampusReportsPage = lazy(() => import('../modules/campus-connect/pages/CampusReportsPage'));
const CampusProfilePage = lazy(() => import('../modules/campus-connect/pages/CampusProfilePage'));

const campusConnectRoutes = [
  {
    path: 'portal/campus-connect',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.campusConnect}>
        <CampusConnectModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <CampusDashboardPage /> },
      { path: 'students', element: <CampusStudentsPage /> },
      { path: 'drives', element: <CampusDrivesPage /> },
      { path: 'connections', element: <CampusConnectionsPage /> },
      { path: 'reports', element: <CampusReportsPage /> },
      { path: 'profile', element: <CampusProfilePage /> }
    ]
  },
  { path: 'campus-connect', element: <Navigate to="/portal/campus-connect/dashboard" replace /> }
];

export default campusConnectRoutes;
