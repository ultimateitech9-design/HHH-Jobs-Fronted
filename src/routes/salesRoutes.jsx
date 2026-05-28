import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import { PORTAL_ACCESS } from './portalAccess';

const SalesModuleLayout = lazy(() => import('../modules/sales-dashboard/components/SalesModuleLayout'));
const SalesOverview = lazy(() => import('../modules/sales-dashboard/pages/SalesOverview'));
const Orders = lazy(() => import('../modules/sales-dashboard/pages/Orders'));
const OrderDetails = lazy(() => import('../modules/sales-dashboard/pages/OrderDetails'));
const Leads = lazy(() => import('../modules/sales-dashboard/pages/Leads'));
const LeadDetails = lazy(() => import('../modules/sales-dashboard/pages/LeadDetails'));
const Customers = lazy(() => import('../modules/sales-dashboard/pages/Customers'));
const CustomerDetails = lazy(() => import('../modules/sales-dashboard/pages/CustomerDetails'));
const ClientSearchPage = lazy(() => import('../shared/pages/ClientSearchPage'));
const SalesTeam = lazy(() => import('../modules/sales-dashboard/pages/SalesTeam'));
const Products = lazy(() => import('../modules/sales-dashboard/pages/Products'));
const Coupons = lazy(() => import('../modules/sales-dashboard/pages/Coupons'));
const SalesReports = lazy(() => import('../modules/sales-dashboard/pages/Reports'));
const DepartmentLiveChatPage = lazy(() => import('../shared/pages/DepartmentLiveChatPage'));

const salesRoutes = [
  {
    path: 'portal/sales',
    element: (
      <RoleProtectedRoute roles={PORTAL_ACCESS.sales}>
        <SalesModuleLayout />
      </RoleProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: 'overview', element: <SalesOverview /> },
      { path: 'payments', element: <Orders /> },
      { path: 'orders', element: <Navigate to="../payments" replace /> },
      { path: 'payment-details', element: <OrderDetails /> },
      { path: 'payment-details/:orderId', element: <OrderDetails /> },
      { path: 'order-details', element: <OrderDetails /> },
      { path: 'order-details/:orderId', element: <OrderDetails /> },
      { path: 'leads', element: <Leads /> },
      { path: 'lead-details', element: <LeadDetails /> },
      { path: 'lead-details/:leadId', element: <LeadDetails /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customer-details', element: <CustomerDetails /> },
      { path: 'customer-details/:customerId', element: <CustomerDetails /> },
      { path: 'client-search', element: <ClientSearchPage /> },
      { path: 'team', element: <SalesTeam /> },
      { path: 'packages', element: <Products /> },
      { path: 'products', element: <Navigate to="../packages" replace /> },
      { path: 'coupons', element: <Coupons /> },
      { path: 'live-chat', element: <DepartmentLiveChatPage department="sales" /> },
      { path: 'refunds', element: <Navigate to="../overview" replace /> },
      { path: 'reports', element: <SalesReports /> }
    ]
  },
  { path: 'sales', element: <Navigate to="/portal/sales/overview" replace /> }
];

export default salesRoutes;
