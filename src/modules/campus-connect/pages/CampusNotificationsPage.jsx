import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBell,
  FiBriefcase,
  FiCheckCircle,
  FiCheckSquare,
  FiClock,
  FiFileText,
  FiLink,
  FiUsers
} from 'react-icons/fi';
import SectionHeader from '../../../shared/components/SectionHeader';
import useNotificationStore from '../../../core/notifications/notificationStore';
import {
  fetchNotifications,
  markAllNotificationsReadRequest,
  markNotificationReadRequest
} from '../../../core/notifications/notificationApi';

const formatRelativeTime = (value) => {
  if (!value) return 'Recently';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Recently';

  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return diffDays <= 1 ? '1d ago' : `${diffDays}d ago`;
};

const formatDateTime = (value) => {
  if (!value) return 'Recently';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const getCampusNotificationMeta = (notification) => {
  const content = [
    notification?.title,
    notification?.message,
    notification?.type,
    notification?.link
  ].join(' ').toLowerCase();

  if (content.includes('drive')) {
    return {
      label: 'Drives',
      icon: FiBriefcase,
      badgeClassName: 'border-brand-200 bg-brand-50 text-brand-700'
    };
  }

  if (content.includes('connection')) {
    return {
      label: 'Connections',
      icon: FiLink,
      badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700'
    };
  }

  if (content.includes('student') || content.includes('placement')) {
    return {
      label: 'Students',
      icon: FiUsers,
      badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700'
    };
  }

  return {
    label: 'Reports',
    icon: FiFileText,
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700'
  };
};

const CampusNotificationsPage = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const loading = useNotificationStore((state) => state.loading);
  const hydrated = useNotificationStore((state) => state.hydrated);
  const storeError = useNotificationStore((state) => state.error);
  const replaceNotifications = useNotificationStore((state) => state.replaceNotifications);
  const setLoading = useNotificationStore((state) => state.setLoading);
  const markNotificationReadLocally = useNotificationStore((state) => state.markNotificationReadLocally);
  const markAllNotificationsReadLocally = useNotificationStore((state) => state.markAllNotificationsReadLocally);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);

  const [pageError, setPageError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (hydrated || loading) return undefined;

    let active = true;

    const loadNotifications = async () => {
      setPageError('');
      setLoading(true);

      try {
        const rows = await fetchNotifications();
        if (active) {
          replaceNotifications(rows);
        }
      } catch (error) {
        if (active) {
          setLoading(false);
          setPageError(error.message || 'Unable to load notifications.');
        }
      }
    };

    loadNotifications();

    return () => {
      active = false;
    };
  }, [hydrated, loading, replaceNotifications, setLoading]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );
  const actionableCount = useMemo(
    () => notifications.filter((notification) => Boolean(notification.link)).length,
    [notifications]
  );
  const latestNotification = notifications[0] || null;
  const isLoading = loading && !hydrated;
  const activeError = storeError || pageError;

  const categoryCounts = useMemo(() => notifications.reduce((accumulator, notification) => {
    const key = getCampusNotificationMeta(notification).label;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {}), [notifications]);

  const handleMarkRead = async (notificationId) => {
    setMessage('');
    const previousNotification = notifications.find((item) => item.id === notificationId);
    markNotificationReadLocally(notificationId);

    try {
      const updated = await markNotificationReadRequest(notificationId);
      if (updated) {
        upsertNotification(updated);
      }
    } catch (error) {
      if (previousNotification) {
        upsertNotification(previousNotification);
      }
      setMessage(error.message || 'Unable to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    setMessage('');
    const previousNotifications = [...notifications];
    markAllNotificationsReadLocally();

    try {
      await markAllNotificationsReadRequest();
      setMessage('All campus notifications marked as read.');
      window.setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      replaceNotifications(previousNotifications);
      setMessage(error.message || 'Unable to mark all notifications as read.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-6 pb-12">
      <SectionHeader
        eyebrow="Campus inbox"
        title="Campus notifications"
        subtitle="Review drive delivery summaries, company connection requests, and placement-side updates from one clean workspace."
        action={(
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
            >
              <FiCheckSquare size={14} />
              Mark all as read
            </button>
          ) : null
        )}
      />

      {activeError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{activeError}</div>
      ) : null}
      {message && !activeError ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total updates', value: notifications.length, helper: 'Stored in your campus workspace', icon: FiBell },
          { label: 'Unread', value: unreadCount, helper: 'Needs your attention', icon: FiCheckCircle },
          { label: 'Actionable', value: actionableCount, helper: 'Includes a linked portal action', icon: FiArrowRight },
          {
            label: 'Latest pulse',
            value: latestNotification ? formatRelativeTime(latestNotification.created_at || latestNotification.createdAt) : 'Clear',
            helper: latestNotification ? (latestNotification.title || 'Notification') : 'No new campus activity',
            icon: FiClock
          }
        ].map((stat) => (
          <article key={stat.label} className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-navy">{stat.value}</p>
                <p className="mt-2 text-xs text-slate-400">{stat.helper}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <stat.icon size={18} />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_10px_28px_-18px_rgba(15,23,42,0.18)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-navy">Activity feed</h2>
              <p className="mt-1 text-sm text-slate-500">Every campus-side alert stays timestamped, readable, and ready to open.</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {notifications.length} notifications
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-[1.5rem] bg-slate-100" />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const meta = getCampusNotificationMeta(notification);
                const Icon = meta.icon;

                return (
                  <article
                    key={notification.id}
                    className={`rounded-[1.5rem] border p-5 transition ${
                      notification.is_read ? 'border-slate-200 bg-white' : 'border-brand-100 bg-brand-50/40'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-brand-700">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${meta.badgeClassName}`}>
                              {meta.label}
                            </span>
                            {!notification.is_read ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                New
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-3 text-lg font-extrabold text-navy">{notification.title || 'Notification'}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message || 'No details available yet.'}</p>
                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                              <FiClock size={12} />
                              {formatDateTime(notification.created_at || notification.createdAt)}
                            </span>
                            <span>{formatRelativeTime(notification.created_at || notification.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 lg:w-[220px] lg:justify-end">
                        {!notification.is_read ? (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(notification.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <FiCheckCircle size={14} />
                            Mark read
                          </button>
                        ) : null}

                        {notification.link ? (
                          <Link
                            to={notification.link}
                            className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
                          >
                            <FiArrowRight size={14} />
                            Open
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <FiBell size={34} className="mx-auto text-slate-300" />
              <h3 className="mt-4 text-2xl font-extrabold text-navy">No campus notifications yet</h3>
              <p className="mt-2 text-sm text-slate-500">Drive delivery summaries and company connection activity will appear here.</p>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.6rem] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
            <h2 className="text-lg font-extrabold text-navy">Activity mix</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Drives', value: categoryCounts.Drives || 0 },
                { label: 'Connections', value: categoryCounts.Connections || 0 },
                { label: 'Students', value: categoryCounts.Students || 0 },
                { label: 'Reports', value: categoryCounts.Reports || 0 }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                  <span className="text-lg font-extrabold text-navy">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
            <h2 className="text-lg font-extrabold text-navy">Quick follow-up</h2>
            <div className="mt-4 space-y-3">
              {[
                { to: '/portal/campus-connect/drives', label: 'Review drives', icon: FiBriefcase },
                { to: '/portal/campus-connect/connections', label: 'Open company requests', icon: FiLink },
                { to: '/portal/campus-connect/students', label: 'Check student pool', icon: FiUsers }
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <item.icon size={14} />
                    {item.label}
                  </span>
                  <FiArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default CampusNotificationsPage;
