import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiTrendingUp,
  FiUser
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
  StudentSurfaceCard,
  studentGhostButtonClassName,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import { formatDateTime } from '../services/studentApi';
import { getCurrentUser } from '../../../utils/auth';

const NOTIFICATION_FILTERS = [
  { key: 'all', label: 'All updates' },
  { key: 'unread', label: 'Unread first' },
  { key: 'actionable', label: 'With action' }
];

const QUICK_LINKS = [
  { label: 'My home', icon: FiUser, to: '/portal/student/home' },
  { label: 'Jobs', icon: FiBriefcase, to: '/portal/student/jobs' },
  { label: 'Applications', icon: FiFileText, to: '/portal/student/applications' },
  { label: 'Interviews', icon: FiCalendar, to: '/portal/student/interviews' }
];

const formatRelativeTime = (value) => {
  if (!value) return 'Recently';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Recently';

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return diffDays <= 1 ? '1d ago' : `${diffDays}d ago`;
};

const getInlineNotificationDetails = (notification) => {
  const detailedMessage =
    notification?.details ||
    notification?.detail ||
    notification?.body ||
    notification?.long_message ||
    notification?.longMessage ||
    notification?.meta?.details ||
    notification?.meta?.summary;

  if (detailedMessage) {
    return String(detailedMessage);
  }

  return String(
    notification?.message ||
    notification?.description ||
    notification?.subject ||
    notification?.title ||
    'No additional details available for this update.'
  );
};

const isTodayNotification = (notification) => {
  const rawValue = notification.created_at || notification.createdAt;
  if (!rawValue) return false;

  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) return false;

  return date.toDateString() === new Date().toDateString();
};

const getNotificationMeta = (notification) => {
  const content = [
    notification?.title,
    notification?.subject,
    notification?.message,
    notification?.description,
    notification?.type,
    notification?.link
  ].join(' ').toLowerCase();

  if (content.includes('interview')) {
    return {
      label: 'Interview',
      Icon: FiCalendar,
      badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700',
      iconClassName: 'border-violet-100 bg-violet-50 text-violet-600'
    };
  }

  if (content.includes('application') || content.includes('applied')) {
    return {
      label: 'Application',
      Icon: FiFileText,
      badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700',
      iconClassName: 'border-sky-100 bg-sky-50 text-sky-600'
    };
  }

  if (
    content.includes('job') ||
    content.includes('hiring') ||
    content.includes('opening') ||
    content.includes('opportunity') ||
    content.includes('alert')
  ) {
    return {
      label: 'Jobs',
      Icon: FiBriefcase,
      badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      iconClassName: 'border-emerald-100 bg-emerald-50 text-emerald-600'
    };
  }

  return {
    label: 'Platform',
    Icon: FiBell,
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    iconClassName: 'border-amber-100 bg-amber-50 text-amber-600'
  };
};

