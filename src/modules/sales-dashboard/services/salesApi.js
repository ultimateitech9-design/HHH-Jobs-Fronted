import { apiFetch } from '../../../utils/api';
import { mapSalesAgent, mapSalesProduct } from './mappers';

export const SALES_BASE = '/sales';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

export const safeRequest = async ({ path, options, emptyData, extract = (payload) => payload }) => {
  try {
    const data = await strictRequest({ path, options, extract });
    return { data, error: '' };
  } catch (error) {
    return {
      data: emptyData,
      error: error.message || 'Request failed.'
    };
  }
};

export const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

const emptyOverview = {
  stats: {
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    paidPayments: 0,
    pendingPayments: 0,
    openLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    activeCustomers: 0,
    planPendingCustomers: 0,
    totalLeads: 0,
    totalCustomers: 0,
    salesAgents: 0,
    refunds: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    managedLeads: 0,
    contactedLeads: 0,
    untouchedLeads: 0,
    followupDueToday: 0,
    overdueFollowups: 0,
    upcomingFollowups: 0,
    pendingPaymentValue: 0,
    refundValue: 0
  },
  monthlySales: [],
  revenueTrend: [],
  workQueue: [],
  audienceBreakdown: [],
  paymentSummary: {},
  recentActivity: []
};

const SALES_FUNNEL_STAGE_ALIASES = Object.freeze({
  new: 'new',
  'new leads': 'new',
  contacted: 'contacted',
  qualified: 'qualified',
  proposal: 'proposal',
  converted: 'converted',
  won: 'converted',
  lost: 'lost'
});

const toTitleCase = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const normalizeFunnelStage = (entry = {}) => {
  const rawStage = String(entry.stage || entry.label || '').trim();
  const normalizedKey = rawStage.toLowerCase();
  const stage = SALES_FUNNEL_STAGE_ALIASES[normalizedKey] || normalizedKey || 'new';
  const defaultLabel = stage === 'new'
    ? 'New'
    : stage === 'converted'
      ? 'Converted'
      : toTitleCase(stage);

  return {
    stage,
    label: entry.label || defaultLabel,
    count: Number(entry.count || 0)
  };
};

const buildDerivedFunnelSummary = (funnel = [], revenue = 0) => {
  const totalLeads = funnel.reduce((sum, stage) => sum + Number(stage.count || 0), 0);
  const convertedCount = funnel.find((stage) => stage.stage === 'converted')?.count || 0;

  return {
    totalLeads,
    convertedCount,
    conversionRate: totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0,
    totalRevenue: Number(revenue || 0)
  };
};

export const getSalesOverview = async () =>
  safeRequest({
    path: `${SALES_BASE}/overview`,
    emptyData: emptyOverview,
    extract: (payload) => {
      const ov = payload?.overview || payload || {};
      const totalOrders = ov.totalOrders || 0;
      const totalRevenue = ov.totalRevenue || 0;
      return {
        stats: {
          totalRevenue,
          monthlyRevenue: ov.monthRevenue || 0,
          openLeads: ov.openLeads ?? ov.newLeads ?? 0,
          newLeads: ov.newLeads || 0,
          convertedLeads: ov.convertedLeads || 0,
          activeCustomers: ov.activeCustomers || 0,
          planPendingCustomers: ov.planPendingCustomers || 0,
          totalLeads: ov.totalLeads || 0,
          totalCustomers: ov.totalCustomers || 0,
          totalOrders,
          paidPayments: ov.paidPayments || 0,
          pendingPayments: ov.pendingPayments || 0,
          salesAgents: ov.salesAgents || 0,
          refunds: ov.refunds || 0,
          conversionRate: Number(ov.conversionRate || 0),
          managedLeads: Number(ov.managedLeads || 0),
          contactedLeads: Number(ov.contactedLeads || 0),
          untouchedLeads: Number(ov.untouchedLeads || 0),
          followupDueToday: Number(ov.followupDueToday || 0),
          overdueFollowups: Number(ov.overdueFollowups || 0),
          upcomingFollowups: Number(ov.upcomingFollowups || 0),
          pendingPaymentValue: Number(ov.pendingPaymentValue || 0),
          refundValue: Number(ov.refundValue || 0),
          averageOrderValue: Number(ov.averageOrderValue || (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0))
        },
        monthlySales: ov.monthlySales || [],
        revenueTrend: ov.revenueTrend || [],
        workQueue: Array.isArray(ov.workQueue) ? ov.workQueue : [],
        audienceBreakdown: Array.isArray(ov.audienceBreakdown) ? ov.audienceBreakdown : [],
        paymentSummary: ov.paymentSummary || {},
        recentActivity: Array.isArray(ov.recentActivity) ? ov.recentActivity : []
      };
    }
  });

export const getSalesTeam = async () =>
  safeRequest({
    path: `${SALES_BASE}/team`,
    emptyData: [],
    extract: (payload) => (payload?.agents || []).map(mapSalesAgent)
  });

export const getProducts = async () =>
  safeRequest({
    path: `${SALES_BASE}/products`,
    emptyData: [],
    extract: (payload) => (payload?.products || []).map(mapSalesProduct)
  });

export const getRolePlans = async (audienceRole = '') =>
  safeRequest({
    path: `/pricing/role-plans${buildQueryString({ audienceRole }) ? `?${buildQueryString({ audienceRole })}` : ''}`,
    emptyData: [],
    extract: (payload) => (payload?.plans || []).map((plan) => ({
      slug: plan.slug || '',
      name: plan.name || plan.slug || 'Plan',
      audienceRole: plan.audienceRole || plan.audience_role || '',
      price: Number(plan.price || 0),
      currency: plan.currency || 'INR'
    }))
  });

export const getSalesFunnel = async () =>
  safeRequest({
    path: `${SALES_BASE}/funnel`,
    emptyData: { funnel: [], summary: { totalLeads: 0, convertedCount: 0, conversionRate: 0, totalRevenue: 0 } },
    extract: (payload) => {
      const funnel = (payload?.funnel || []).map(normalizeFunnelStage);
      const summary = payload?.summary || {};
      const derivedSummary = buildDerivedFunnelSummary(funnel, summary.totalRevenue);

      return {
        funnel,
        summary: {
          totalLeads: Number(summary.totalLeads ?? derivedSummary.totalLeads),
          convertedCount: Number(summary.convertedCount ?? derivedSummary.convertedCount),
          conversionRate: Number(summary.conversionRate ?? derivedSummary.conversionRate),
          totalRevenue: Number(summary.totalRevenue ?? derivedSummary.totalRevenue)
        }
      };
    }
  });

export const getSalesReferralCode = async () =>
  safeRequest({
    path: `${SALES_BASE}/referral-code`,
    emptyData: { salesCode: '', assignedStates: [], shareText: '' },
    extract: (payload) => payload?.referral || { salesCode: '', assignedStates: [], shareText: '' }
  });
