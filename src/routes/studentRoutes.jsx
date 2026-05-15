import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const StudentModuleLayout = lazy(() => import('../modules/student/components/StudentModuleLayout'));
const StudentCompaniesPage = lazy(() => import('../modules/student/pages/StudentCompaniesPage'));
const StudentProfilePage = lazy(() => import('../modules/student/pages/StudentProfilePage'));
const StudentJobsPage = lazy(() => import('../modules/student/pages/StudentJobsPage'));
const StudentJobDetailsPage = lazy(() => import('../modules/student/pages/StudentJobDetailsPage'));
const StudentApplicationsPage = lazy(() => import('../modules/student/pages/StudentApplicationsPage'));
const StudentSavedJobsPage = lazy(() => import('../modules/student/pages/StudentSavedJobsPage'));
const StudentInterviewsPage = lazy(() => import('../modules/student/pages/StudentInterviewsPage'));
const StudentInterviewRoomPage = lazy(() => import('../modules/student/pages/StudentInterviewRoomPage'));
const StudentAnalyticsPage = lazy(() => import('../modules/student/pages/StudentAnalyticsPage'));
const StudentAtsPage = lazy(() => import('../modules/student/pages/StudentAtsPage'));
const StudentServicesPage = lazy(() => import('../modules/student/pages/StudentServicesPage'));
const StudentAutoApplyPage = lazy(() => import('../modules/student/pages/StudentAutoApplyPage'));
const StudentNotificationsPage = lazy(() => import('../modules/student/pages/StudentNotificationsPage'));
const StudentExternalJobsPage = lazy(() => import('../modules/student/pages/StudentExternalJobsPage'));
const StudentHRInterestsPage = lazy(() => import('../modules/student/pages/StudentHRInterestsPage'));
const StudentCampusConnectPage = lazy(() => import('../modules/student/pages/StudentCampusConnectPage'));

const studentRoutes = [
  {
    path: 'portal/student',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.student}>
        <StudentModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="companies" replace /> },
      { path: 'home', element: <Navigate to="/portal/student/companies" replace /> },
      { path: 'dashboard', element: <Navigate to="/portal/student/companies" replace /> },
      { path: 'companies', element: <StudentCompaniesPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
      { path: 'jobs', element: <StudentJobsPage /> },
      { path: 'campus-connect', element: <StudentCampusConnectPage /> },
      { path: 'jobs/:jobId', element: <StudentJobDetailsPage /> },
      { path: 'applications', element: <StudentApplicationsPage /> },
      { path: 'saved-jobs', element: <StudentSavedJobsPage /> },
      { path: 'alerts', element: <Navigate to="/portal/student/auto-apply" replace /> },
      { path: 'auto-apply', element: <StudentAutoApplyPage /> },
      { path: 'interviews', element: <StudentInterviewsPage /> },
      { path: 'interviews/:interviewId/room', element: <StudentInterviewRoomPage /> },
      { path: 'analytics', element: <StudentAnalyticsPage /> },
      { path: 'ats', element: <StudentAtsPage /> },
      { path: 'services', element: <StudentServicesPage /> },
      { path: 'notifications', element: <StudentNotificationsPage /> },
      { path: 'company-reviews', element: <Navigate to="/portal/student/companies" replace /> },
      { path: 'global-jobs', element: <StudentExternalJobsPage /> },
      { path: 'hr-interests', element: <StudentHRInterestsPage /> }
    ]
  },
  { path: 'student', element: <Navigate to="/portal/student/companies" replace /> }
];

export default studentRoutes;
