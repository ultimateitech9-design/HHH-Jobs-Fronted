import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../../../shared/components/SectionHeader';
import useNotificationStore from '../../../core/notifications/notificationStore';
import {
  deleteNotificationRequest,
  fetchNotifications,
  markAllNotificationsReadRequest,
  markNotificationReadRequest
} from '../../../core/notifications/notificationApi';
import { formatDateTime } from '../services/hrApi';

const HrNotificationsPage = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const loading = useNotificationStore((state) => state.loading);
  const hydrated = useNotificationStore((state) => state.hydrated);
  const storeError = useNotificationStore((state) => state.error);
  const replaceNotifications = useNotificationStore((state) => state.replaceNotifications);
  const setLoading = useNotificationStore((state) => state.setLoading);
  const markNotificationReadLocally = useNotificationStore((state) => state.markNotificationReadLocally);
  const markAllNotificationsReadLocally = useNotificationStore((state) => state.markAllNotificationsReadLocally);
  const removeNotificationLocally = useNotificationStore((state) => state.removeNotificationLocally);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);

  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [pageError, setPageError] = useState('');

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

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((item) => !item.is_read);
  }, [filter, notifications]);

  const activeError = storeError || pageError;

  const handleMarkRead = async (notificationId) => {
    setMessage('');
    const previousNotification = notifications.find((item) => item.id === notificationId);
    markNotificationReadLocally(notificationId);

    try {
      const updated = await markNotificationReadRequest(notificationId);
      if (updated) {
        upsertNotification(updated);
      }
      setMessage('Notification marked as read.');
    } catch (error) {
      if (previousNotification) {
        upsertNotification(previousNotification);
      }
      setMessage(error.message || 'Unable to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    setMessage('');
    const previousNotifications = [...notifications];
    markAllNotificationsReadLocally();

    try {
      await markAllNotificationsReadRequest();
      setMessage('All notifications marked as read.');
    } catch (error) {
      replaceNotifications(previousNotifications);
      setMessage(error.message || 'Unable to mark all read.');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    setMessage('');
    const previousNotifications = [...notifications];
    removeNotificationLocally(notificationId);

    try {
      await deleteNotificationRequest(notificationId);
      setMessage('Notification deleted.');
    } catch (error) {
      replaceNotifications(previousNotifications);
      setMessage(error.message || 'Unable to delete notification.');
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <div className="module-page module-page--hr">
      <SectionHeader
        eyebrow="Notifications"
        title="HR Notifications"
        subtitle="Review job updates, new applications, approvals, and interview events."
        action={
          unreadCount > 0 ? (
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              {unreadCount} unread
            </span>
          ) : null
        }
      />

      {activeError ? <p className="form-error">{activeError}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {['all', 'unread'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === tab
                    ? 'bg-navy text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="text-[12px] font-semibold text-slate-500 transition hover:text-brand-600"
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </button>
        </div>

        {loading && !hydrated ? <p className="py-6 text-center text-[13px] text-slate-400">Loading notifications...</p> : null}

        <div className="mt-3 max-h-[calc(100vh-260px)] space-y-1.5 overflow-y-auto">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 transition ${
                notification.is_read
                  ? 'border-slate-100 bg-white'
                  : 'border-brand-100 bg-brand-50/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-[13px] font-semibold text-navy">{notification.title || 'Notification'}</h4>
                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{notification.message || '-'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <p className="text-[11px] text-slate-400">{formatDateTime(notification.created_at || notification.createdAt)}</p>
                  {notification.link ? (
                    <Link to={notification.link} className="text-[11px] font-semibold text-brand-600 hover:text-brand-700">
                      Open linked page
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!notification.is_read ? (
                  <button
                    type="button"
                    className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-600 transition hover:bg-brand-100"
                    onClick={() => handleMarkRead(notification.id)}
                  >
                    Read
                  </button>
                ) : (
                  <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">Read</span>
                )}
                <button
                  type="button"
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDeleteNotification(notification.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {(!loading || hydrated) && filteredNotifications.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px] font-medium text-slate-400">No notifications found.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default HrNotificationsPage;
