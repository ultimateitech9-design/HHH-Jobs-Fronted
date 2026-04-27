import { apiFetch } from '../../utils/api';

export const SUPPORTED_NOTIFICATION_ROLES = new Set([
  'student',
  'retired_employee',
  'hr',
  'admin',
  'super_admin',
  'support',
  'sales',
  'accounts',
  'dataentry',
  'campus_connect',
  'platform',
  'audit'
]);

export const NOTIFICATION_STREAM_EVENTS = {
  READY: 'ready',
  CREATED: 'notification.created',
  UPDATED: 'notification.updated',
  BULK_READ: 'notification.bulk_read'
};

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
};

const parseSseBlock = (block = '') => {
  const lines = String(block || '').split(/\r?\n/);
  let event = 'message';
  const dataLines = [];

  lines.forEach((line) => {
    if (!line || line.startsWith(':')) return;

    const separatorIndex = line.indexOf(':');
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    const value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1).trimStart();

    if (field === 'event') {
      event = value || event;
    }

    if (field === 'data') {
      dataLines.push(value);
    }
  });

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join('\n');
  let data = rawData;

  try {
    data = JSON.parse(rawData);
  } catch (_error) {
    // Non-JSON payloads are passed through as-is.
  }

  return { event, data };
};

export const fetchNotifications = async () => {
  const response = await apiFetch('/notifications');
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload?.notifications || [];
};

export const markNotificationReadRequest = async (notificationId) => {
  const response = await apiFetch(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    body: JSON.stringify({})
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload?.notification || null;
};

export const markAllNotificationsReadRequest = async () => {
  const response = await apiFetch('/notifications/read-all', {
    method: 'PATCH',
    body: JSON.stringify({})
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload || {};
};

export const openNotificationsStream = async ({ signal, onEvent, onOpen }) => {
  const response = await apiFetch('/notifications/stream', {
    headers: {
      Accept: 'text/event-stream'
    },
    cache: 'no-store',
    signal
  });

  if (!response.ok) {
    const payload = await parseJson(response);
    throw new Error(payload?.message || `Stream failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Notification stream is unavailable in this browser.');
  }

  onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';

    blocks.forEach((block) => {
      const parsed = parseSseBlock(block);
      if (parsed) {
        onEvent?.(parsed);
      }
    });
  }

  if (buffer.trim()) {
    const parsed = parseSseBlock(buffer);
    if (parsed) {
      onEvent?.(parsed);
    }
  }
};
