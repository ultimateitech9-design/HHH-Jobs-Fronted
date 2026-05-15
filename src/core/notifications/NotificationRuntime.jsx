import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../auth/authStore';
import { hasApiAccessToken } from '../../utils/api';
import { normalizeRole } from '../../utils/auth';
import {
  fetchNotifications,
  NOTIFICATION_STREAM_EVENTS,
  openNotificationsStream,
  SUPPORTED_NOTIFICATION_ROLES
} from './notificationApi';
import useNotificationStore from './notificationStore';

const STREAM_RECONNECT_DELAY_MS = 3000;
const MAX_STREAM_RECONNECT_DELAY_MS = 60000;

const NotificationRuntime = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    const role = normalizeRole(user?.role);
    const canStreamNotifications =
      Boolean(user?.id)
      && Boolean(token)
      && hasApiAccessToken()
      && SUPPORTED_NOTIFICATION_ROLES.has(role);

    if (!canStreamNotifications) {
      clearTimeout(reconnectTimerRef.current);
      reconnectAttemptRef.current = 0;
      useNotificationStore.getState().reset();
      return undefined;
    }

    let disposed = false;
    let controller = null;
    let notificationsLoaded = false;

    const isDocumentVisible = () => (
      typeof document === 'undefined' || document.visibilityState === 'visible'
    );

    const isNavigatorOnline = () => (
      typeof navigator === 'undefined' || navigator.onLine !== false
    );

    const canMaintainLiveConnection = () => isDocumentVisible() && isNavigatorOnline();

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const disconnectStream = () => {
      clearReconnectTimer();
      controller?.abort();
      controller = null;
      useNotificationStore.getState().setStreamConnected(false);
    };

    const scheduleReconnect = (error = null) => {
      clearReconnectTimer();
      if (disposed || !canMaintainLiveConnection()) return;

      const retryAfterMs = Number(error?.retryAfterMs || 0);
      const exponentialDelayMs = Math.min(
        MAX_STREAM_RECONNECT_DELAY_MS,
        STREAM_RECONNECT_DELAY_MS * (2 ** reconnectAttemptRef.current)
      );
      const baseDelayMs = retryAfterMs > 0 ? retryAfterMs : exponentialDelayMs;
      const jitterMs = Math.round(baseDelayMs * (0.15 + Math.random() * 0.2));
      const nextDelayMs = Math.min(MAX_STREAM_RECONNECT_DELAY_MS, baseDelayMs + jitterMs);

      reconnectTimerRef.current = setTimeout(() => {
        if (!disposed) {
          connectStream();
        }
      }, nextDelayMs);
      reconnectAttemptRef.current = Math.min(reconnectAttemptRef.current + 1, 6);
    };

    const loadNotifications = async () => {
      const store = useNotificationStore.getState();
      store.setLoading(true);
      store.setError('');

      try {
        const notifications = await fetchNotifications();
        if (!disposed) {
          notificationsLoaded = true;
          useNotificationStore.getState().replaceNotifications(notifications);
        }
      } catch (error) {
        if (!disposed) {
          const nextStore = useNotificationStore.getState();
          nextStore.setLoading(false);
          nextStore.setError(error.message || 'Unable to load notifications.');
        }
      }
    };

    const handleStreamEvent = ({ event, data }) => {
      const store = useNotificationStore.getState();

      if (event === NOTIFICATION_STREAM_EVENTS.CREATED && data?.notification) {
        const notification = data.notification;
        const exists = store.notifications.some((item) => item.id === notification.id);
        store.upsertNotification(notification);

        if (!exists) {
          const title = notification.title || 'New notification';
          const message = notification.message ? `${title}: ${notification.message}` : title;
          toast(message, { id: `notification-${notification.id}` });
        }
        return;
      }

      if (event === NOTIFICATION_STREAM_EVENTS.UPDATED && data?.notification) {
        store.upsertNotification(data.notification);
        return;
      }

      if (event === NOTIFICATION_STREAM_EVENTS.BULK_READ) {
        store.markAllNotificationsReadLocally(data?.notificationIds || [], data?.readAt || new Date().toISOString());
        return;
      }

      if (event === NOTIFICATION_STREAM_EVENTS.DELETED && data?.notificationId) {
        store.removeNotificationLocally(data.notificationId);
      }
    };

    const connectStream = async () => {
      if (disposed || !canMaintainLiveConnection()) return;

      clearReconnectTimer();
      controller?.abort();
      controller = new AbortController();

      try {
        if (!notificationsLoaded && !useNotificationStore.getState().hydrated) {
          await loadNotifications();
        }

        await openNotificationsStream({
          signal: controller.signal,
          onOpen: () => {
            const store = useNotificationStore.getState();
            reconnectAttemptRef.current = 0;
            store.setStreamConnected(true);
            store.setError('');
          },
          onEvent: handleStreamEvent
        });

        if (!disposed && !controller.signal.aborted) {
          useNotificationStore.getState().setStreamConnected(false);
          scheduleReconnect();
        }
      } catch (error) {
        if (disposed || error?.name === 'AbortError') return;

        const store = useNotificationStore.getState();
        store.setStreamConnected(false);

        if (!store.hydrated) {
          store.setError(error.message || 'Notification stream disconnected.');
        }

        scheduleReconnect(error);
      }
    };

    const handleOnline = () => {
      if (disposed) return;
      notificationsLoaded = false;
      loadNotifications();
      reconnectAttemptRef.current = 0;
      connectStream();
    };

    const handleOffline = () => {
      if (disposed) return;
      disconnectStream();
    };

    const handleVisibilityChange = () => {
      if (disposed) return;

      if (isDocumentVisible()) {
        notificationsLoaded = false;
        loadNotifications();
        reconnectAttemptRef.current = 0;
        connectStream();
        return;
      }

      disconnectStream();
    };

    connectStream();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      disconnectStream();
    };
  }, [token, user?.id, user?.role]);

  return null;
};

export default NotificationRuntime;
