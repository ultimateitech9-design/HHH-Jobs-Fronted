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
  FiSave,
  FiSend,
  FiSmartphone,
  FiTrash2,
  FiTrendingUp,
  FiUser
} from 'react-icons/fi';
import useNotificationStore from '../../../core/notifications/notificationStore';
import {
  deleteNotificationRequest,
  fetchNotifications,
  markNotificationReadRequest
} from '../../../core/notifications/notificationApi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentSurfaceCard
} from '../components/StudentExperience';
import {
  createStudentAlert,
  deleteStudentAlert,
  formatDateTime,
  getStudentAlerts,
  getStudentProfile,
  getWhatsAppPreference,
  saveWhatsAppPreference,
  sendWhatsAppTestAlert
} from '../services/studentApi';
import { getCurrentUser } from '../../../utils/auth';

const NOTIFICATION_FILTERS = [
  { key: 'all', label: 'All updates' },
  { key: 'unread', label: 'Unread first' },
  { key: 'actionable', label: 'With action' }
];

const QUICK_LINKS = [
  { label: 'My home', icon: FiUser, to: '/portal/student/home' },
  { label: 'Jobs', icon: FiBriefcase, to: '/portal/student/jobs' },
  { label: 'My Applications', icon: FiFileText, to: '/portal/student/applications' },
  { label: 'Interviews', icon: FiCalendar, to: '/portal/student/interviews' }
];

const initialAlertDraft = {
  keywords: '',
  location: '',
  experienceLevel: '',
  employmentType: '',
  isActive: true
};

const compactPrimaryButtonClassName =
  'inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-brand-500 via-brand-500 to-warning-400 px-2.5 py-1.5 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(229,155,23,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70';
const compactSecondaryButtonClassName =
  'inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-70';
