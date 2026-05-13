import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBell,
  FiBriefcase,
  FiCheckCircle,
  FiCheckSquare,
  FiClock,
  FiFileText,
  FiLink,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';
import SectionHeader from '../../../shared/components/SectionHeader';
import useNotificationStore from '../../../core/notifications/notificationStore';
import {
  fetchNotifications,
  markAllNotificationsReadRequest,
  markNotificationReadRequest
} from '../../../core/notifications/notificationApi';
import {
  getCampusConnectionDirectory,
  getCampusConnections,
  getCampusDrives,
  getCampusStats
} from '../services/campusConnectApi';

const EMPTY_WORKSPACE = {
  connections: [],
  directory: { companies: [], summary: null },
  drives: [],
  stats: {}
};

const normalizeCompanyKey = (value = '') => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const formatRelativeTime = (value) => {
  if (!value) return 'Recently';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Recently';

  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return diffDays <= 1 ? '1d ago' : `${diffDays}d ago`;
};

const formatDateTime = (value) => {
  if (!value) return 'Recently';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const getCampusNotificationMeta = (notification) => {
  const content = [
    notification?.title,
    notification?.message,
    notification?.type,
    notification?.link
  ].join(' ').toLowerCase();

  if (content.includes('drive')) {
    return {
      label: 'Drives',
      icon: FiBriefcase,
      badgeClassName: 'border-brand-200 bg-brand-50 text-brand-700'
    };
  }

  if (content.includes('connection') || content.includes('invite')) {
    return {
      label: 'Connections',
      icon: FiLink,
      badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700'
    };
  }

  if (content.includes('student') || content.includes('placement')) {
    return {
      label: 'Students',
      icon: FiUsers,
      badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700'
    };
  }

  return {
    label: 'Reports',
    icon: FiFileText,
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700'
  };
};

const buildDriveDraft = (company, notification) => ({
  companyName: company.companyName,
  jobTitle: '',
  driveMode: 'on-campus',
  location: company.location || '',
  visibilityScope: 'campus_only',
  description: [
    `Campus Connect partnership is active with ${company.companyName}.`,
    company.openRoles ? `Start with ${company.openRoles} visible role${company.openRoles > 1 ? 's' : ''} and align a hiring round.` : 'Use this workflow to align a hiring round and shortlist students.',
    notification?.title ? `Triggered from notification: "${notification.title}".` : ''
  ].filter(Boolean).join(' ')
});

const buildPoolPreparationState = (company) => ({
  companyName: company.companyName,
  companyUserId: company.companyUserId,
  suggestedBranches: company.suggestedBranches || [],
  suggestion: company.hasDrive
    ? `Refresh the eligible student pool for ${company.companyName} before the next shortlist round.`
    : `Prepare a clean student pool for ${company.companyName} so the first drive can be launched quickly.`
});

const buildConnectedPartnerships = ({ connections, directory, drives }) => {
  const directoryByUserId = Object.fromEntries((directory.companies || []).map((company) => [company.companyUserId, company]));
  const activeDriveCompanyKeys = new Set(
    (drives || []).map((drive) => normalizeCompanyKey(drive.company_name || drive.companyName || ''))
  );

  return (connections || [])
    .filter((connection) => connection.status === 'accepted')
    .map((connection) => {
      const company = directoryByUserId[connection.company_user_id] || {};
      const companyName = connection.company_name || company.companyName || 'Connected company';
      const normalizedKey = normalizeCompanyKey(companyName);
      const connectedAt = connection.responded_at || connection.created_at;
      const connectedDaysAgo = connectedAt
        ? Math.max(0, Math.floor((Date.now() - new Date(connectedAt).getTime()) / 86400000))
        : 999;
      const openRoles = Number(company.openRoles || 0);
      const hasDrive = activeDriveCompanyKeys.has(normalizedKey);
      const score = (
        (hasDrive ? 8 : 30)
        + Math.min(openRoles, 10) * 4
        + (company.isVerified ? 12 : 0)
        + (company.contactEmail ? 8 : 0)
        + (connectedDaysAgo <= 7 ? 16 : connectedDaysAgo <= 30 ? 8 : 0)
      );

      return {
        companyUserId: connection.company_user_id,
        companyName,
        contactName: company.contactName || '',
        contactEmail: company.contactEmail || '',
        location: company.location || '',
        companyWebsite: company.companyWebsite || '',
        isVerified: Boolean(company.isVerified),
        openRoles,
        hasDrive,
        connectedAt,
        connectedDaysAgo,
        score,
        recommendation: hasDrive
          ? 'Drive workflow already exists. Keep the pool warm and move faster on shortlist updates.'
          : 'No live drive exists yet. This partnership is the best place to launch the next campus workflow.',
        suggestedBranches: Array.isArray(company.preferredBranches) ? company.preferredBranches : []
      };
    })
    .sort((left, right) => right.score - left.score || left.companyName.localeCompare(right.companyName));
};

const matchCompanyToNotification = (notification, connectedPartnerships) => {
  const content = [
    notification?.title,
    notification?.message
  ].join(' ').toLowerCase();

  return [...connectedPartnerships]
    .sort((left, right) => right.companyName.length - left.companyName.length)
    .find((company) => {
      const key = normalizeCompanyKey(company.companyName);
      return key && content.includes(key);
    }) || null;
};

const buildNotificationActions = ({ notification, meta, matchedCompany }) => {
  const content = [
    notification?.title,
    notification?.message
  ].join(' ').toLowerCase();

  if (meta.label === 'Connections' && matchedCompany && (content.includes('accepted') || content.includes('approved') || content.includes('connected'))) {
    return [
      {
        to: '/portal/campus-connect/drives',
        state: {
          autoOpenDriveForm: true,
          prefillDrive: buildDriveDraft(matchedCompany, notification)
        },
        label: `Launch Drive`,
        variant: 'primary'
      },
      {
        to: '/portal/campus-connect/students',
        state: {
          poolPreparation: buildPoolPreparationState(matchedCompany)
        },
        label: 'Prepare Pool',
        variant: 'secondary'
      },
      {
        to: '/portal/campus-connect/relationship-activity/connected',
        label: 'View Partnership',
        variant: 'ghost'
      }
    ];
  }

  if (meta.label === 'Connections') {
    return [
      {
        to: notification.link || '/portal/campus-connect/relationship-activity/incoming',
        label: 'Review Request',
        variant: 'primary'
      }
    ];
  }

  if (meta.label === 'Drives') {
    return [
      {
        to: notification.link || '/portal/campus-connect/drives',
        label: 'Open Drive Workflow',
        variant: 'primary'
      }
    ];
  }

  if (meta.label === 'Students') {
    return [
      {
        to: notification.link || '/portal/campus-connect/students',
        label: 'Review Student Pool',
        variant: 'primary'
      }
    ];
  }

  return notification.link ? [
    {
      to: notification.link,
      label: 'Open Context',
      variant: 'primary'
    }
  ] : [];
};

const CampusNotificationsPage = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const loading = useNotificationStore((state) => state.loading);
  const hydrated = useNotificationStore((state) => state.hydrated);
  const storeError = useNotificationStore((state) => state.error);
  const replaceNotifications = useNotificationStore((state) => state.replaceNotifications);
  const setLoading = useNotificationStore((state) => state.setLoading);
  const markNotificationReadLocally = useNotificationStore((state) => state.markNotificationReadLocally);
  const markAllNotificationsReadLocally = useNotificationStore((state) => state.markAllNotificationsReadLocally);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);

  const [pageError, setPageError] = useState('');
  const [message, setMessage] = useState('');
  const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState('');

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

  useEffect(() => {
    let active = true;

    const loadWorkspace = async () => {
      setWorkspaceLoading(true);
      const [connectionsResponse, directoryResponse, drivesResponse, statsResponse] = await Promise.all([
        getCampusConnections(),
        getCampusConnectionDirectory(),
        getCampusDrives(),
        getCampusStats()
      ]);

      if (!active) return;

      setWorkspace({
        connections: connectionsResponse.data || [],
        directory: directoryResponse.data || { companies: [], summary: null },
        drives: drivesResponse.data || [],
        stats: statsResponse.data || {}
      });
      setWorkspaceError(
        [connectionsResponse.error, directoryResponse.error, drivesResponse.error, statsResponse.error]
          .filter(Boolean)
          .join(' | ')
      );
      setWorkspaceLoading(false);
    };

    loadWorkspace();

    return () => {
      active = false;
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );
  const actionableCount = useMemo(
    () => notifications.filter((notification) => Boolean(notification.link)).length,
    [notifications]
  );
  const latestNotification = notifications[0] || null;
  const isLoading = loading && !hydrated;
  const activeError = [storeError, pageError, workspaceError].filter(Boolean).join(' | ');

  const categoryCounts = useMemo(() => notifications.reduce((accumulator, notification) => {
    const key = getCampusNotificationMeta(notification).label;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {}), [notifications]);

  const connectedPartnerships = useMemo(
    () => buildConnectedPartnerships(workspace),
    [workspace]
  );

  const recommendedPartnerships = useMemo(
    () => connectedPartnerships.slice(0, 3),
    [connectedPartnerships]
  );

  const nextBusinessMove = useMemo(() => {
    if (workspace.stats?.totalStudents === 0) {
      return {
        title: 'Import student pool first',
        helper: 'No student pool is available yet, so the next business step is to onboard eligible candidates.',
        to: '/portal/campus-connect/students',
        label: 'Import Students'
      };
    }

    const firstOpportunity = connectedPartnerships[0];
    if (firstOpportunity) {
      return {
        title: `${firstOpportunity.companyName} is ready for activation`,
        helper: firstOpportunity.recommendation,
        to: '/portal/campus-connect/drives',
        state: {
          autoOpenDriveForm: true,
          prefillDrive: buildDriveDraft(firstOpportunity)
        },
        label: firstOpportunity.hasDrive ? 'Refresh Drive Workflow' : 'Launch First Drive'
      };
    }

    return {
      title: 'Review incoming company requests',
      helper: 'Accept a strong company request first, then launch a drive from the partnership.',
      to: '/portal/campus-connect/relationship-activity/incoming',
      label: 'Review Requests'
    };
  }, [connectedPartnerships, workspace.stats]);

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
      setMessage('All campus notifications marked as read.');
      window.setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      replaceNotifications(previousNotifications);
      setMessage(error.message || 'Unable to mark all notifications as read.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 pb-12">
      <SectionHeader
        eyebrow="Campus inbox"
        title="Campus notifications"
        subtitle="Review drive delivery summaries, company connection requests, and placement-side updates from one clean workspace."
        action={(
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
            >
              <FiCheckSquare size={14} />
              Mark all as read
            </button>
          ) : null
        )}
      />

      {activeError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{activeError}</div>
      ) : null}
      {message && !activeError ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total updates', value: notifications.length, helper: 'Stored in your campus workspace', icon: FiBell },
          { label: 'Unread', value: unreadCount, helper: 'Needs your attention', icon: FiCheckCircle },
          { label: 'Actionable', value: actionableCount, helper: 'Includes a linked portal action', icon: FiArrowRight },
          {
            label: 'Latest pulse',
            value: latestNotification ? formatRelativeTime(latestNotification.created_at || latestNotification.createdAt) : 'Clear',
            helper: latestNotification ? (latestNotification.title || 'Notification') : 'No new campus activity',
            icon: FiClock
          }
        ].map((stat) => (
          <article key={stat.label} className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-navy">{stat.value}</p>
                <p className="mt-2 text-xs text-slate-400">{stat.helper}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <stat.icon size={18} />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-slate-100 bg-[linear-gradient(135deg,#fff9ef,#ffffff)] p-5 shadow-[0_10px_28px_-18px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Business signal</p>
            <h2 className="mt-2 text-2xl font-bold text-navy">{nextBusinessMove.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{nextBusinessMove.helper}</p>
          </div>

          <Link
            to={nextBusinessMove.to}
            state={nextBusinessMove.state}
            className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
          >
            <FiTrendingUp size={15} />
            {nextBusinessMove.label}
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_10px_28px_-18px_rgba(15,23,42,0.18)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy">Activity feed</h2>
              <p className="mt-1 text-sm text-slate-500">Every campus-side alert stays timestamped, readable, and ready to convert into a next step.</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {notifications.length} notifications
            </div>
          </div>

          {isLoading || workspaceLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-[1.5rem] bg-slate-100" />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const meta = getCampusNotificationMeta(notification);
                const matchedCompany = matchCompanyToNotification(notification, connectedPartnerships);
                const actions = buildNotificationActions({ notification, meta, matchedCompany });
                const Icon = meta.icon;

                return (
                  <article
                    key={notification.id}
                    className={`rounded-[1.5rem] border p-5 transition ${
                      notification.is_read ? 'border-slate-200 bg-white' : 'border-brand-100 bg-brand-50/40'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-brand-700">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${meta.badgeClassName}`}>
                              {meta.label}
                            </span>
                            {!notification.is_read ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                New
                              </span>
                            ) : null}
                            {matchedCompany?.openRoles ? (
                              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                {matchedCompany.openRoles} open roles
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-navy">{notification.title || 'Notification'}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message || 'No details available yet.'}</p>

                          {matchedCompany ? (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Recommended next move</p>
                              <p className="mt-2 text-sm font-semibold text-navy">
                                {matchedCompany.hasDrive
                                  ? `Refresh the active workflow with ${matchedCompany.companyName}`
                                  : `Launch the first campus drive with ${matchedCompany.companyName}`}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{matchedCompany.recommendation}</p>
                            </div>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                              <FiClock size={12} />
                              {formatDateTime(notification.created_at || notification.createdAt)}
                            </span>
                            <span>{formatRelativeTime(notification.created_at || notification.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 lg:w-[280px] lg:justify-end">
                        {!notification.is_read ? (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(notification.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <FiCheckCircle size={14} />
                            Mark read
                          </button>
                        ) : null}

                        {actions.map((action) => (
                          <ActionLink key={`${notification.id}-${action.label}`} action={action} />
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <FiBell size={34} className="mx-auto text-slate-300" />
              <h3 className="mt-4 text-2xl font-bold text-navy">No campus notifications yet</h3>
              <p className="mt-2 text-sm text-slate-500">Drive delivery summaries and company connection activity will appear here.</p>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.6rem] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
            <h2 className="text-lg font-bold text-navy">Activity mix</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Drives', value: categoryCounts.Drives || 0 },
                { label: 'Connections', value: categoryCounts.Connections || 0 },
                { label: 'Students', value: categoryCounts.Students || 0 },
                { label: 'Reports', value: categoryCounts.Reports || 0 }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                  <span className="text-lg font-bold text-navy">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
            <h2 className="text-lg font-bold text-navy">Connected next steps</h2>
            <div className="mt-4 space-y-3">
              {recommendedPartnerships.length > 0 ? recommendedPartnerships.map((company) => (
                <div key={company.companyUserId} className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-navy">{company.companyName}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{company.recommendation}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      Score {company.score}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-500">
                      {company.openRoles || 0} roles
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-500">
                      {company.hasDrive ? 'Drive linked' : 'Drive missing'}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to="/portal/campus-connect/drives"
                      state={{
                        autoOpenDriveForm: true,
                        prefillDrive: buildDriveDraft(company)
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#ef5c30]"
                    >
                      <FiBriefcase size={13} />
                      {company.hasDrive ? 'Refresh Drive' : 'Launch Drive'}
                    </Link>
                    <Link
                      to="/portal/campus-connect/students"
                      state={{ poolPreparation: buildPoolPreparationState(company) }}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <FiUsers size={13} />
                      Prepare Pool
                    </Link>
                  </div>
                </div>
              )) : (
                <>
                  {[
                    { to: '/portal/campus-connect/drives', label: 'Review drives', icon: FiBriefcase },
                    { to: '/portal/campus-connect/connections', label: 'Open company requests', icon: FiLink },
                    { to: '/portal/campus-connect/students', label: 'Check student pool', icon: FiUsers }
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center justify-between rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                    >
                      <span className="inline-flex items-center gap-2">
                        <item.icon size={14} />
                        {item.label}
                      </span>
                      <FiArrowRight size={14} />
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

function ActionLink({ action }) {
  const variantClassName = action.variant === 'primary'
    ? 'bg-[#ff6b3d] text-white hover:bg-[#ef5c30]'
    : action.variant === 'secondary'
      ? 'border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <Link
      to={action.to}
      state={action.state}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${variantClassName}`}
    >
      <FiArrowRight size={14} />
      {action.label}
    </Link>
  );
}

export default CampusNotificationsPage;
