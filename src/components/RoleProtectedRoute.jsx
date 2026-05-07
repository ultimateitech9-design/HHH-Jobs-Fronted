import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { syncSessionUser } from '../core/auth/sessionSync';
import { hasApiAccessToken } from '../utils/api';
import { getCurrentUser, hasRole, isAuthenticated } from '../utils/auth';

const resolvePortalLoginPath = (pathname = '') => {
  const normalizedPath = String(pathname || '').trim().toLowerCase();

  if (normalizedPath.startsWith('/portal/hr')) return '/login/hr';
  if (normalizedPath.startsWith('/portal/admin')) return '/management/login/admin';
  if (normalizedPath.startsWith('/portal/super-admin')) return '/management/login/super-admin';
  if (normalizedPath.startsWith('/portal/platform')) return '/management/login/platform';
  if (normalizedPath.startsWith('/portal/audit')) return '/management/login/audit';
  if (normalizedPath.startsWith('/portal/support')) return '/management/login/support';
  if (normalizedPath.startsWith('/portal/sales')) return '/management/login/sales';
  if (normalizedPath.startsWith('/portal/accounts')) return '/management/login/accounts';
  if (normalizedPath.startsWith('/portal/dataentry')) return '/management/login/dataentry';
  if (normalizedPath.startsWith('/portal/campus-connect')) return '/management/login/campus-connect';
  if (normalizedPath.startsWith('/portal/student')) return '/login/student';

  return '/login';
};

const RoleProtectedRoute = ({ roles, children }) => {
  const location = useLocation();
  const [resolvedRole, setResolvedRole] = useState(() => getCurrentUser()?.role || null);
  const [isSyncingRole, setIsSyncingRole] = useState(false);
  const authenticated = isAuthenticated();
  const currentUser = getCurrentUser();
  const currentRole = currentUser?.role || null;

  useEffect(() => {
    setResolvedRole(currentRole);
  }, [currentRole]);

  const roleAllowed = useMemo(
    () => hasRole(roles, resolvedRole),
    [roles, resolvedRole]
  );

  useEffect(() => {
    let cancelled = false;

    const syncLatestRole = async () => {
      if (!authenticated || roleAllowed || !hasApiAccessToken()) return;

      setIsSyncingRole(true);
      try {
        const result = await syncSessionUser({ minIntervalMs: 30 * 1000 });
        const latestUser = result?.user;
        if (!latestUser || cancelled) return;

        setResolvedRole(latestUser.role || null);
      } catch {
        // If sync fails, we fall back to the locally stored role.
      } finally {
        if (!cancelled) setIsSyncingRole(false);
      }
    };

    syncLatestRole();

    return () => {
      cancelled = true;
    };
  }, [authenticated, currentUser, roleAllowed]);

  if (!authenticated) {
    return (
      <Navigate
        to={resolvePortalLoginPath(location.pathname)}
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (isSyncingRole) {
    return null;
  }

  if (!roleAllowed) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
