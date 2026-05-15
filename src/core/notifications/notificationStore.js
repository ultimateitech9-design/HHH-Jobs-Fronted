import { create } from 'zustand';

const getNotificationTimestamp = (notification) => {
  const rawValue = notification?.created_at || notification?.createdAt || notification?.updated_at || notification?.updatedAt;
  const timestamp = new Date(rawValue || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const normalizeNotification = (notification = {}) => ({
  ...notification,
  is_read: Boolean(notification.is_read ?? notification.read ?? false),
  created_at: notification.created_at || notification.createdAt || notification.updated_at || notification.updatedAt || null,
  read_at: notification.read_at || notification.readAt || null
});

const sortNotifications = (notifications = []) =>
  notifications
    .map((notification) => normalizeNotification(notification))
    .sort((left, right) => getNotificationTimestamp(right) - getNotificationTimestamp(left));

const mergeNotifications = (current = [], incoming = {}) => {
  const next = normalizeNotification(incoming);
  const index = current.findIndex((item) => item.id === next.id);

  if (index === -1) {
    return sortNotifications([next, ...current]);
  }

  const merged = [...current];
  merged[index] = { ...merged[index], ...next };
  return sortNotifications(merged);
};

const markNotificationsRead = (notifications = [], targetIds = [], readAt = new Date().toISOString()) => {
  const targetSet = new Set(targetIds);

  return notifications.map((notification) => (
    targetSet.has(notification.id)
      ? { ...notification, is_read: true, read_at: notification.read_at || readAt }
      : notification
  ));
};

const removeNotification = (notifications = [], notificationId) =>
  notifications.filter((notification) => notification.id !== notificationId);

const useNotificationStore = create((set) => ({
  notifications: [],
  loading: false,
  error: '',
  streamConnected: false,
  hydrated: false,

  reset: () => set({
    notifications: [],
    loading: false,
    error: '',
    streamConnected: false,
    hydrated: false
  }),

  setLoading: (loading) => set((state) => ({ ...state, loading: Boolean(loading) })),
  setError: (error) => set((state) => ({ ...state, error: error || '' })),
  setStreamConnected: (streamConnected) => set((state) => ({ ...state, streamConnected: Boolean(streamConnected) })),

  replaceNotifications: (notifications) => set((state) => ({
    ...state,
    notifications: sortNotifications(Array.isArray(notifications) ? notifications : []),
    hydrated: true,
    loading: false,
    error: ''
  })),

  upsertNotification: (notification) => set((state) => ({
    ...state,
    notifications: mergeNotifications(state.notifications, notification),
    hydrated: true
  })),

  markNotificationReadLocally: (notificationId, readAt = new Date().toISOString()) => set((state) => ({
    ...state,
    notifications: markNotificationsRead(state.notifications, [notificationId], readAt)
  })),

  removeNotificationLocally: (notificationId) => set((state) => ({
    ...state,
    notifications: removeNotification(state.notifications, notificationId)
  })),

  markAllNotificationsReadLocally: (notificationIds = [], readAt = new Date().toISOString()) => set((state) => ({
    ...state,
    notifications: notificationIds.length > 0
      ? markNotificationsRead(state.notifications, notificationIds, readAt)
      : state.notifications.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at || readAt
        }))
  }))
}));

export default useNotificationStore;
