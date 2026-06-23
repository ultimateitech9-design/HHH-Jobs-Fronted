import { apiFetch, areDemoFallbacksEnabled } from '../../../utils/api';
import { formatDateTime as formatSharedDateTime } from '../../../shared/utils/dateTime';

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

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const nowIso = () => new Date().toISOString();
const isoDaysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const createPlatformDemoState = () => ({
  tenants: [
    {
      id: 'tenant-alpha',
      name: 'Alpha Talent Labs',
      status: 'active',
      plan: 'enterprise',
      domain: 'alpha.hhh-jobs.demo',
      recruiterSeats: 40,
      jobLimit: 500,
      activeUsers: 28,
      renewalDate: isoDaysFromNow(24).slice(0, 10),
      complianceStatus: 'healthy',
      slaTier: 'Enterprise',
      logoUrl: '',
      primaryColor: '#215479',
      isActive: true
    },
    {
      id: 'tenant-orbit',
      name: 'Orbit Hiring Hub',
      status: 'pending',
      plan: 'growth',
      domain: 'orbit.hhh-jobs.demo',
      recruiterSeats: 18,
      jobLimit: 180,
      activeUsers: 9,
      renewalDate: isoDaysFromNow(42).slice(0, 10),
      complianceStatus: 'degraded',
      slaTier: 'Priority',
      logoUrl: '',
      primaryColor: '#1e5f74',
      isActive: false
    },
    {
      id: 'tenant-maple',
      name: 'Maple Careers',
      status: 'suspended',
      plan: 'starter',
      domain: 'maple.hhh-jobs.demo',
      recruiterSeats: 8,
      jobLimit: 50,
      activeUsers: 3,
      renewalDate: isoDaysFromNow(-5).slice(0, 10),
      complianceStatus: 'critical',
      slaTier: 'Standard',
      logoUrl: '',
      primaryColor: '#7b341e',
      isActive: false
    }
  ],
  plans: [
    {
      id: 'plan-starter',
      key: 'starter',
      name: 'Starter',
      monthlyPrice: 4999,
      recruiterSeats: 10,
      jobLimit: 60,
      features: ['basic support', 'single brand site'],
      currency: 'INR',
      isActive: true
    },
    {
      id: 'plan-growth',
      key: 'growth',
      name: 'Growth',
      monthlyPrice: 14999,
      recruiterSeats: 25,
      jobLimit: 220,
      features: ['priority support', 'workflow automations', 'custom reports'],
      currency: 'INR',
      isActive: true
    },
    {
      id: 'plan-enterprise',
      key: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 39999,
      recruiterSeats: 75,
      jobLimit: 1000,
      features: ['dedicated success', 'multi-brand setup', 'sla commitments'],
      currency: 'INR',
      isActive: true
    }
  ],
  invoices: [
    {
      id: 'inv-1001',
      tenantId: 'tenant-alpha',
      amount: 39999,
      currency: 'INR',
      status: 'paid',
      issuedAt: isoDaysFromNow(-7),
      dueAt: isoDaysFromNow(7),
      paidAt: isoDaysFromNow(-5)
    },
    {
      id: 'inv-1002',
      tenantId: 'tenant-orbit',
      amount: 14999,
      currency: 'INR',
      status: 'pending',
      issuedAt: isoDaysFromNow(-2),
      dueAt: isoDaysFromNow(10),
      paidAt: null
    },
    {
      id: 'inv-1003',
      tenantId: 'tenant-maple',
      amount: 4999,
      currency: 'INR',
      status: 'failed',
      issuedAt: isoDaysFromNow(-12),
      dueAt: isoDaysFromNow(-4),
      paidAt: null
    }
  ],
  integrations: [
    {
      id: 'int-1001',
      tenantId: 'tenant-alpha',
      name: 'ATS Sync',
      category: 'ats',
      status: 'active',
      latencyMs: 182,
      owner: 'Platform Ops',
      lastSyncAt: isoDaysFromNow(0),
      note: 'Healthy sync cadence'
    },
    {
      id: 'int-1002',
      tenantId: 'tenant-orbit',
      name: 'Billing Webhook',
      category: 'billing',
      status: 'degraded',
      latencyMs: 1260,
      owner: 'Finance Tech',
      lastSyncAt: isoDaysFromNow(-1),
      note: 'Retry backlog observed'
    },
    {
      id: 'int-1003',
      tenantId: 'tenant-maple',
      name: 'Identity Provider',
      category: 'auth',
      status: 'offline',
      latencyMs: 0,
      owner: 'Security',
      lastSyncAt: isoDaysFromNow(-2),
      note: 'Connector disabled pending incident review'
    }
  ],
  supportTickets: [
    {
      id: 'plt-sup-1',
      tenantId: 'tenant-alpha',
      title: 'SSO onboarding handoff blocked',
      priority: 'high',
      status: 'open',
      owner: 'Riya Ops',
      note: 'Waiting for IdP metadata confirmation',
      createdAt: isoDaysFromNow(-1),
      updatedAt: isoDaysFromNow(0)
    },
    {
      id: 'plt-sup-2',
      tenantId: 'tenant-orbit',
      title: 'Invoice webhook retry queue growing',
      priority: 'medium',
      status: 'in_review',
      owner: 'Karan Platform',
      note: 'Finance event replay running',
      createdAt: isoDaysFromNow(-2),
      updatedAt: isoDaysFromNow(-1)
    }
  ],
  securityChecks: [
    {
      id: 'sec-1001',
      control: 'Tenant MFA coverage',
      owner: 'Security',
      status: 'healthy',
      note: '92% of admin users protected',
      target: '100% admin MFA',
      observed: '92%'
    },
    {
      id: 'sec-1002',
      control: 'Webhook signing validation',
      owner: 'Platform Ops',
      status: 'degraded',
      note: 'Orbit billing endpoints still on fallback secret rotation',
      target: 'Rotated every 30 days',
      observed: 'Rotation overdue'
    },
    {
      id: 'sec-1003',
      control: 'Dormant admin account review',
      owner: 'Compliance',
      status: 'critical',
      note: 'Suspended tenant still has active elevated users',
      target: 'Zero stale elevated accounts',
      observed: '3 stale accounts'
    }
  ],
  customizations: {
    'tenant-alpha': {
      logoUrl: '',
      primaryColor: '#215479',
      accentColor: '#1f7a61',
      customDomain: 'alpha.hhh-jobs.demo',
      enableWidgets: true,
      enableRolePermissions: true,
      enableCareerSite: true,
      dashboardWidgets: ['applications', 'jobs', 'pipeline'],
      footerText: 'Alpha Talent Labs Careers'
    },
    'tenant-orbit': {
      logoUrl: '',
      primaryColor: '#1e5f74',
      accentColor: '#ca8a04',
      customDomain: 'orbit.hhh-jobs.demo',
      enableWidgets: true,
      enableRolePermissions: true,
      enableCareerSite: true,
      dashboardWidgets: ['applications', 'alerts', 'compliance'],
      footerText: 'Orbit Hiring Hub'
    }
  }
});

