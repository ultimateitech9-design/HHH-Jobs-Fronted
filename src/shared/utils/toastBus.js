const TOAST_DURATION = 5000;

let toastId = 0;
let listeners = [];

export const subscribeToToasts = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((fn) => fn !== listener);
  };
};

export const showToast = ({ type = 'info', title = '', message = '', duration = TOAST_DURATION, action = null }) => {
  const id = ++toastId;
  const toast = { id, type, title, message, duration, action, createdAt: Date.now() };
  listeners.forEach((fn) => fn(toast));
  return id;
};

export const notify = {
  success: (title, message, opts) => showToast({ type: 'success', title, message, ...opts }),
  error: (title, message, opts) => showToast({ type: 'error', title, message, ...opts }),
  info: (title, message, opts) => showToast({ type: 'info', title, message, ...opts }),
  warning: (title, message, opts) => showToast({ type: 'warning', title, message, ...opts }),
  notification: (title, message, opts) => showToast({ type: 'notification', title, message, ...opts })
};
