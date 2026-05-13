import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiBell, FiCheck, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';

const TOAST_DURATION = 5000;

const typeConfig = {
  success: { icon: FiCheck, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', iconColor: 'text-emerald-500' },
  error: { icon: FiAlertTriangle, bg: 'bg-red-50 border-red-200', text: 'text-red-800', iconColor: 'text-red-500' },
  info: { icon: FiInfo, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' },
  warning: { icon: FiAlertTriangle, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-500' },
  notification: { icon: FiBell, bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', iconColor: 'text-indigo-500' }
};

let toastId = 0;
let listeners = [];

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

const ToastItem = ({ toast, onDismiss }) => {
  const config = typeConfig[toast.type] || typeConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`animate-slide-down flex w-full max-w-sm items-start gap-3 rounded-xl border ${config.bg} px-4 py-3 shadow-card transition-all`}>
      <span className={`mt-0.5 shrink-0 ${config.iconColor}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className={`text-sm font-semibold ${config.text}`}>{toast.title}</p>
        )}
        {toast.message && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{toast.message}</p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="mt-2 text-xs font-bold text-indigo-600 transition hover:text-indigo-800"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-600"
      >
        <FiX size={14} />
      </button>
    </div>
  );
};

const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts((current) => [...current.slice(-4), toast]);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((fn) => fn !== handler);
    };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-toast flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>,
    document.body
  );
};

export default NotificationToast;
