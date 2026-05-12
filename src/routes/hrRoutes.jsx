import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';

const HrModuleLayout = lazy(() => import('../modules/hr/components/HrModuleLayout'));
const HrDashboardPage = lazy(() => import('../modules/hr/pages/HrDashboardPage'));
const HrProfilePage = lazy(() => import('../modules/hr/pages/HrProfilePage'));
const HrJobsPage = lazy(() => import('../modules/hr/pages/HrJobsPage'));
const HrJobApplicantsPage = lazy(() => import('../modules/hr/pages/HrJobApplicantsPage'));
const HrCandidatesPage = lazy(() => import('../modules/hr/pages/HrCandidatesPage'));
const HrShortlistedPage = lazy(() => import('../modules/hr/pages/HrShortlistedPage'));
const HrInterestsPage = lazy(() => import('../modules/hr/pages/HrInterestsPage'));
const HrInterviewsPage = lazy(() => import('../modules/hr/pages/HrInterviewsPage'));
const HrInterviewRoomPage = lazy(() => import('../modules/hr/pages/HrInterviewRoomPage'));
const HrAnalyticsPage = lazy(() => import('../modules/hr/pages/HrAnalyticsPage'));
const HrNotificationsPage = lazy(() => import('../modules/hr/pages/HrNotificationsPage'));
const HrAtsPage = lazy(() => import('../modules/hr/pages/HrAtsPage'));
const EmployeeVerificationPage = lazy(() => import('../modules/hr/pages/EmployeeVerificationPage'));
const HrCampusDrivesPage = lazy(() => import('../modules/hr/pages/HrCampusDrivesPage'));
const HrCampusConnectionsPage = lazy(() => import('../modules/hr/pages/HrCampusConnectionsPage'));
const HrCampusConnectionActivityPage = lazy(() => import('../modules/hr/pages/HrCampusConnectionActivityPage'));

const hrRoutes = [
  {
    path: 'portal/hr',
    element: (
      <RoleProtectedRoute roles={['hr']}>
        <HrModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <HrDashboardPage /> },
      { path: 'profile', element: <HrProfilePage /> },
      { path: 'jobs', element: <HrJobsPage /> },
      { path: 'jobs/:jobId/applicants', element: <HrJobApplicantsPage /> },
      { path: 'candidates', element: <HrCandidatesPage /> },
      { path: 'shortlisted', element: <HrShortlistedPage /> },
      { path: 'interests', element: <HrInterestsPage /> },
      { path: 'candidates/interests', element: <HrInterestsPage /> },
      { path: 'interviews', element: <HrInterviewsPage /> },
      { path: 'interviews/:interviewId/room', element: <HrInterviewRoomPage /> },
      { path: 'analytics', element: <HrAnalyticsPage /> },
      { path: 'ats', element: <HrAtsPage /> },
      { path: 'notifications', element: <HrNotificationsPage /> },
      { path: 'employee-verification', element: <EmployeeVerificationPage /> },
      { path: 'campus-connections', element: <HrCampusConnectionsPage /> },
      { path: 'campus-connections/activity', element: <Navigate to="sent" replace /> },
      { path: 'campus-connections/activity/:view', element: <HrCampusConnectionActivityPage /> },
      { path: 'campus-drives', element: <HrCampusDrivesPage /> }
    ]
  },
  { path: 'hr', element: <Navigate to="/portal/hr/dashboard" replace /> }
];

export default hrRoutes;
