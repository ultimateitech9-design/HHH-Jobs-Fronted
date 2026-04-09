import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiXCircle
} from 'react-icons/fi';
import useNotificationStore from '../../../core/notifications/notificationStore';
import {
  fetchNotifications,
  markAllNotificationsReadRequest,
  markNotificationReadRequest
} from '../../../core/notifications/notificationApi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentGhostButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import { formatDateTime } from '../services/studentApi';

const StudentNotificationsPage = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const loading = useNotificationStore((state) => state.loading);
  const hydrated = useNotificationStore((state) => state.hydrated);
  const storeError = useNotificationStore((state) => state.error);
  const replaceNotifications = useNotificationStore((state) => state.replaceNotifications);
  const setLoading = useNotificationStore((state) => state.setLoading);
  const markNotificationReadLocally = useNotificationStore((state) => state.markNotificationReadLocally);
  const markAllNotificationsReadLocally = useNotificationStore((state) => state.markAllNotificationsReadLocally);
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

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  const activeError = storeError || pageError;
  const isLoading = loading && !hydrated;

  const stats = [
    {
      label: 'Unread',
      value: String(unreadCount),
      helper: 'Messages still waiting for attention'
    },
    {
      label: 'Total Updates',
      value: String(notifications.length),
      helper: 'System and recruiter notifications combined'
    },
    {
      label: 'Filter',
      value: filter === 'all' ? 'All' : 'Unread',
      helper: 'Current inbox view'
    }
  ];

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
      setMessage('All notifications marked as read.');
      window.setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      replaceNotifications(previousNotifications);
      setMessage(error.message || 'Unable to mark all as read.');
    }
  };

  return (
    <StudentPageShell
      eyebrow="Notifications"
      badge={unreadCount > 0 ? `${unreadCount} unread` : 'Inbox clear'}
      title="Stay on top of recruiter updates without inbox chaos"
      subtitle="Track job activity, interview changes, and platform updates in a cleaner feed that makes unread items instantly obvious."
      stats={stats}
      actions={unreadCount > 0 ? (
        <button type="button" onClick={handleMarkAllRead} className={studentGhostButtonClassName}>
          <FiCheck size={15} />
          Mark All as Read
        </button>
      ) : null}
    >
      {activeError ? <StudentNotice type="error" text={activeError} /> : null}
      {message && !activeError ? <StudentNotice type="success" text={message} /> : null}

      <StudentSurfaceCard
        eyebrow="Inbox View"
        title="Notification center"
        subtitle="Switch views and clear your unread stack with one click."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full rounded-full border border-slate-200 bg-slate-50 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 rounded-full px-5 py-2 text-sm font-bold transition sm:flex-none ${
                filter === 'all' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
              }`}
            >
              All Notifications
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`flex-1 rounded-full px-5 py-2 text-sm font-bold transition sm:flex-none ${
                filter === 'unread' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
              }`}
            >
              Unread Only
            </button>
          </div>

          {unreadCount > 0 ? (
            <button type="button" onClick={handleMarkAllRead} className={studentSecondaryButtonClassName}>
              <FiCheckCircle size={15} />
              Mark all as read
            </button>
          ) : null}
        </div>
      </StudentSurfaceCard>

      <StudentSurfaceCard
        eyebrow="Feed"
        title={filter === 'unread' ? 'Unread updates' : 'All updates'}
      >
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-[1.8rem] bg-slate-100" />
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`flex flex-col gap-5 rounded-[1.8rem] border p-5 transition md:flex-row md:items-start md:justify-between ${
                  notification.is_read
                    ? 'border-slate-200 bg-white'
                    : 'border-brand-200 bg-brand-50/50'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                    notification.is_read
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-brand-200 bg-white text-brand-600'
                  }`}>
                    <FiBell size={18} />
                  </div>

                  <div>
                    <h3 className={`text-lg ${notification.is_read ? 'font-bold text-slate-700' : 'font-extrabold text-navy'}`}>
                      {notification.title || 'Notification'}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {notification.message || '-'}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                        <FiClock size={12} />
                        {formatDateTime(notification.created_at || notification.createdAt)}
                      </span>
                      {notification.link ? (
                        <Link to={notification.link} className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-800">
                          <FiExternalLink size={12} />
                          View details
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>

                {!notification.is_read ? (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notification.id)}
                    className={studentSecondaryButtonClassName}
                  >
                    <FiCheckCircle size={15} />
                    Mark Read
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                    <FiCheck size={14} />
                    Read
                  </span>
                )}
              </article>
            ))}
          </div>
        ) : (
          <StudentEmptyState
            icon={FiBell}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description={
              filter === 'unread'
                ? 'You are fully caught up right now.'
                : 'System updates and recruiter messages will appear here as your activity grows.'
            }
            className="border-none bg-slate-50/80"
          />
        )}
      </StudentSurfaceCard>
    </StudentPageShell>
  );
};

export default StudentNotificationsPage;
