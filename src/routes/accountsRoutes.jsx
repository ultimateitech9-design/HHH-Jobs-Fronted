import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const AccountsModuleLayout = lazy(() => import('../modules/accounts-dashboard/components/AccountsModuleLayout'));
const AccountsOverview = lazy(() => import('../modules/accounts-dashboard/pages/AccountsOverview'));
const Transactions = lazy(() => import('../modules/accounts-dashboard/pages/Transactions'));
const Invoices = lazy(() => import('../modules/accounts-dashboard/pages/Invoices'));
const Subscriptions = lazy(() => import('../modules/accounts-dashboard/pages/Subscriptions'));
const Expenses = lazy(() => import('../modules/accounts-dashboard/pages/Expenses'));
const Payouts = lazy(() => import('../modules/accounts-dashboard/pages/Payouts'));
const Refunds = lazy(() => import('../modules/accounts-dashboard/pages/Refunds'));
const Reports = lazy(() => import('../modules/accounts-dashboard/pages/Reports'));
const PaymentSettings = lazy(() => import('../modules/accounts-dashboard/pages/PaymentSettings'));

const accountsRoutes = [
  {
    path: 'portal/accounts',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.accounts}>
        <AccountsModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: 'overview', element: <AccountsOverview /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'invoices', element: <Invoices /> },
      { path: 'subscriptions', element: <Subscriptions /> },
      { path: 'expenses', element: <Expenses /> },
      { path: 'payouts', element: <Payouts /> },
      { path: 'refunds', element: <Refunds /> },
      { path: 'reports', element: <Reports /> },
      { path: 'payment-settings', element: <PaymentSettings /> }
    ]
  },
  { path: 'accounts', element: <Navigate to="/portal/accounts/overview" replace /> }
];

export default accountsRoutes;
