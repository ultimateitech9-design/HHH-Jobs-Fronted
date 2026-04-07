import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const DataEntryModuleLayout = lazy(() => import('../modules/dataentry/components/dataentryModuleLayout'));
const AddJob = lazy(() => import('../modules/dataentry/pages/AddJob'));
const ApprovedEntries = lazy(() => import('../modules/dataentry/pages/ApprovedEntries'));
const DataEntryDashboard = lazy(() => import('../modules/dataentry/pages/DataEntryDashboard'));
const DataEntryRecords = lazy(() => import('../modules/dataentry/pages/DataEntryRecords'));
const DraftEntries = lazy(() => import('../modules/dataentry/pages/DraftEntries'));
const ManageEntries = lazy(() => import('../modules/dataentry/pages/ManageEntries'));
const Notifications = lazy(() => import('../modules/dataentry/pages/Notifications'));
const PendingEntries = lazy(() => import('../modules/dataentry/pages/PendingEntries'));
const Profile = lazy(() => import('../modules/dataentry/pages/Profile'));
const RejectedEntries = lazy(() => import('../modules/dataentry/pages/RejectedEntries'));

const dataentryRoutes = [
  {
    path: 'portal/dataentry',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.dataentry}>
        <DataEntryModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DataEntryDashboard /> },
      { path: 'add-job', element: <AddJob /> },
      { path: 'records', element: <DataEntryRecords /> },
      { path: 'manage-entries', element: <ManageEntries /> },
      { path: 'drafts', element: <DraftEntries /> },
      { path: 'pending', element: <PendingEntries /> },
      { path: 'approved', element: <ApprovedEntries /> },
      { path: 'rejected', element: <RejectedEntries /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'profile', element: <Profile /> }
    ]
  },
  { path: 'dataentry', element: <Navigate to="/portal/dataentry/dashboard" replace /> }
];

export default dataentryRoutes;