const platformDemoState = createPlatformDemoState();

const mapTenantName = (tenantId) =>
  platformDemoState.tenants.find((tenant) => tenant.id === tenantId)?.name || tenantId || '-';

const buildOverview = () => {
  const totalTenants = platformDemoState.tenants.length;
  const activeTenants = platformDemoState.tenants.filter((tenant) => tenant.status === 'active').length;
  const pendingTenants = platformDemoState.tenants.filter((tenant) => tenant.status === 'pending').length;
  const suspendedTenants = platformDemoState.tenants.filter((tenant) => tenant.status === 'suspended').length;
  const openTickets = platformDemoState.supportTickets.filter((ticket) => ticket.status === 'open').length;
  const healthyIntegrations = platformDemoState.integrations.filter((integration) => integration.status === 'active').length;
  const degradedIntegrations = platformDemoState.integrations.length - healthyIntegrations;
  const monthlyRevenue = platformDemoState.invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const complianceHealthy = platformDemoState.securityChecks.filter((check) => check.status === 'healthy').length;
  const complianceTotal = platformDemoState.securityChecks.length;

  return {
    totalTenants,
    activeTenants,
    suspendedTenants,
    pendingTenants,
    openTickets,
    healthyIntegrations,
    degradedIntegrations,
    monthlyRevenue,
    complianceHealthy,
    complianceTotal
  };
};

