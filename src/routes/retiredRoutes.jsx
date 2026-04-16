import { lazy } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';

const RetiredJobsPage = lazy(() => import('../modules/student/pages/RetiredJobsPage'));
const StudentJobDetailsPage = lazy(() => import('../modules/student/pages/StudentJobDetailsPage'));

const retiredRoutes = [
  {
    path: 'portal/retired',
    element: (
      <RoleProtectedRoute roles={['retired_employee']}>
        <Outlet />
      </RoleProtectedRoute>
    ),
    children: [
      { path: 'jobs', element: <RetiredJobsPage /> },
      { path: 'jobs/:jobId', element: <StudentJobDetailsPage /> }
    ]
  },
  { path: 'retired', element: <Navigate to="/portal/student/companies" replace /> }
];

export default retiredRoutes;
