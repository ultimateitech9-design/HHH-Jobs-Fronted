import { apiFetch, areDemoFallbacksEnabled } from '../../../utils/api';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const clone = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

const emptyLike = (value) => {
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, emptyLike(item)]));
  }
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  return '';
};

const nowIso = () => new Date().toISOString();
const isoHoursAgo = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

const auditDemoState = {
  events: [
    {
      id: 'evt-1001',
      user_id: 'usr-admin-01',
      action: 'job_approved',
      entity_type: 'job',
      entity_id: 'JOB-2201',
      details: { actor: 'admin', outcome: 'approved', company: 'Alpha Talent Labs' },
      ip_address: '10.10.0.15',
      created_at: isoHoursAgo(2),
      severity: 'warning'
    },
    {
      id: 'evt-1002',
      user_id: 'usr-security-02',
      action: 'tenant_mfa_policy_updated',
      entity_type: 'tenant',
      entity_id: 'tenant-alpha',
      details: { previous: 'optional', next: 'required' },
      ip_address: '10.10.0.21',
      created_at: isoHoursAgo(5),
      severity: 'info'
    },
    {
      id: 'evt-1003',
      user_id: 'system',
      action: 'billing_webhook_failed',
      entity_type: 'integration',
      entity_id: 'int-1002',
      details: { retries: 6, tenant: 'Orbit Hiring Hub', status: 'failed' },
      ip_address: '10.10.0.44',
      created_at: isoHoursAgo(9),
      severity: 'danger'
    },
    {
      id: 'evt-1004',
      user_id: 'usr-audit-03',
      action: 'permission_review_completed',
      entity_type: 'role_policy',
      entity_id: 'policy-771',
      details: { reviewedBy: 'Audit Desk', exceptions: 1 },
      ip_address: '10.10.0.33',
      created_at: isoHoursAgo(14),
      severity: 'info'
    }
  ],
  alerts: [
    {
      id: 'alt-2001',
      title: 'Webhook failure spike',
      description: 'Billing retries crossed the failure threshold for Orbit Hiring Hub.',
      severity: 'high',
      status: 'open',
      owner: 'Platform Ops',
      created_at: isoHoursAgo(8),
      updated_at: isoHoursAgo(1)
    },
    {
      id: 'alt-2002',
      title: 'Dormant elevated users detected',
      description: 'Suspended tenant still has users with admin-level access.',
      severity: 'critical',
      status: 'in_review',
      owner: 'Compliance',
      created_at: isoHoursAgo(20),
      updated_at: isoHoursAgo(3)
    },
    {
      id: 'alt-2003',
      title: 'Moderator approval backlog',
      description: 'Job approval queue exceeded the internal SLA target.',
      severity: 'medium',
      status: 'resolved',
      owner: 'Admin Ops',
      created_at: isoHoursAgo(26),
      updated_at: isoHoursAgo(4)
    }
  ],
  complianceChecks: [
    {
      id: 'cmp-3001',
      control: 'Privileged access review',
      owner: 'Compliance',
      status: 'critical',
      target: 'Weekly review',
      observed: 'Overdue by 5 days',
      note: 'Maple Careers elevated accounts remain active.'
    },
    {
      id: 'cmp-3002',
      control: 'MFA adoption for tenant admins',
      owner: 'Security',
      status: 'degraded',
      target: '100%',
      observed: '92%',
      note: 'Orbit tenant onboarding still incomplete.'
    },
    {
      id: 'cmp-3003',
      control: 'Audit log retention verification',
      owner: 'Platform Ops',
      status: 'healthy',
      target: '365 days',
      observed: 'Confirmed',
      note: 'Retention pipeline within policy.'
    }
  ]
};

const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

const safeRequest = async ({ path, fallback, extract = (payload) => payload }) => {
  try {
    const data = await strictRequest({ path, extract });
    return { data, isDemo: false, error: '' };
  } catch (error) {
    const fallbackData = typeof fallback === 'function' ? fallback() : fallback;
    if (!areDemoFallbacksEnabled()) {
      return { data: emptyLike(fallbackData), isDemo: false, error: error.message || 'Request failed.' };
    }
    return { data: clone(fallbackData), isDemo: true, error: error.message || 'Request failed.' };
  }
};

const safeMutation = async ({ path, options, extract = (payload) => payload }, fallbackAction) => {
  try {
    return await strictRequest({ path, options, extract });
  } catch (error) {
    if (typeof fallbackAction !== 'function') {
      throw error;
    }
    return clone(fallbackAction(error));
  }
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, value);
    }
  });
  return query.toString();
};