const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

const readRequest = async ({ path, fallback, extract = (payload) => payload }) => {
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

const demoMutation = async (request, fallbackAction) => {
  try {
    return await strictRequest(request);
  } catch (error) {
    if (typeof fallbackAction !== 'function') {
      throw error;
    }
    return clone(fallbackAction(error));
  }
};

export const getPlatformOverview = async () =>
  readRequest({
    path: '/platform/overview',
    fallback: buildOverview,
    extract: (payload) => payload?.overview || {}
  });

export const getPlatformTenants = async () =>
  readRequest({
    path: '/platform/tenants',
    fallback: () => platformDemoState.tenants,
    extract: (payload) => payload?.tenants || []
  });

export const createPlatformTenant = async (payload) =>
  demoMutation(
    {
      path: '/platform/tenants',
      options: { method: 'POST', body: JSON.stringify(payload) },
      extract: (responsePayload) => responsePayload?.tenant || responsePayload
    },
    () => {
      const created = {
        id: makeId('tenant'),
        name: String(payload?.name || '').trim(),
        status: String(payload?.status || 'pending').trim() || 'pending',
        plan: String(payload?.plan || 'starter').trim() || 'starter',
        domain: String(payload?.domain || '').trim(),
        recruiterSeats: Number(payload?.recruiterSeats || 0),
        jobLimit: Number(payload?.jobLimit || 0),
        activeUsers: Number(payload?.activeUsers || 0),
        renewalDate: String(payload?.renewalDate || '').trim(),
        complianceStatus: String(payload?.complianceStatus || 'healthy').trim() || 'healthy',
        slaTier: String(payload?.slaTier || 'Standard').trim() || 'Standard',
        logoUrl: '',
        primaryColor: '#215479',
        isActive: String(payload?.status || '').trim() === 'active'
      };

      platformDemoState.tenants.unshift(created);
      platformDemoState.customizations[created.id] = {
        logoUrl: '',
        primaryColor: created.primaryColor,
        accentColor: '#1f7a61',
        customDomain: created.domain || '',
        enableWidgets: true,
        enableRolePermissions: true,
        enableCareerSite: true,
        dashboardWidgets: ['applications', 'jobs'],
        footerText: created.name ? `${created.name} Careers` : ''
      };

      return created;
    }
  );

export const updatePlatformTenant = async (tenantId, payload) =>
  demoMutation(
    {
      path: `/platform/tenants/${tenantId}`,
      options: { method: 'PATCH', body: JSON.stringify(payload) },
      extract: (responsePayload) => responsePayload?.tenant || responsePayload
    },
    () => {
      const index = platformDemoState.tenants.findIndex((tenant) => tenant.id === tenantId);
      if (index === -1) {
        throw new Error('Tenant not found');
      }

      platformDemoState.tenants[index] = {
        ...platformDemoState.tenants[index],
        ...payload,
        recruiterSeats: payload?.recruiterSeats !== undefined ? Number(payload.recruiterSeats || 0) : platformDemoState.tenants[index].recruiterSeats,
        jobLimit: payload?.jobLimit !== undefined ? Number(payload.jobLimit || 0) : platformDemoState.tenants[index].jobLimit,
        activeUsers: payload?.activeUsers !== undefined ? Number(payload.activeUsers || 0) : platformDemoState.tenants[index].activeUsers,
        isActive: payload?.status ? String(payload.status) === 'active' : platformDemoState.tenants[index].isActive
      };

      if (payload?.domain !== undefined) {
        const customization = platformDemoState.customizations[tenantId] || {};
        platformDemoState.customizations[tenantId] = {
          ...customization,
          customDomain: String(payload.domain || '').trim()
        };
      }

      return platformDemoState.tenants[index];
    }
  );

export const deletePlatformTenant = async (tenantId) =>
  demoMutation(
    {
      path: `/platform/tenants/${tenantId}`,
      options: { method: 'DELETE' },
      extract: (responsePayload) => ({ removed: responsePayload?.removed || 0 })
    },
    () => {
      const before = platformDemoState.tenants.length;
      platformDemoState.tenants = platformDemoState.tenants.filter((tenant) => tenant.id !== tenantId);
      delete platformDemoState.customizations[tenantId];
      platformDemoState.invoices = platformDemoState.invoices.filter((invoice) => invoice.tenantId !== tenantId);
      platformDemoState.integrations = platformDemoState.integrations.filter((integration) => integration.tenantId !== tenantId);
      platformDemoState.supportTickets = platformDemoState.supportTickets.filter((ticket) => ticket.tenantId !== tenantId);
      return { removed: before - platformDemoState.tenants.length };
    }
  );

export const getPlatformPlans = async () =>
  readRequest({
    path: '/platform/plans',
    fallback: () => platformDemoState.plans,
    extract: (payload) => payload?.plans || []
  });

export const savePlatformPlan = async (planPayload) =>
  demoMutation(
    {
      path: '/platform/plans',
      options: { method: 'POST', body: JSON.stringify(planPayload) },
      extract: (payload) => payload?.plan || payload
    },
    () => {
      const nextPlan = {
        id: `plan-${String(planPayload?.key || makeId('plan')).toLowerCase()}`,
        key: String(planPayload?.key || '').trim().toLowerCase(),
        name: String(planPayload?.name || '').trim(),
        monthlyPrice: Number(planPayload?.monthlyPrice || 0),
        recruiterSeats: Number(planPayload?.recruiterSeats || 0),
        jobLimit: Number(planPayload?.jobLimit || 0),
        features: Array.isArray(planPayload?.features) ? planPayload.features : [],
        currency: 'INR',
        isActive: true
      };

      const index = platformDemoState.plans.findIndex((plan) => plan.key === nextPlan.key);
      if (index === -1) {
        platformDemoState.plans.unshift(nextPlan);
      } else {
        platformDemoState.plans[index] = { ...platformDemoState.plans[index], ...nextPlan };
      }

      return platformDemoState.plans.find((plan) => plan.key === nextPlan.key) || nextPlan;
    }
  );

export const getPlatformInvoices = async () =>
  readRequest({
    path: '/platform/invoices',
    fallback: () => platformDemoState.invoices.map((invoice) => ({
      ...invoice,
      tenantName: mapTenantName(invoice.tenantId)
    })),
    extract: (payload) => payload?.invoices || []
  });

export const updatePlatformInvoiceStatus = async (invoiceId, status) =>
  demoMutation(
    {
      path: `/platform/invoices/${invoiceId}/status`,
      options: { method: 'PATCH', body: JSON.stringify({ status }) },
      extract: (payload) => payload?.invoice || payload
    },
    () => {
      const index = platformDemoState.invoices.findIndex((invoice) => invoice.id === invoiceId);
      if (index === -1) {
        throw new Error('Invoice not found');
      }

      platformDemoState.invoices[index] = {
        ...platformDemoState.invoices[index],
        status,
        paidAt: status === 'paid' ? nowIso() : null
      };

      return {
        ...platformDemoState.invoices[index],
        tenantName: mapTenantName(platformDemoState.invoices[index].tenantId)
      };
    }
  );

export const getPlatformIntegrations = async () =>
  readRequest({
    path: '/platform/integrations',
    fallback: () => platformDemoState.integrations,
    extract: (payload) => payload?.integrations || []
  });

export const updatePlatformIntegration = async (integrationId, payload) =>
  demoMutation(
    {
      path: `/platform/integrations/${integrationId}`,
      options: { method: 'PATCH', body: JSON.stringify(payload) },
      extract: (responsePayload) => responsePayload?.integration || responsePayload
    },
    () => {
      const index = platformDemoState.integrations.findIndex((integration) => integration.id === integrationId);
      if (index === -1) {
        throw new Error('Integration not found');
      }

      platformDemoState.integrations[index] = {
        ...platformDemoState.integrations[index],
        ...payload,
        latencyMs: payload?.latencyMs !== undefined ? Number(payload.latencyMs || 0) : platformDemoState.integrations[index].latencyMs
      };

      return platformDemoState.integrations[index];
    }
  );

export const runPlatformIntegrationSync = async (integrationId) =>
  demoMutation(
    {
      path: `/platform/integrations/${integrationId}/sync`,
      options: { method: 'POST', body: JSON.stringify({}) },
      extract: (responsePayload) => responsePayload?.integration || responsePayload
    },
    () => {
      const index = platformDemoState.integrations.findIndex((integration) => integration.id === integrationId);
      if (index === -1) {
        throw new Error('Integration not found');
      }

      platformDemoState.integrations[index] = {
        ...platformDemoState.integrations[index],
        lastSyncAt: nowIso(),
        latencyMs: Math.max(80, Number(platformDemoState.integrations[index].latencyMs || 180))
      };

      return platformDemoState.integrations[index];
    }
  );

export const getPlatformSupportTickets = async () =>
  readRequest({
    path: '/platform/support-tickets',
    fallback: () => platformDemoState.supportTickets.map((ticket) => ({
      ...ticket,
      tenantName: mapTenantName(ticket.tenantId)
    })),
    extract: (payload) => payload?.tickets || []
  });

export const updatePlatformSupportTicket = async (ticketId, payload) =>
  demoMutation(
    {
      path: `/platform/support-tickets/${ticketId}`,
      options: { method: 'PATCH', body: JSON.stringify(payload) },
      extract: (responsePayload) => responsePayload?.ticket || responsePayload
    },
    () => {
      const index = platformDemoState.supportTickets.findIndex((ticket) => ticket.id === ticketId);
      if (index === -1) {
        throw new Error('Ticket not found');
      }

      platformDemoState.supportTickets[index] = {
        ...platformDemoState.supportTickets[index],
        ...payload,
        updatedAt: nowIso()
      };

      return {
        ...platformDemoState.supportTickets[index],
        tenantName: mapTenantName(platformDemoState.supportTickets[index].tenantId)
      };
    }
  );

export const getPlatformSecurityChecks = async () =>
  readRequest({
    path: '/platform/security-checks',
    fallback: () => platformDemoState.securityChecks,
    extract: (payload) => payload?.checks || []
  });

export const updatePlatformSecurityCheck = async (checkId, payload) =>
  demoMutation(
    {
      path: `/platform/security-checks/${checkId}`,
      options: { method: 'PATCH', body: JSON.stringify(payload) },
      extract: (responsePayload) => responsePayload?.check || responsePayload
    },
    () => {
      const index = platformDemoState.securityChecks.findIndex((check) => check.id === checkId);
      if (index === -1) {
        throw new Error('Security check not found');
      }

      platformDemoState.securityChecks[index] = {
        ...platformDemoState.securityChecks[index],
        ...payload
      };

      return platformDemoState.securityChecks[index];
    }
  );

export const getPlatformCustomization = async (tenantId) =>
  readRequest({
    path: `/platform/customization/${tenantId}`,
    fallback: () => {
      if (!platformDemoState.customizations[tenantId]) {
        const tenant = platformDemoState.tenants.find((item) => item.id === tenantId);
        platformDemoState.customizations[tenantId] = {
          logoUrl: '',
          primaryColor: tenant?.primaryColor || '#215479',
          accentColor: '#1f7a61',
          customDomain: tenant?.domain || '',
          enableWidgets: true,
          enableRolePermissions: true,
          enableCareerSite: true,
          dashboardWidgets: ['applications', 'jobs'],
          footerText: tenant?.name ? `${tenant.name} Careers` : ''
        };
      }

      return platformDemoState.customizations[tenantId];
    },
    extract: (payload) => payload?.customization || {}
  });

export const savePlatformCustomization = async (tenantId, payload) =>
  demoMutation(
    {
      path: `/platform/customization/${tenantId}`,
      options: { method: 'PUT', body: JSON.stringify(payload) },
      extract: (responsePayload) => responsePayload?.customization || responsePayload
    },
    () => {
      const current = platformDemoState.customizations[tenantId] || {};
      platformDemoState.customizations[tenantId] = {
        ...current,
        ...payload,
        dashboardWidgets: Array.isArray(payload?.dashboardWidgets)
          ? [...payload.dashboardWidgets]
          : (current.dashboardWidgets || ['applications', 'jobs'])
      };

      return platformDemoState.customizations[tenantId];
    }
  );

export const formatDateTime = (value) => {
  const formatted = formatSharedDateTime(value);
  return formatted === '-' && value ? String(value) : formatted;
};
