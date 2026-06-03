import { Suspense, lazy, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../core/auth/authStore';
import { syncSessionUser } from '../../../core/auth/sessionSync';
import { apiFetch, hasApiAccessToken } from '../../../utils/api';
import { getDashboardPathByRole } from '../../../utils/auth';
import { useDeferredMount } from '../../hooks/useDeferredMount';
import {
  readMaintenanceModeSnapshot,
  subscribeToMaintenanceModeUpdates,
  writeMaintenanceModeSnapshot
} from '../../utils/maintenanceMode';
import PublicNavbar from './publicShell/PublicNavbar';

const AiChatbot = lazy(() => import('../../../components/AiChatbot'));
const NotificationRuntime = lazy(() => import('../../../core/notifications/NotificationRuntime'));
const PublicFooter = lazy(() => import('./publicShell/PublicFooter'));
const ScrollToTopButton = lazy(() => import('./publicShell/ScrollToTopButton'));

const portalRoutePattern =
  /^\/portal\/(admin|hr|student|platform|audit|dataentry|accounts|sales|support|super-admin|campus-connect)\b/i;
const campusConnectPublicRoutePattern = /^\/campus-connect(?:\/.*)?$/i;

const publicShellStyle = {
  background:
    'radial-gradient(circle at top left, rgba(229,155,23,0.14), transparent 28%), radial-gradient(circle at 82% 0%, rgba(17,33,59,0.08), transparent 24%), linear-gradient(180deg, #fbf8f2 0%, #f5f7fb 100%)'
};

const RootLayout = () => {
  const initialMaintenanceSnapshot = readMaintenanceModeSnapshot();
  const { user, clearAuth } = useAuthStore();
  const userId = user?.id;
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(
    initialMaintenanceSnapshot.known && initialMaintenanceSnapshot.enabled
  );
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardPath = user ? getDashboardPathByRole(user.role) : null;
  const isPortalWorkbench = portalRoutePattern.test(location.pathname);
  const isInterviewRoomRoute = /^\/portal\/(?:hr|student)\/interviews\/[^/]+\/room$/i.test(location.pathname);
  const hidePublicFooter = campusConnectPublicRoutePattern.test(location.pathname);
  const isAuthorizedMaintenanceUser = ['admin', 'super_admin'].includes(String(user?.role || '').toLowerCase());
  const shouldMountNotificationRuntime = useDeferredMount(Boolean(userId), { delayMs: 3000, timeoutMs: 6500 });

  useEffect(() => {
    const refreshHeaderUser = async () => {
      if (!userId || !hasApiAccessToken()) return;

      try {
        await syncSessionUser({ minIntervalMs: 3 * 60 * 1000 });
      } catch {
        // Ignore passive header refresh failures.
      }
    };

    refreshHeaderUser();
    window.addEventListener('focus', refreshHeaderUser);

    return () => {
      window.removeEventListener('focus', refreshHeaderUser);
    };
  }, [userId]);

  useEffect(() => {
    if (isPortalWorkbench || isAuthorizedMaintenanceUser) {
      setMaintenanceMode(false);
      return undefined;
    }

    let mounted = true;

    const applyMaintenanceSnapshot = (snapshot) => {
      if (!mounted || !snapshot) return;
      setMaintenanceMode(Boolean(snapshot.enabled));
    };

    const loadMaintenanceMode = async () => {
      try {
        const response = await apiFetch('/public/settings', { skipAuth: true, timeoutMs: 3000, cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        applyMaintenanceSnapshot(writeMaintenanceModeSnapshot(Boolean(payload?.settings?.maintenanceMode)));
      } catch {
        applyMaintenanceSnapshot({
          ...readMaintenanceModeSnapshot(),
          known: true
        });
      }
    };

    const unsubscribe = subscribeToMaintenanceModeUpdates((snapshot) => {
      applyMaintenanceSnapshot(snapshot);
    });
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadMaintenanceMode();
      }
    };

    loadMaintenanceMode();
    const intervalId = window.setInterval(loadMaintenanceMode, 60000);
    window.addEventListener('focus', loadMaintenanceMode);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      unsubscribe();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', loadMaintenanceMode);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthorizedMaintenanceUser, isPortalWorkbench]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname !== '/') return;

    const params = new URLSearchParams(location.search || '');
    const hasOAuthCallbackParams = params.has('state')
      && (params.has('code') || params.has('error') || params.has('error_description'));

    if (!hasOAuthCallbackParams) return;

    navigate({
      pathname: '/oauth/callback',
      search: location.search
    }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (isPortalWorkbench) {
      setShowScrollTop(false);
      return undefined;
    }

    const handleScroll = () => setShowScrollTop(window.scrollY > 280);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPortalWorkbench]);

  useEffect(() => {
    const handleChatbotState = (event) => {
      setIsChatbotOpen(Boolean(event?.detail?.isOpen));
    };

    window.addEventListener('ai-chatbot:state', handleChatbotState);

    return () => window.removeEventListener('ai-chatbot:state', handleChatbotState);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const isPublicMaintenanceGatePending = false;
  const shouldShowMaintenanceScreen = !isPortalWorkbench && !isAuthorizedMaintenanceUser && maintenanceMode;
  const shouldHidePublicShell = isPublicMaintenanceGatePending || shouldShowMaintenanceScreen;
  const shouldMountPublicShell = !isPortalWorkbench && !shouldHidePublicShell;
  const shouldMountFooter = useDeferredMount(shouldMountPublicShell && !hidePublicFooter, { delayMs: 4500, timeoutMs: 9000 });
  const shouldMountChatbot = useDeferredMount(shouldMountPublicShell, { delayMs: 6500, timeoutMs: 12000 });

  return (
    <div
      className="min-h-screen overflow-x-clip font-sans text-slate-900"
      style={isPortalWorkbench ? undefined : publicShellStyle}
    >
      {shouldMountPublicShell ? (
        <PublicNavbar user={user} dashboardPath={dashboardPath} onLogout={handleLogout} />
      ) : null}

      <main className={`flex flex-col min-h-screen ${!isPortalWorkbench ? 'pt-[calc(var(--public-navbar-height,74px)+2px)]' : ''}`}>
        {isPublicMaintenanceGatePending ? (
          <section className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
            <div className="max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Checking Platform Status</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Please wait a moment</h1>
              <p className="mt-4 text-base leading-7 text-slate-300">
                We are verifying whether HHH Jobs is available before showing public content.
              </p>
            </div>
          </section>
        ) : shouldShowMaintenanceScreen ? (
          <section className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
            <div className="max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Maintenance Mode</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">HHH Jobs is temporarily unavailable</h1>
              <p className="mt-4 text-base leading-7 text-slate-300">
                We are performing scheduled maintenance. Public access is restricted until the platform is back online.
              </p>
            </div>
          </section>
        ) : (
          <Outlet />
        )}
      </main>

      {shouldMountFooter ? (
        <Suspense fallback={null}>
          <PublicFooter />
        </Suspense>
      ) : null}
      {shouldMountPublicShell && showScrollTop && !isChatbotOpen ? (
        <Suspense fallback={null}>
          <ScrollToTopButton />
        </Suspense>
      ) : null}

      {shouldMountNotificationRuntime ? (
        <Suspense fallback={null}>
          <NotificationRuntime />
        </Suspense>
      ) : null}
      {shouldMountChatbot ? (
        <Suspense fallback={null}>
          <AiChatbot />
        </Suspense>
      ) : null}
    </div>
  );
};

export default RootLayout;
