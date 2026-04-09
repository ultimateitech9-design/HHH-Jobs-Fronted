import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCurrentUser } from '../../../../utils/auth';
import useAuthStore from '../../../../core/auth/authStore';
import PortalWorkbenchHeader from './PortalWorkbenchHeader';
import PortalWorkbenchMobileDrawer from './PortalWorkbenchMobileDrawer';
import PortalWorkbenchSidebar from './PortalWorkbenchSidebar';
import {
  PORTAL_SIDEBAR_COLLAPSED_WIDTH,
  PORTAL_SIDEBAR_EXPANDED_WIDTH
} from './portalWorkbench.constants';

const normalizePath = (value = '') => String(value || '').replace(/\/+$/, '');

const pathMatches = (pathname = '', targetPath = '') => {
  const currentPath = normalizePath(pathname);
  const basePath = normalizePath(targetPath);

  if (!basePath) return false;
  return currentPath === basePath || currentPath.startsWith(`${basePath}/`);
};

const flattenNavItems = (items = []) =>
  items.flatMap((item) => (Array.isArray(item.children) && item.children.length > 0 ? item.children : item));

const getFirstNavPath = (items = []) => {
  const firstItem = items[0];
  if (!firstItem) return '/';

  if (firstItem.to) return firstItem.to;
  if (Array.isArray(firstItem.children) && firstItem.children.length > 0) {
    return firstItem.children[0].to || '/';
  }

  return '/';
};

const PortalWorkbenchLayout = ({ portalKey, portalLabel, subtitle, navItems = [], support }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [user, setUser] = useState(() => getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const flattenedNavItems = useMemo(() => flattenNavItems(navItems), [navItems]);

  const activeItem = useMemo(
    () => flattenedNavItems.find((item) => pathMatches(location.pathname, item.to)) || flattenedNavItems[0] || navItems[0],
    [flattenedNavItems, location.pathname, navItems]
  );

  const profilePath = user?.role === 'hr'
    ? '/portal/hr/profile'
    : user?.role === 'student' || user?.role === 'retired_employee'
      ? '/portal/student/profile'
      : getFirstNavPath(navItems);

  const avatarLetter = String(user?.name || user?.email || 'U').trim().slice(0, 1).toUpperCase();
  const avatarUrl = user?.avatarUrl || user?.avatar_url || '';

  useEffect(() => {
    const sync = () => setUser(getCurrentUser());
    window.addEventListener('auth-changed', sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener('auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    setMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div
      className={`min-h-screen portal-workbench--${portalKey}`}
      style={{
        background:
          'radial-gradient(circle at top left, rgba(229,155,23,0.12), transparent 26%), radial-gradient(circle at 100% 0%, rgba(36,95,176,0.1), transparent 24%), linear-gradient(180deg, #f8f6f2 0%, #f3f6fb 100%)'
      }}
    >
      <PortalWorkbenchMobileDrawer
        open={mobileMenuOpen}
        portalLabel={portalLabel}
        navItems={navItems}
        profilePath={profilePath}
        support={support}
        user={user}
        onLogout={handleLogout}
        onClose={() => setMobileMenuOpen(false)}
      />

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? PORTAL_SIDEBAR_EXPANDED_WIDTH : PORTAL_SIDEBAR_COLLAPSED_WIDTH }}
        className="fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/80 bg-white/95 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:flex md:flex-col"
      >
        <PortalWorkbenchSidebar
          collapsed={!sidebarOpen}
          portalLabel={portalLabel}
          navItems={navItems}
          profilePath={profilePath}
          support={support}
          user={user}
          onLogout={handleLogout}
          onCollapseToggle={() => setSidebarOpen((current) => !current)}
        />
      </motion.aside>

      <div
        className={`min-h-screen transition-all ${
          sidebarOpen ? 'md:ml-[260px]' : 'md:ml-[72px]'
        }`}
      >
        <div className="flex min-h-screen flex-col">
          <PortalWorkbenchHeader
            avatarLetter={avatarLetter}
            avatarUrl={avatarUrl}
            profilePath={profilePath}
            searchPlaceholder={support?.searchPlaceholder}
            subtitle={subtitle}
            support={support}
            title={activeItem?.label || portalLabel}
            onOpenMobileNav={() => setMobileMenuOpen(true)}
          />

          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-8"
          >
            <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6">
              <Outlet />
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
};

export default PortalWorkbenchLayout;