const StudentNotificationsPage = () => {
  const currentUser = useMemo(() => getCurrentUser(), []);
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
  const [expandedNotifications, setExpandedNotifications] = useState([]);

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
    if (filter === 'unread') {
      return notifications.filter((item) => !item.is_read);
    }

    if (filter === 'actionable') {
      return notifications.filter((item) => Boolean(item.link));
    }

    return notifications;
  }, [filter, notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );
  const actionableCount = useMemo(
    () => notifications.filter((notification) => Boolean(notification.link)).length,
    [notifications]
  );
  const todayCount = useMemo(
    () => notifications.filter((notification) => isTodayNotification(notification)).length,
    [notifications]
  );
  const latestNotification = notifications[0] || null;

  const activeError = storeError || pageError;
  const isLoading = loading && !hydrated;
  const userName = currentUser?.name || 'Student';

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
    <div className="space-y-6 pb-8">
      {activeError ? <StudentNotice type="error" text={activeError} /> : null}
      {message && !activeError ? <StudentNotice type="success" text={message} /> : null}

      <section className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 text-center shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)]">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[conic-gradient(#2d5bff_0_72%,#e2e8f0_72%_100%)]">
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-slate-100 text-3xl font-black text-slate-500">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="mt-3 inline-flex rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
              {unreadCount > 0 ? `${unreadCount} unread` : 'Inbox clear'}
            </span>
            <h1 className="mt-4 text-3xl font-bold text-navy">{userName}</h1>
            <p className="mt-1 text-sm text-slate-500">Notification workspace</p>
            <p className="mt-3 text-xs text-slate-400">
              {latestNotification
                ? `Latest activity ${formatRelativeTime(latestNotification.created_at || latestNotification.createdAt)}`
                : 'No new activity yet'}
            </p>
            <Link
              to="/portal/student/jobs"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[#2d5bff] px-4 py-2 text-[14px] font-bold leading-none text-white shadow-[0_8px_18px_rgba(45,91,255,0.28)]"
            >
              Explore jobs
            </Link>
          </div>

          <div className="rounded-[1.6rem] border border-[#d9e7ff] bg-[#edf4ff] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy">Inbox snapshot</h2>
              <FiTrendingUp className="text-brand-600" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-xs text-slate-500">Today</p>
                <p className="mt-2 text-2xl font-bold text-brand-700">{todayCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Actionable</p>
                <p className="mt-2 text-2xl font-bold text-brand-700">{actionableCount}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700">
              <span>Prioritize recruiter and interview updates first</span>
              <FiBell />
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
            <div className="space-y-1">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold ${item.label === 'My home' ? 'bg-slate-100 text-navy' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-4 min-w-0">
          <div className="rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-700">
                    Student notifications
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    {notifications.length} total updates
                  </span>
                </div>
                <h2 className="mt-4 text-[2rem] font-bold leading-tight text-navy">Keep every recruiter update in one clean feed</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Interview calls, application changes, and platform reminders now stay inside a dedicated inbox built in the same style as your student dashboard.
                </p>
              </div>

              {unreadCount > 0 ? (
                <button type="button" onClick={handleMarkAllRead} className={studentGhostButtonClassName}>
                  <FiCheck size={15} />
                  Mark all as read
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-2.5 md:grid-cols-3">
              {[
                { label: 'Unread', value: unreadCount, helper: 'Needs your attention now' },
                { label: 'With action', value: actionableCount, helper: 'Contain direct links or next steps' },
                { label: 'Today', value: todayCount, helper: 'Fresh updates added since morning' }
              ].map((stat) => (
                <article key={stat.label} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-[1.8rem] leading-none font-bold text-navy">{stat.value}</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-500">{stat.helper}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full rounded-full border border-slate-200 bg-slate-50 p-1 sm:w-auto">
                {NOTIFICATION_FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={`flex-1 rounded-full px-5 py-2 text-sm font-bold transition sm:flex-none ${filter === item.key ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <Link to="/portal/student/applications" className={studentSecondaryButtonClassName}>
                <FiArrowRight size={15} />
                Open applications
              </Link>
            </div>
          </div>

          <StudentSurfaceCard
            eyebrow="Live feed"
            title={filter === 'unread' ? 'Unread updates' : filter === 'actionable' ? 'Action-ready updates' : 'All updates'}
            subtitle="Every item stays readable, timestamped, and ready for action without leaving the student workspace feel."
            className="xl:p-5"
            bodyClassName="space-y-3"
          >
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-32 animate-pulse rounded-[1.8rem] bg-slate-100" />
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => {
                  const meta = getNotificationMeta(notification);
                  const title = notification.title || notification.subject || notification.type || 'Notification';
                  const description = notification.message || notification.description || 'No extra details available yet.';
                  const isExpanded = expandedNotifications.includes(notification.id);
                  const detailsText = getInlineNotificationDetails(notification);

                  return (
                    <article
                      key={notification.id}
                      className={`rounded-[1.5rem] border p-4 transition ${notification.is_read ? 'border-slate-200 bg-white' : 'border-[#d9e7ff] bg-[#eef4ff]'
                        }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-3.5">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${meta.iconClassName}`}>
                            <meta.Icon size={17} />
                          </div>

                          <div className="min-w-0">
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

                            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <h3 className={`text-[1.35rem] leading-tight ${notification.is_read ? 'font-bold text-slate-700' : 'font-bold text-navy'}`}>
                                  {title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-400">
                                <FiClock size={12} />
                                {formatRelativeTime(notification.created_at || notification.createdAt)}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                                <FiClock size={12} />
                                {formatDateTime(notification.created_at || notification.createdAt)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedNotifications((current) =>
                                    current.includes(notification.id)
                                      ? current.filter((id) => id !== notification.id)
                                      : [...current, notification.id]
                                  );
                                }}
                                className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-800"
                              >
                                {isExpanded ? 'Hide details' : 'View details'}
                              </button>
                            </div>

                            {isExpanded ? (
                              <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-slate-700">
                                {detailsText}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5 lg:w-[210px] lg:justify-end">
                          {!notification.is_read ? (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(notification.id)}
                              className={studentSecondaryButtonClassName}
                            >
                              <FiCheckCircle size={15} />
                              Mark read
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                              <FiCheck size={14} />
                              Read
                            </span>
                          )}

                          {notification.link ? (
                            <Link to={notification.link} className={studentPrimaryButtonClassName}>
                              <FiArrowRight size={15} />
                              Open update
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <StudentEmptyState
                icon={FiBell}
                title={filter === 'unread' ? 'No unread notifications' : filter === 'actionable' ? 'No action-ready updates' : 'No notifications yet'}
                description={
                  filter === 'unread'
                    ? 'You are fully caught up right now.'
                    : filter === 'actionable'
                      ? 'Direct recruiter and interview actions will appear here when available.'
                      : 'System updates and recruiter messages will appear here as your activity grows.'
                }
                className="border-none bg-slate-50/80"
              />
            )}
          </StudentSurfaceCard>
        </div>

      </section>
    </div>
  );
};

export default StudentNotificationsPage;
