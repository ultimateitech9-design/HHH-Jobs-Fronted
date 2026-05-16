import { adminDummyData } from '../data/adminDummyData';
import { SUPER_ADMIN_BASE, safeRequest } from './usersApi';
import {
  mapApiApplicationToUi,
  mapApiJobToUi,
  mapApiPaymentToUi,
  mapApiSupportTicketToUi,
  mapApiSystemLogToUi,
  mapApiUserToUi
} from './mappers';

const isCampusConnectUser = (user = {}) => String(user?.role || '').toLowerCase() === 'campus_connect';

const buildDashboardFallback = () => ({
  stats: adminDummyData.dashboardStats,
  users: adminDummyData.users,
  companies: adminDummyData.companies,
  jobs: adminDummyData.jobs,
  applications: adminDummyData.applications,
  payments: adminDummyData.payments,
  subscriptions: adminDummyData.subscriptions,
  supportTickets: adminDummyData.supportTickets,
  systemLogs: adminDummyData.systemLogs,
  reports: adminDummyData.reports
});

const normalizeLogText = (value = '') => String(value || '').trim().toLowerCase();

const filterFallbackSystemLogs = (logs = [], filters = {}) => logs.filter((item) => {
  const search = normalizeLogText(filters.search);
  const level = normalizeLogText(filters.level);
  const module = normalizeLogText(filters.module);
  const actorRole = normalizeLogText(filters.actorRole);

  const matchesSearch = !search || [
    item.id,
    item.actorId,
    item.module,
    item.actor,
    item.actorRole,
    item.action,
    item.level,
    item.details
  ].some((value) => normalizeLogText(value).includes(search));

  const matchesLevel = !level || normalizeLogText(item.level) === level;
  const matchesModule = !module || normalizeLogText(item.module) === module;
  const matchesActorRole = !actorRole || normalizeLogText(item.actorRole) === actorRole;

  return matchesSearch && matchesLevel && matchesModule && matchesActorRole;
});

const buildSystemLogFallback = ({ filters = {}, page = 1, limit = 10 } = {}) => {
  const allLogs = adminDummyData.systemLogs.map(mapApiSystemLogToUi);
  const filteredLogs = filterFallbackSystemLogs(allLogs, filters);
  const total = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * limit;

  return {
    logs: filteredLogs.slice(offset, offset + limit),
    summary: {
      totalEvents: total,
      criticalEvents: filteredLogs.filter((item) => normalizeLogText(item.level) === 'critical').length,
      warningEvents: filteredLogs.filter((item) => normalizeLogText(item.level) === 'warning').length,
      managementActions: filteredLogs.filter((item) => normalizeLogText(item.actorRole) !== 'system').length
    },
    actorRoles: [...new Set(allLogs.map((item) => normalizeLogText(item.actorRole)).filter(Boolean))].sort(),
    modules: [...new Set(allLogs.map((item) => normalizeLogText(item.module)).filter(Boolean))].sort(),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages
    }
  };
};

export const getSuperAdminDashboard = async () =>
  safeRequest({
    path: `${SUPER_ADMIN_BASE}/dashboard`,
    emptyData: {},
    fallbackData: buildDashboardFallback,
    extract: (payload) => {
      const dashboard = payload?.dashboard || payload || {};
      const users = (dashboard.users || []).map(mapApiUserToUi).filter((user) => !isCampusConnectUser(user));
      return {
        ...dashboard,
        users,
        jobs: (dashboard.jobs || []).map(mapApiJobToUi),
        applications: (dashboard.applications || []).map(mapApiApplicationToUi),
        payments: (dashboard.payments || []).map(mapApiPaymentToUi),
        supportTickets: (dashboard.supportTickets || []).map(mapApiSupportTicketToUi),
        systemLogs: (dashboard.systemLogs || []).map(mapApiSystemLogToUi)
      };
    }
  });

export const getReportsAnalytics = async () =>
  safeRequest({
    path: `${SUPER_ADMIN_BASE}/reports`,
    emptyData: {},
    fallbackData: adminDummyData.reports,
    extract: (payload) => payload?.reports || payload || {}
  });

export const getSupportTickets = async () =>
  safeRequest({
    path: `${SUPER_ADMIN_BASE}/support-tickets`,
    emptyData: [],
    fallbackData: adminDummyData.supportTickets,
    extract: (payload) => (payload?.tickets || []).map(mapApiSupportTicketToUi)
  });

export const getSystemLogs = async ({ filters = {}, page = 1, limit = 10 } = {}) =>
  safeRequest({
    path: (() => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });

      if (filters.search) params.set('search', filters.search);
      if (filters.level) params.set('level', filters.level);
      if (filters.module) params.set('module', filters.module);
      if (filters.actorRole) params.set('actorRole', filters.actorRole);

      return `${SUPER_ADMIN_BASE}/system-logs?${params.toString()}`;
    })(),
    emptyData: {
      logs: [],
      summary: { totalEvents: 0, criticalEvents: 0, warningEvents: 0, managementActions: 0 },
      actorRoles: [],
      modules: [],
      pagination: { page: 1, limit, total: 0, totalPages: 1 }
    },
    fallbackData: () => buildSystemLogFallback({ filters, page, limit }),
    extract: (payload) => ({
      logs: (payload?.logs || []).map(mapApiSystemLogToUi),
      summary: payload?.summary || { totalEvents: 0, criticalEvents: 0, warningEvents: 0, managementActions: 0 },
      actorRoles: Array.isArray(payload?.actorRoles) ? payload.actorRoles : [],
      modules: Array.isArray(payload?.modules) ? payload.modules : [],
      pagination: payload?.pagination || { page, limit, total: 0, totalPages: 1 }
    })
  });