const compactGhostButtonClassName =
  'inline-flex items-center justify-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-70';

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
  const removeNotificationLocally = useNotificationStore((state) => state.removeNotificationLocally);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);

  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [pageError, setPageError] = useState('');
  const [expandedNotifications, setExpandedNotifications] = useState([]);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(
    () => currentUser?.avatarUrl || currentUser?.avatar_url || ''
  );
  const [whatsappPreference, setWhatsappPreference] = useState({
    phoneNumber: '',
    isEnabled: false,
    configured: false
  });
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappTesting, setWhatsappTesting] = useState(false);
  const [jobAlerts, setJobAlerts] = useState([]);
  const [alertDraft, setAlertDraft] = useState(initialAlertDraft);
  const [alertSaving, setAlertSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadStudentAvatar = async () => {
      const response = await getStudentProfile();
      const nextAvatarUrl = response.data?.avatarUrl || '';

      if (active && !response.error && nextAvatarUrl) {
        setProfileAvatarUrl(nextAvatarUrl);
      }
    };

    loadStudentAvatar();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadAlertPreferences = async () => {
      const [whatsappResponse, alertsResponse] = await Promise.all([
        getWhatsAppPreference(),
        getStudentAlerts()
      ]);

      if (!active) return;
      if (!whatsappResponse.error) {
        setWhatsappPreference(whatsappResponse.data || {});
      }
      if (!alertsResponse.error) {
        setJobAlerts(alertsResponse.data || []);
      }
    };

    loadAlertPreferences();

    return () => {
      active = false;
    };
  }, []);

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
  const userAvatarUrl = profileAvatarUrl || currentUser?.avatarUrl || currentUser?.avatar_url || '';

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

  const handleDeleteNotification = async (notificationId) => {
    setMessage('');
    const previousNotifications = [...notifications];
    removeNotificationLocally(notificationId);
    setExpandedNotifications((current) => current.filter((id) => id !== notificationId));

    try {
      await deleteNotificationRequest(notificationId);
      setMessage('Notification removed from your inbox.');
      window.setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      replaceNotifications(previousNotifications);
      setMessage(error.message || 'Unable to remove notification.');
    }
  };

  const updateAlertDraft = (key, value) => {
    setAlertDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSaveWhatsAppPreference = async () => {
    setMessage('');
    setPageError('');
    const phoneNumber = String(whatsappPreference.phoneNumber || '').replace(/[^0-9]/g, '');
    if (whatsappPreference.isEnabled && phoneNumber.length < 10) {
      setPageError('Enter a valid WhatsApp number before enabling alerts.');
      return;
    }

    setWhatsappSaving(true);
    try {
      const saved = await saveWhatsAppPreference({
        phoneNumber,
        isEnabled: whatsappPreference.isEnabled
      });
      setWhatsappPreference(saved);
      setMessage(saved.isEnabled ? 'WhatsApp job alerts enabled.' : 'WhatsApp job alerts paused.');
    } catch (error) {
      setPageError(error.message || 'Unable to save WhatsApp preference.');
    } finally {
      setWhatsappSaving(false);
    }
  };

  const handleSendWhatsAppTest = async () => {
    setMessage('');
    setPageError('');
    setWhatsappTesting(true);
    try {
      const result = await sendWhatsAppTestAlert(whatsappPreference.phoneNumber);
      setMessage(result?.sent === false ? (result.reason || 'Test message could not be sent.') : 'Test WhatsApp message queued.');
    } catch (error) {
      setPageError(error.message || 'Unable to send WhatsApp test.');
    } finally {
      setWhatsappTesting(false);
    }
  };

  const handleCreateAlert = async () => {
    setMessage('');
    setPageError('');
    const keywords = String(alertDraft.keywords || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const location = String(alertDraft.location || '').trim();
    if (keywords.length === 0 && !location) {
      setPageError('Add at least one role/skill keyword or a location for the alert.');
      return;
    }

    setAlertSaving(true);
    try {
      const alert = await createStudentAlert({
        keywords,
        location,
        experienceLevel: alertDraft.experienceLevel || null,
        employmentType: alertDraft.employmentType || null,
        isActive: alertDraft.isActive
      });
      setJobAlerts((current) => [alert, ...current]);
      setAlertDraft(initialAlertDraft);
      setMessage('Job alert created. Matching jobs will reach your inbox, email, and WhatsApp when enabled.');
    } catch (error) {
      setPageError(error.message || 'Unable to create job alert.');
    } finally {
      setAlertSaving(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    setMessage('');
    setPageError('');
    const previousAlerts = [...jobAlerts];
    setJobAlerts((current) => current.filter((alert) => alert.id !== alertId));
    try {
      await deleteStudentAlert(alertId);
      setMessage('Job alert removed.');
    } catch (error) {
      setJobAlerts(previousAlerts);
      setPageError(error.message || 'Unable to delete job alert.');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {activeError ? <StudentNotice type="error" text={activeError} /> : null}
      {message && !activeError ? <StudentNotice type="success" text={message} /> : null}

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 text-center shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)]">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[conic-gradient(#2d5bff_0_72%,#e2e8f0_72%_100%)]">
              <div className="flex h-[86px] w-[86px] items-center justify-center overflow-hidden rounded-full bg-slate-100 text-3xl font-black text-slate-500">
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                ) : (
                  (userName || 'U').charAt(0).toUpperCase()
                )}
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

          <div className="rounded-[1.6rem] border border-emerald-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-navy">WhatsApp alerts</h2>
                <p className="text-xs font-semibold text-slate-400">
                  {whatsappPreference.isEnabled ? 'Enabled for job matches' : 'Paused'}
                </p>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${whatsappPreference.isEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                <FiSmartphone />
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={whatsappPreference.phoneNumber || ''}
                onChange={(event) => setWhatsappPreference((current) => ({ ...current, phoneNumber: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
                placeholder="WhatsApp number"
                inputMode="tel"
              />
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                <span>Send matching jobs</span>
                <input
                  type="checkbox"
                  checked={Boolean(whatsappPreference.isEnabled)}
                  onChange={(event) => setWhatsappPreference((current) => ({ ...current, isEnabled: event.target.checked }))}
                  className="h-4 w-4 accent-emerald-600"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSaveWhatsAppPreference}
                  disabled={whatsappSaving}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <FiSave size={13} />
                  {whatsappSaving ? 'Saving' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsAppTest}
                  disabled={whatsappTesting || !whatsappPreference.configured}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  <FiSend size={13} />
                  {whatsappTesting ? 'Sending' : 'Test'}
                </button>
              </div>
              {!whatsappPreference.configured ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-4 text-amber-800">
                  Server WhatsApp provider is not configured yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">Job alert filters</h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500">
                {jobAlerts.length}
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              <input
                value={alertDraft.keywords}
                onChange={(event) => updateAlertDraft('keywords', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white"
                placeholder="Skills or role"
              />
              <input
                value={alertDraft.location}
                onChange={(event) => updateAlertDraft('location', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white"
                placeholder="City, state, pincode"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={alertDraft.experienceLevel}
                  onChange={(event) => updateAlertDraft('experienceLevel', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white"
                  placeholder="Experience"
                />
                <select
                  value={alertDraft.employmentType}
                  onChange={(event) => updateAlertDraft('employmentType', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white"
                >
                  <option value="">Any type</option>
                  <option value="Full-Time">Full-time</option>
                  <option value="Part-Time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleCreateAlert}
                disabled={alertSaving}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#2d5bff] px-3 py-2 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                <FiBell size={13} />
                {alertSaving ? 'Creating' : 'Create alert'}
              </button>
            </div>
            {jobAlerts.length > 0 ? (
              <div className="mt-4 space-y-2">
                {jobAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-700">
                        {(Array.isArray(alert.keywords) ? alert.keywords.join(', ') : alert.keywords) || 'Location alert'}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                        {alert.location || alert.employment_type || 'Any location'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-600"
                      title="Delete alert"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="space-y-4 min-w-0">
          <StudentSurfaceCard
            eyebrow="Updates"
            title={filter === 'unread' ? 'Unread updates' : filter === 'actionable' ? 'Action-ready updates' : 'All updates'}
            subtitle="Every item stays readable, timestamped, and ready for action without leaving the student workspace feel."
            className="xl:p-5"
            bodyClassName="space-y-3"
          >
            <div className="mb-4 flex w-full rounded-full border border-slate-200 bg-slate-50 p-1 sm:w-auto">
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
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-32 animate-pulse rounded-[1.8rem] bg-slate-100" />
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-2.5">
                {filteredNotifications.map((notification) => {
                  const meta = getNotificationMeta(notification);
                  const title = notification.title || notification.subject || notification.type || 'Notification';
                  const description = notification.message || notification.description || 'No extra details available yet.';
                  const isExpanded = expandedNotifications.includes(notification.id);
                  const detailsText = getInlineNotificationDetails(notification);

                  return (
                    <article
                      key={notification.id}
                      className={`rounded-2xl border p-2.5 transition ${notification.is_read ? 'border-slate-200 bg-white' : 'border-[#d9e7ff] bg-[#eef4ff]'
                        }`}
                    >
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 gap-2">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.iconClassName}`}>
                            <meta.Icon size={13} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${meta.badgeClassName}`}>
                                {meta.label}
                              </span>
                              {!notification.is_read ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  New
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-1.5 flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <h3 className={`text-sm leading-tight ${notification.is_read ? 'font-bold text-slate-700' : 'font-bold text-navy'}`}>
                                  {title}
                                </h3>
                                <p className="mt-0.5 text-[11px] leading-4 text-slate-600">{description}</p>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
                                <FiClock size={10} />
                                {formatRelativeTime(notification.created_at || notification.createdAt)}
                              </span>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5">
                                <FiClock size={10} />
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
                              <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs leading-5 text-slate-700">
                                {detailsText}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 lg:w-auto lg:flex-nowrap lg:items-center lg:justify-end">
                          {!notification.is_read ? (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(notification.id)}
                              className={compactSecondaryButtonClassName}
                            >
                              <FiCheckCircle size={15} />
                              Mark read
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
                              <FiCheck size={12} />
                              Read
                            </span>
                          )}

                          {notification.link ? (
                            <Link to={notification.link} className={compactPrimaryButtonClassName}>
                              <FiArrowRight size={15} />
                              Open update
                            </Link>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className={compactGhostButtonClassName}
                          >
                            <FiTrash2 size={15} />
                            Delete
                          </button>
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
