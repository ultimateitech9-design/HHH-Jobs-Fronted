import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiFetch, hasApiAccessToken } from '../utils/api';
import { getCurrentUser, getToken, hasRole, isAuthenticated, setAuthSession } from '../utils/auth';

const RoleProtectedRoute = ({ roles, children }) => {
  const location = useLocation();
  const [resolvedRole, setResolvedRole] = useState(() => getCurrentUser()?.role || null);
  const [isSyncingRole, setIsSyncingRole] = useState(false);
  const authenticated = isAuthenticated();
  const token = getToken();
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
      if (!authenticated || roleAllowed || !token || !hasApiAccessToken()) return;

      setIsSyncingRole(true);
      try {
        const response = await apiFetch('/auth/me');
        if (!response.ok) return;

        const payload = await response.json();
        const latestUser = payload?.user;
        if (!latestUser || cancelled) return;

        setResolvedRole(latestUser.role || null);
        setAuthSession(token, { ...currentUser, ...latestUser });
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
  }, [authenticated, currentUser, roleAllowed, token]);

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
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
