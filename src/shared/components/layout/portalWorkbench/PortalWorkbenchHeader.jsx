import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import useAuthStore from '../../../../core/auth/authStore';
import useNotificationStore from '../../../../core/notifications/notificationStore';
import { getNotificationPathByRole } from '../../../../utils/auth';
import PortalNotificationsDrawer from './PortalNotificationsDrawer';

const PortalWorkbenchHeader = ({
  avatarLetter,
  avatarUrl,
  headerBadge,
  headerNavItems = [],
  headerSearchPlaceholder,
  headerVariant = 'default',
  profilePath,
  searchPlaceholder,
  subtitle,
  support,
  title,
  onOpenMobileNav
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const streamConnected = useNotificationStore((state) => state.streamConnected);
  const notificationPath = getNotificationPathByRole(user?.role);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const isStudentMarketplaceHeader = headerVariant === 'student-marketplace';

  if (isStudentMarketplaceHeader) {
    return (
      <>
        <PortalNotificationsDrawer
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notificationPath={notificationPath}
          notifications={notifications}
        />

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 py-2.5 backdrop-blur-xl">
          <div className="mx-auto grid w-full max-w-[1148px] grid-cols-[auto_1fr] items-center gap-3 px-4 sm:px-5 lg:grid-cols-[auto_1fr_auto] lg:px-6 xl:px-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenMobileNav}
                className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link to="/portal/student/home" className="flex items-center gap-2.5">
                <img src="/hhh-job-logo.png" alt="HHH Jobs" className="h-9 w-9 object-contain" />
                <div className="hidden sm:block">
                  <p className="font-heading text-[1.08rem] font-bold tracking-tight text-gold-dark">HHH Jobs</p>
                </div>
              </Link>
            </div>

            <nav className="hidden items-center justify-center gap-10 lg:flex xl:gap-12">
              {headerNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-[0.97rem] font-medium text-slate-700 transition-colors hover:text-navy"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
              <div className="hidden h-10 items-center rounded-full border border-slate-200 bg-white pl-4 pr-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:flex lg:w-[260px] xl:w-[300px]">
                <input
                  placeholder={headerSearchPlaceholder || searchPlaceholder || 'Search jobs here'}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  aria-label="Search jobs"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {headerBadge?.to ? (
                <Link
                  to={headerBadge.to}
                  className="hidden rounded-full border border-brand-500 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 lg:inline-flex"
                >
                  {headerBadge.label}
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
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

              <Link
                to={profilePath || '/'}
                aria-label="Open profile"
                title="Open profile"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gold/30 gradient-primary text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.03] hover:ring-2 hover:ring-gold/20"
              >
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : avatarLetter}
              </Link>
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

      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/92 px-3 py-3 backdrop-blur-xl sm:px-4 md:h-16 md:flex-nowrap md:px-6 md:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate font-heading text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
            <p className="hidden truncate text-xs text-slate-500 md:block">{subtitle}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              placeholder={searchPlaceholder || 'Search dashboard'}
              className="w-44 bg-transparent text-sm outline-none"
            />
          </div>

          {support?.to ? (
            <Link
              to={support.to}
              className="hidden rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 lg:inline-flex"
            >
              {support.cta || 'Open module'}
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
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

          <Link
            to={profilePath || '/'}
            aria-label="Open profile"
            title="Open profile"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full gradient-primary text-xs font-bold text-white shadow-md shadow-brand-500/20 transition-transform hover:scale-[1.03] hover:ring-2 hover:ring-brand-200 sm:h-10 sm:w-10"
          >
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : avatarLetter}
          </Link>
        </div>
      </header>
    </>
  );
};

export default PortalWorkbenchHeader;
