import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getCurrentUser,
  getNotificationPathByRole,
  getPortalSwitchOptions,
  getProfilePathByRole,
  resolvePortalViewRole
} from '../../../../utils/auth';
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

const PortalWorkbenchLayout = ({
  portalKey,
  portalLabel,
  subtitle,
  navItems = [],
  brandPath,
  support,
  fullWidthHeader = false,
  hideSidebar = false,
  hideSidebarBrand = false,
  sidebarBelowHeader = false,
  headerVariant = 'default',
  headerNavItems = [],
  headerSearchPlaceholder = '',
  headerBadge
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [user, setUser] = useState(() => getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const flattenedNavItems = useMemo(() => flattenNavItems(navItems), [navItems]);
  const activePortalRole = useMemo(
    () => resolvePortalViewRole({ userRole: user?.role, portalKey }),
    [portalKey, user?.role]
  );
  const roleSwitchOptions = useMemo(
    () => getPortalSwitchOptions(user?.role, activePortalRole),
    [activePortalRole, user?.role]
  );

  const activeItem = useMemo(
    () => flattenedNavItems.find((item) => pathMatches(location.pathname, item.to)) || flattenedNavItems[0] || navItems[0],
    [flattenedNavItems, location.pathname, navItems]
  );
  const showProfileShortcut = ['student', 'retired_employee'].includes(String(user?.role || '').trim().toLowerCase());

  const profilePath = getProfilePathByRole(activePortalRole) || getFirstNavPath(navItems);
  const notificationPath = getNotificationPathByRole(activePortalRole);
  const resolvedBrandPath = brandPath || profilePath || getFirstNavPath(navItems);

  const avatarLetter = String(user?.name || user?.email || 'U').trim().slice(0, 1).toUpperCase();
  const avatarUrl = user?.avatarUrl || user?.avatar_url || '';
  const isCompactViewportRoute = location.pathname === '/portal/hr/employee-verification';
  const isInterviewRoomRoute = /\/portal\/(?:hr|student)\/interviews\/[^/]+\/room$/i.test(location.pathname);
  const isStudentWorkbench = portalKey === 'student';
  const mainPaddingClass = isStudentWorkbench
    ? 'px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4'
    : `px-3 py-3 sm:px-4 sm:py-4 md:px-5 ${isCompactViewportRoute ? 'md:py-3' : 'md:py-5'}`;
  const effectiveMainPaddingClass = isInterviewRoomRoute ? 'px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-3' : mainPaddingClass;

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

  const sidebarMarginClass = hideSidebar ? 'xl:ml-0' : sidebarOpen ? 'xl:ml-[260px]' : 'xl:ml-[72px]';
  const sidebarClassName = sidebarBelowHeader
    ? 'fixed bottom-0 left-0 top-16 z-20 hidden border-r border-slate-200/80 bg-white/95 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl xl:flex xl:flex-col'
    : 'fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/80 bg-white/95 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl xl:flex xl:flex-col';

  return (
    <div
      className={`portal-workbench w-full overflow-x-clip ${isInterviewRoomRoute ? 'h-full overflow-hidden' : 'min-h-screen'} portal-workbench--${portalKey}`}
      style={{
        background:
          'radial-gradient(circle at top left, rgba(229,155,23,0.12), transparent 26%), radial-gradient(circle at 100% 0%, rgba(36,95,176,0.1), transparent 24%), linear-gradient(180deg, #f8f6f2 0%, #f3f6fb 100%)'
      }}
    >
      <PortalWorkbenchMobileDrawer
        open={mobileMenuOpen}
        brandPath={resolvedBrandPath}
        portalLabel={portalLabel}
        navItems={navItems}
        profilePath={profilePath}
        support={support}
        user={user}
        onLogout={handleLogout}
        onClose={() => setMobileMenuOpen(false)}
      />

      {fullWidthHeader ? (
        <PortalWorkbenchHeader
          activePortalRole={activePortalRole}
          avatarLetter={avatarLetter}
          avatarUrl={avatarUrl}
          headerBadge={headerBadge}
          headerNavItems={headerNavItems}
          headerSearchPlaceholder={headerSearchPlaceholder}
          headerVariant={headerVariant}
          notificationPath={notificationPath}
          profilePath={profilePath}
          roleSwitchOptions={roleSwitchOptions}
          showProfileShortcut={showProfileShortcut}
          searchPlaceholder={support?.searchPlaceholder}
          subtitle={subtitle}
          support={support}
          title={activeItem?.label || portalLabel}
          onOpenMobileNav={() => setMobileMenuOpen(true)}
          onLogout={handleLogout}
        />
      ) : null}

      {hideSidebar ? null : (
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? PORTAL_SIDEBAR_EXPANDED_WIDTH : PORTAL_SIDEBAR_COLLAPSED_WIDTH }}
          className={sidebarClassName}
        >
          <PortalWorkbenchSidebar
            brandPath={resolvedBrandPath}
            collapsed={!sidebarOpen}
            hideBrand={hideSidebarBrand}
            portalLabel={portalLabel}
            navItems={navItems}
            profilePath={profilePath}
            support={support}
            user={user}
            onLogout={handleLogout}
            onCollapseToggle={() => setSidebarOpen((current) => !current)}
          />
        </motion.aside>
      )}

      <div
        className={`${isInterviewRoomRoute ? 'h-full min-h-0' : 'min-h-screen'} min-w-0 transition-all ${sidebarMarginClass}`}
      >
        <div className={`flex flex-col ${isInterviewRoomRoute ? 'h-full min-h-0' : 'min-h-screen'}`}>
          {fullWidthHeader ? null : (
            <PortalWorkbenchHeader
              activePortalRole={activePortalRole}
              avatarLetter={avatarLetter}
              avatarUrl={avatarUrl}
              headerBadge={headerBadge}
              headerNavItems={headerNavItems}
              headerSearchPlaceholder={headerSearchPlaceholder}
              headerVariant={headerVariant}
              notificationPath={notificationPath}
              profilePath={profilePath}
              roleSwitchOptions={roleSwitchOptions}
              showProfileShortcut={showProfileShortcut}
              searchPlaceholder={support?.searchPlaceholder}
              subtitle={subtitle}
              support={support}
              title={activeItem?.label || portalLabel}
              onOpenMobileNav={() => setMobileMenuOpen(true)}
              onLogout={handleLogout}
            />
          )}

          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-1 flex-col ${effectiveMainPaddingClass} ${isInterviewRoomRoute ? 'overflow-hidden' : ''}`}
          >
            <div className={`mx-auto flex min-h-0 min-w-0 w-full max-w-[1480px] flex-1 flex-col ${isCompactViewportRoute ? 'gap-2.5' : 'gap-2.5 sm:gap-3 md:gap-4'}`}>
              <Outlet />
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
};

export default PortalWorkbenchLayout;