const filterAuditEvents = (events = [], filters = {}) => {
  const search = String(filters.search || '').toLowerCase();
  const userId = String(filters.userId || '').toLowerCase();
  const action = String(filters.action || '').toLowerCase();
  const entityType = String(filters.entityType || '').toLowerCase();
  const severity = String(filters.severity || '').toLowerCase();

  return events.filter((event) => {
    const detailsText = typeof event.details === 'string' ? event.details : JSON.stringify(event.details || {});
    const searchable = `${event.user_id} ${event.action} ${event.entity_type} ${event.entity_id} ${detailsText}`.toLowerCase();

    return (!userId || String(event.user_id || '').toLowerCase().includes(userId))
      && (!action || String(event.action || '').toLowerCase().includes(action))
      && (!entityType || String(event.entity_type || '').toLowerCase().includes(entityType))
      && (!severity || String(event.severity || '').toLowerCase() === severity)
      && (!search || searchable.includes(search));
  });
};

const paginate = (rows = [], page = 1, limit = 20) => {
  const safePage = Math.max(1, Number(page || 1));
  const safeLimit = Math.max(1, Math.min(200, Number(limit || 20)));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit;

  return {
    auditLogs: rows.slice(from, to),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: rows.length,
      totalPages: Math.max(1, Math.ceil(rows.length / safeLimit))
    }
  };
};

export const getAuditEvents = async (filters = {}) => {
  const query = buildQueryString({
    userId: filters.userId,
    action: filters.action,
    entityType: filters.entityType,
    severity: filters.severity,
    search: filters.search,
    page: filters.page || 1,
    limit: filters.limit || 20
  });

  return safeRequest({
    path: `/audit/events${query ? `?${query}` : ''}`,
    fallback: () => paginate(
      filterAuditEvents(auditDemoState.events, filters),
      filters.page || 1,
      filters.limit || 20
    ),
    extract: (payload) => ({
      auditLogs: payload?.auditLogs || [],
      pagination: payload?.pagination || {
        page: Number(filters.page || 1),
        limit: Number(filters.limit || 20),
        total: 0,
        totalPages: 1
      }
    })
  });
};

export const getAuditSummary = async () =>
  safeRequest({
    path: '/audit/summary',
    fallback: () => ({
      events24h: auditDemoState.events.length,
      criticalAlerts: auditDemoState.alerts.filter((alert) => ['critical', 'high'].includes(String(alert.severity || '').toLowerCase())).length,
      warnings: auditDemoState.events.filter((event) => String(event.severity || '').toLowerCase() === 'warning').length,
      informational: auditDemoState.events.filter((event) => String(event.severity || '').toLowerCase() === 'info').length
    }),
    extract: (payload) => payload?.summary || {
      events24h: 0,
      criticalAlerts: 0,
      warnings: 0,
      informational: 0
    }
  });

export const getAuditAlerts = async (filters = {}) => {
  const query = buildQueryString({
    status: filters.status,
    severity: filters.severity,
    search: filters.search
  });

  return safeRequest({
    path: `/audit/alerts${query ? `?${query}` : ''}`,
    fallback: () => auditDemoState.alerts.filter((alert) => {
      const statusMatch = !filters.status || String(alert.status || '').toLowerCase() === String(filters.status || '').toLowerCase();
      const severityMatch = !filters.severity || String(alert.severity || '').toLowerCase() === String(filters.severity || '').toLowerCase();
      const searchMatch = !filters.search
        || `${alert.title} ${alert.description} ${alert.owner}`.toLowerCase().includes(String(filters.search || '').toLowerCase());
      return statusMatch && severityMatch && searchMatch;
    }),
    extract: (payload) => payload?.alerts || []
  });
};

export const updateAuditAlert = async (alertId, payload) =>
  safeMutation(
    {
      path: `/audit/alerts/${alertId}`,
      options: { method: 'PATCH', body: JSON.stringify(payload) },
      extract: (responsePayload) => responsePayload?.alert || responsePayload
    },
    () => {
      const index = auditDemoState.alerts.findIndex((alert) => alert.id === alertId);
      if (index === -1) {
        throw new Error('Alert not found');
      }

      auditDemoState.alerts[index] = {
        ...auditDemoState.alerts[index],
        ...payload,
        updated_at: nowIso()
      };

      return auditDemoState.alerts[index];
    }
  );

export const getAuditComplianceChecks = async () =>
  safeRequest({
    path: '/audit/compliance-checks',
    fallback: () => auditDemoState.complianceChecks,
    extract: (payload) => payload?.checks || []
  });

export const updateAuditComplianceCheck = async (checkId, payload) =>
  safeMutation(
    {
      path: `/audit/compliance-checks/${checkId}`,
      options: { method: 'PATCH', body: JSON.stringify(payload) },
      extract: (responsePayload) => responsePayload?.check || responsePayload
    },
    () => {
      const index = auditDemoState.complianceChecks.findIndex((check) => check.id === checkId);
      if (index === -1) {
        throw new Error('Compliance check not found');
      }

      auditDemoState.complianceChecks[index] = {
        ...auditDemoState.complianceChecks[index],
        ...payload
      };

      return auditDemoState.complianceChecks[index];
    }
  );

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};
