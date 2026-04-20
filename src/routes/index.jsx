import { Suspense, useEffect } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { useLocation } from 'react-router-dom';
import RootLayout from '../shared/components/layout/RootLayout';
import RouteErrorBoundary from '../shared/components/feedback/RouteErrorBoundary';
import { clearChunkRecoveryAttempt } from '../shared/utils/chunkLoadRecovery';

import publicRoutes from './publicRoutes';
import studentRoutes from './studentRoutes';
import hrRoutes from './hrRoutes';
import adminRoutes from './adminRoutes';
import superAdminRoutes from './superAdminRoutes';
import dataentryRoutes from './dataentryRoutes';
import campusConnectRoutes from './campusConnectRoutes';
import accountsRoutes from './accountsRoutes';
import salesRoutes from './salesRoutes';
import supportRoutes from './supportRoutes';
import platformRoutes from './platformRoutes';
import auditRoutes from './auditRoutes';
import retiredRoutes from './retiredRoutes';

const ManagementPortalPage = lazy(() => import('../modules/common/pages/ManagementPortalPage'));
const ManagementLoginPage = lazy(() => import('../modules/auth/pages/ManagementLoginPage'));

const ChunkRecoveryReady = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    clearChunkRecoveryAttempt(location.pathname);
  }, [location.pathname]);

  return children;
};

const SuspenseWrapper = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" />
      </div>
    }
  >
    <ChunkRecoveryReady>{children}</ChunkRecoveryReady>
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/management',
    errorElement: <RouteErrorBoundary />,
    element: (
      <SuspenseWrapper>
        <ManagementPortalPage />
      </SuspenseWrapper>
    )
  },
  {
    path: '/management/login/:portalKey',
    errorElement: <RouteErrorBoundary />,
    element: (
      <SuspenseWrapper>
        <ManagementLoginPage />
      </SuspenseWrapper>
    )
  },
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
    element: <RootLayout />,
    children: [
      ...adminRoutes,
      ...hrRoutes,
      ...studentRoutes,
      ...retiredRoutes,
      ...dataentryRoutes,
      ...campusConnectRoutes,
      ...accountsRoutes,
      ...salesRoutes,
      ...supportRoutes,
      ...superAdminRoutes,
      ...platformRoutes,
      ...auditRoutes,
      ...publicRoutes
    ].map((route) => wrapRouteSuspense(route))
  }
]);

function wrapRouteSuspense(route) {
  if (!route) return route;

  const wrapped = { ...route };

  if (wrapped.element && !isNavigateElement(wrapped.element)) {
    wrapped.element = <SuspenseWrapper>{wrapped.element}</SuspenseWrapper>;
  }

  if (wrapped.children) {
    wrapped.children = wrapped.children.map((child) => wrapRouteSuspense(child));
  }

  return wrapped;
}

function isNavigateElement(element) {
  if (!element) return false;
  return element.type === Navigate;
}

export default router;
