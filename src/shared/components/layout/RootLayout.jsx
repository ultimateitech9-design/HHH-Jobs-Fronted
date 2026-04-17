import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AiChatbot from '../../../components/AiChatbot';
import useAuthStore from '../../../core/auth/authStore';
import NotificationRuntime from '../../../core/notifications/NotificationRuntime';
import { apiFetch, hasApiAccessToken } from '../../../utils/api';
import { getDashboardPathByRole, getToken, setAuthSession } from '../../../utils/auth';
import PublicFooter from './publicShell/PublicFooter';
import PublicNavbar from './publicShell/PublicNavbar';
import ScrollToTopButton from './publicShell/ScrollToTopButton';

const portalRoutePattern =
  /^\/portal\/(admin|hr|student|platform|audit|dataentry|accounts|sales|support|super-admin)\b/i;

const publicShellStyle = {
  background:
    'radial-gradient(circle at top left, rgba(229,155,23,0.14), transparent 28%), radial-gradient(circle at 82% 0%, rgba(17,33,59,0.08), transparent 24%), linear-gradient(180deg, #fbf8f2 0%, #f5f7fb 100%)'
};

const RootLayout = () => {
  const { user, clearAuth, refreshUser } = useAuthStore();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const refreshHeaderUser = async () => {
      if (!user || !hasApiAccessToken()) return;

      try {
        const response = await apiFetch('/auth/me');
        if (!response.ok) return;

        const payload = await response.json();
        const latestUser = payload?.user;
        if (!latestUser || !mounted) return;

        const currentAvatar = user.avatarUrl || user.avatar_url || '';
        const latestAvatar = latestUser.avatarUrl || latestUser.avatar_url || '';
        const currentName = String(user.name || '');
        const latestName = String(latestUser.name || '');

        if (currentAvatar === latestAvatar && currentName === latestName) return;

        const mergedUser = { ...user, ...latestUser };
        refreshUser(mergedUser);

        const token = getToken();
        if (token) setAuthSession(token, mergedUser);
      } catch {
        // Ignore shell refresh failures.
      }
    };

    refreshHeaderUser();

    return () => {
      mounted = false;
    };
  }, [location.pathname, refreshUser, user]);

  const dashboardPath = user ? getDashboardPathByRole(user.role) : null;
  const isPortalWorkbench = portalRoutePattern.test(location.pathname);

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

  return (
    <div
      className="min-h-screen overflow-x-clip font-sans text-slate-900"
      style={isPortalWorkbench ? undefined : publicShellStyle}
    >
      {!isPortalWorkbench ? (
        <PublicNavbar user={user} dashboardPath={dashboardPath} onLogout={handleLogout} />
      ) : null}

      <main className={`flex min-h-screen flex-col ${!isPortalWorkbench ? 'pt-16' : ''}`}>
        <Outlet />
      </main>

      {!isPortalWorkbench ? <PublicFooter /> : null}
      {!isPortalWorkbench && showScrollTop && !isChatbotOpen ? <ScrollToTopButton /> : null}

      <NotificationRuntime />
      {!isPortalWorkbench ? <AiChatbot /> : null}
    </div>
  );
};

export default RootLayout;
