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

export const getSystemLogs = async () =>
  safeRequest({
    path: `${SUPER_ADMIN_BASE}/system-logs`,
    emptyData: [],
    fallbackData: adminDummyData.systemLogs,
    extract: (payload) => (payload?.logs || []).map(mapApiSystemLogToUi)
  });
