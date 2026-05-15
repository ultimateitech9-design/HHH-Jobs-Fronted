import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react';
import useAuthStore from '../../../../core/auth/authStore';
import useNotificationStore from '../../../../core/notifications/notificationStore';
import PortalNotificationsDrawer from './PortalNotificationsDrawer';

const PortalWorkbenchHeader = ({
  avatarLetter,
  avatarUrl,
  headerBadge,
  headerNavItems = [],
  headerSearchPlaceholder,
  headerVariant = 'default',
  notificationPath = '',
  profilePath,
  roleSwitchOptions = [],
  showProfileShortcut = true,
  searchPlaceholder,
  subtitle,
  support,
  title,
  onOpenMobileNav,
  onLogout
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navRef = useRef(null);
  const profileMenuRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const streamConnected = useNotificationStore((state) => state.streamConnected);
  const location = useLocation();
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const isStudentMarketplaceHeader = headerVariant === 'student-marketplace';
  const showRoleSwitcher = roleSwitchOptions.length > 1;

  const renderProfileMenu = () => (
    <div className="absolute right-0 top-full z-30 mt-3 w-64 rounded-[1.25rem] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
      <div className="rounded-[1rem] bg-[#f7f5ef] px-3 py-3">
        <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Profile'}</p>
        <p className="truncate text-xs text-slate-500">{user?.email || profilePath}</p>
      </div>
      {showRoleSwitcher ? (
        <div className="mt-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-2 py-2">
          <p className="px-1 pb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Switch Dashboard</p>
          <div className="space-y-1">
            {roleSwitchOptions.map((option) => (
              <Link
                key={option.role}
                to={option.path}
                onClick={() => setProfileMenuOpen(false)}
                className={`flex items-center justify-between rounded-[0.85rem] px-3 py-2 text-sm font-semibold transition ${
                  option.isActive
                    ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-100'
                    : 'text-slate-700 hover:bg-white hover:text-navy'
                }`}
              >
                <span>{option.label}</span>
                {option.isActive ? <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-500">Live</span> : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {showProfileShortcut ? (
        <Link
          to={profilePath || '/'}
          onClick={() => setProfileMenuOpen(false)}
          className="mt-2 flex items-center gap-2 rounded-[0.95rem] px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-navy"
        >
          <User className="h-4 w-4" />
          <span>My profile</span>
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setProfileMenuOpen(false);
          onLogout?.();
        }}
        className="flex w-full items-center gap-2 rounded-[0.95rem] px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
      >
        <LogOut className="h-4 w-4" />
        <span>Log out</span>
      </button>
    </div>
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!navRef.current?.contains(event.target)) {
        setOpenDropdown('');
      }
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isStudentMarketplaceHeader) {
    return (
      <>
        <PortalNotificationsDrawer
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notificationPath={notificationPath}
          notifications={notifications}
        />

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 py-1.5 backdrop-blur-xl">
          <div className="mx-auto grid w-full max-w-[1148px] grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-4 lg:gap-2.5 lg:px-5 xl:px-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenMobileNav}
                className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 xl:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link to="/" className="flex items-center gap-2">
                <img src="/hhh-job-logo.png" alt="HHH Jobs" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
                <div className="hidden sm:block">
                  <p className="font-heading text-base font-bold tracking-tight text-gold-dark">HHH Jobs</p>
                </div>
              </Link>
            </div>

            <nav ref={navRef} className="hidden min-w-0 items-center justify-center gap-5 xl:flex xl:gap-8">
              {headerNavItems.map((item) => {
                const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                const isOpen = openDropdown === item.label;
                const isActive = item.children?.some((child) => location.pathname === child.to.split('?')[0]) || location.pathname === item.to?.split('?')[0];

                if (!hasChildren) {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="text-[0.92rem] font-medium text-slate-700 transition-colors hover:text-navy"
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={item.label} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown((current) => (current === item.label ? '' : item.label))}
                      className={`inline-flex items-center gap-1 text-[0.92rem] font-medium transition-colors ${
                        isActive || isOpen ? 'text-navy' : 'text-slate-700 hover:text-navy'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen ? (
                      <div className="absolute left-1/2 top-full z-20 mt-3 w-44 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            to={child.to}
                            onClick={() => setOpenDropdown('')}
                            className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-navy"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
              <div className="hidden h-[2.125rem] items-center rounded-full border border-slate-200 bg-white pl-3.5 pr-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:flex md:w-[170px] lg:w-[200px] xl:w-[240px]">
                <input
                  placeholder={headerSearchPlaceholder || searchPlaceholder || 'Search jobs here'}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  aria-label="Search jobs"
                  className="inline-flex h-[1.625rem] w-[1.625rem] items-center justify-center rounded-full gradient-primary text-white"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {headerBadge?.to ? (
                <Link
                  to={headerBadge.to}
                  className="hidden rounded-full border border-brand-500 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 xl:inline-flex"
                >
                  {headerBadge.label}
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 md:h-9 md:w-9"
                aria-label="Open notifications"
                title="Open notifications"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-brand-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : streamConnected ? (
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                ) : null}
              </button>

              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  aria-label="Open profile menu"
                  title="Open profile menu"
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/20 bg-white p-0 text-xs font-bold text-white shadow-sm transition hover:border-gold/40 hover:ring-2 hover:ring-gold/10 md:h-9 md:w-auto md:gap-1.5 md:justify-start md:px-1.5 md:pr-2"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full gradient-primary md:h-8 md:w-8">
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover object-center" /> : avatarLetter}
                  </span>
                  <ChevronDown className={`hidden h-4 w-4 text-slate-500 transition-transform md:block ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileMenuOpen ? renderProfileMenu() : null}
              </div>
            </div>

            <div className="col-span-full md:hidden">
              <div className="flex h-[2.125rem] items-center rounded-full border border-slate-200 bg-white pl-3.5 pr-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <input
                  placeholder={headerSearchPlaceholder || searchPlaceholder || 'Search jobs here'}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  aria-label="Search jobs"
                  className="inline-flex h-[1.625rem] w-[1.625rem] items-center justify-center rounded-full gradient-primary text-white"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }

  return (
    <>
      <PortalNotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notificationPath={notificationPath}
        notifications={notifications}
      />

      <header className="sticky top-0 z-30 flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white/92 px-3 py-2 backdrop-blur-xl sm:px-4 md:min-h-12 md:flex-nowrap md:px-4 md:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 xl:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate font-heading text-[14px] font-semibold text-slate-900 sm:text-[15px]">{title}</h1>
            <p className="hidden truncate text-xs text-slate-500 md:block">{subtitle}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {support?.to ? (
            <Link
              to={support.to}
              className="hidden rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-[13px] font-semibold text-brand-700 transition-colors hover:bg-brand-100 xl:inline-flex"
            >
              {support.cta || 'Open module'}
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative rounded-xl p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Open notifications"
            title="Open notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-brand-600 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : streamConnected ? (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            ) : null}
          </button>

          <div ref={profileMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((current) => !current)}
              aria-label="Open profile menu"
              title="Open profile menu"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-0 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:border-slate-300 sm:h-9 sm:w-auto sm:gap-1 sm:justify-start sm:px-1.5 sm:pr-2"
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full gradient-primary text-[11px] font-bold text-white shadow-md shadow-brand-500/20 sm:h-8 sm:w-8">
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover object-center" /> : avatarLetter}
              </span>
              <ChevronDown className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileMenuOpen ? renderProfileMenu() : null}
          </div>
        </div>
      </header>
    </>
  );
};

export default PortalWorkbenchHeader;
