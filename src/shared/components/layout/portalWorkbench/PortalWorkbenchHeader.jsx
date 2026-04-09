import { Link } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import useAuthStore from '../../../../core/auth/authStore';
import useNotificationStore from '../../../../core/notifications/notificationStore';
import { getNotificationPathByRole } from '../../../../utils/auth';

const PortalWorkbenchHeader = ({
  avatarLetter,
  avatarUrl,
  profilePath,
  searchPlaceholder,
  subtitle,
  support,
  title,
  onOpenMobileNav
}) => {
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const streamConnected = useNotificationStore((state) => state.streamConnected);
  const notificationPath = getNotificationPathByRole(user?.role);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const BellWrapper = notificationPath ? Link : 'button';
  const bellWrapperProps = notificationPath
    ? { to: notificationPath }
    : { type: 'button' };

  return (
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

        <BellWrapper
          {...bellWrapperProps}
          className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-brand-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : streamConnected ? (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          ) : null}
        </BellWrapper>

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
  );
};

export default PortalWorkbenchHeader;
