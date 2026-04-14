import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BriefcaseBusiness, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { markAllNotificationsReadRequest, markNotificationReadRequest } from '../../../../core/notifications/notificationApi';
import useNotificationStore from '../../../../core/notifications/notificationStore';

const JOB_NOTIFICATION_KEYWORDS = [
  'job',
  'jobs',
  'alert',
  'alerts',
  'application',
  'applications',
  'recruiter',
  'interview',
  'hiring',
  'resume',
  'profile',
  'opportunity',
  'opening',
  'vacancy'
];

const getNotificationDate = (notification) => {
  const raw = notification?.created_at || notification?.createdAt || notification?.updated_at || notification?.updatedAt;
  const parsed = raw ? new Date(raw) : null;
  return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

const formatRelativeTime = (notification) => {
  const date = getNotificationDate(notification);
  if (!date) return 'Recently';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
};

const getDateBucket = (notification) => {
  const date = getNotificationDate(notification);
  if (!date) return 'Recent';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return 'Earlier';
};

const isJobRelatedNotification = (notification) => {
  const content = [
    notification?.title,
    notification?.message,
    notification?.type,
    notification?.subject,
    notification?.link
  ].join(' ').toLowerCase();

  return JOB_NOTIFICATION_KEYWORDS.some((keyword) => content.includes(keyword));
};

const groupNotifications = (notifications) => notifications.reduce((accumulator, notification) => {
  const bucket = getDateBucket(notification);
  if (!accumulator[bucket]) accumulator[bucket] = [];
  accumulator[bucket].push(notification);
  return accumulator;
}, {});

const PortalNotificationsDrawer = ({
  open,
  onClose,
  notificationPath = '',
  notifications = []
}) => {
  const markAllNotificationsReadLocally = useNotificationStore((state) => state.markAllNotificationsReadLocally);
  const markNotificationReadLocally = useNotificationStore((state) => state.markNotificationReadLocally);

  const jobNotifications = useMemo(() => {
    const filtered = notifications.filter(isJobRelatedNotification);
    return filtered.length > 0 ? filtered : notifications;
  }, [notifications]);

  const groupedNotifications = useMemo(() => groupNotifications(jobNotifications), [jobNotifications]);
  const sectionOrder = ['Today', 'Yesterday', 'Earlier', 'Recent'];

  useEffect(() => {
    if (!open) return undefined;

    const unreadIds = jobNotifications.filter((item) => !item.is_read).map((item) => item.id).filter(Boolean);
    if (unreadIds.length === 0) return undefined;

    const readAt = new Date().toISOString();
    markAllNotificationsReadLocally(unreadIds, readAt);
    markAllNotificationsReadRequest().catch(() => {});
    return undefined;
  }, [jobNotifications, markAllNotificationsReadLocally, open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-slate-950/18 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label="Close notifications"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 130, damping: 24, mass: 1 }}
            className="fixed inset-y-0 right-0 z-[96] flex h-full w-full max-w-[420px] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[0_22px_72px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-600">Alerts</p>
                <h2 className="mt-1 font-heading text-[1.7rem] font-extrabold text-slate-950">Notifications</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close notifications drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/55">
              {jobNotifications.length > 0 ? (
                <div className="space-y-6 px-4 py-4">
                  {sectionOrder.map((section) => {
                    const items = groupedNotifications[section] || [];
                    if (items.length === 0) return null;

                    return (
                      <section key={section} className="space-y-3">
                        <p className="px-1 text-sm font-semibold text-slate-500">{section}</p>
                        <div className="space-y-2.5">
                          {items.map((notification) => {
                            const title = notification.title || notification.subject || notification.type || 'Job alert';
                            const message = notification.message || notification.description || 'Alerts bhej';

                            return (
                              <article
                                key={notification.id || `${title}-${message}`}
                                className={`rounded-[1.45rem] border px-3.5 py-3 shadow-sm transition-colors ${
                                  notification.is_read
                                    ? 'border-slate-200 bg-white'
                                    : 'border-brand-200 bg-brand-50/80'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                                    <BriefcaseBusiness className="h-4 w-4" />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-[15px] font-semibold leading-5 text-slate-950">{title}</p>
                                      <span className="shrink-0 pt-0.5 text-xs font-medium text-slate-400">
                                        {formatRelativeTime(notification)}
                                      </span>
                                    </div>
                                    <p className="mt-1.5 text-sm leading-5 text-slate-600">{message}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                      {!notification.is_read ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                          New alert
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                          Seen
                                        </span>
                                      )}
                                      {notification.link ? (
                                        <Link
                                          to={notification.link}
                                          onClick={() => {
                                            if (notification.id && !notification.is_read) {
                                              markNotificationReadLocally(notification.id);
                                              markNotificationReadRequest(notification.id).catch(() => {});
                                            }
                                            onClose();
                                          }}
                                          className="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
                                        >
                                          Open
                                        </Link>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Bell className="h-7 w-7" />
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-4">
              {notificationPath ? (
                <Link
                  to={notificationPath}
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                >
                  Open full notifications
                </Link>
              ) : (
                <p className="text-center text-xs font-medium text-slate-400">Alerts panel ready</p>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};

export default PortalNotificationsDrawer;
