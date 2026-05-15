import { apiFetch, areDemoFallbacksEnabled } from '../../../utils/api';
import { salesDummyData } from '../data/salesDummyData';
import { mapSalesAgent, mapSalesProduct } from './mappers';

export const SALES_BASE = '/sales';

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

export const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

export const safeRequest = async ({ path, options, emptyData, fallbackData, extract = (payload) => payload }) => {
  try {
    const data = await strictRequest({ path, options, extract });
    return { data, error: '', isDemo: false };
  } catch (error) {
    const resolvedFallback = areDemoFallbacksEnabled()
      ? (typeof fallbackData === 'function' ? fallbackData() : fallbackData)
      : undefined;
    return {
      data: clone(resolvedFallback !== undefined ? resolvedFallback : emptyData),
      error: error.message || 'Request failed.',
      isDemo: resolvedFallback !== undefined
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
    openLeads: 0,
    convertedLeads: 0,
    activeCustomers: 0,
    totalLeads: 0,
    totalCustomers: 0,
    salesAgents: 0,
    refunds: 0,
    averageOrderValue: 0
  },
  monthlySales: [],
  revenueTrend: []
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

const buildFunnelSummary = (funnel = [], fallbackRevenue = 0) => {
  const totalLeads = funnel.reduce((sum, stage) => sum + Number(stage.count || 0), 0);
  const convertedCount = funnel.find((stage) => stage.stage === 'converted')?.count || 0;

  return {
    totalLeads,
    convertedCount,
    conversionRate: totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0,
    totalRevenue: Number(fallbackRevenue || 0)
  };
};

export const getSalesOverview = async () =>
  safeRequest({
    path: `${SALES_BASE}/overview`,
    emptyData: emptyOverview,
    fallbackData: salesDummyData.overview,
    extract: (payload) => {
      const ov = payload?.overview || payload || {};
      const totalOrders = ov.totalOrders || 0;
      const totalRevenue = ov.totalRevenue || 0;
      return {
        stats: {
          totalRevenue,
          monthlyRevenue: ov.monthRevenue || 0,
          openLeads: ov.newLeads || 0,
          convertedLeads: ov.convertedLeads || 0,
          activeCustomers: ov.activeCustomers || 0,
          totalLeads: ov.totalLeads || 0,
          totalCustomers: ov.totalCustomers || 0,
          totalOrders,
          salesAgents: ov.salesAgents || 0,
          refunds: ov.refunds || 0,
          averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
        },
        monthlySales: ov.monthlySales || [],
        revenueTrend: ov.revenueTrend || []
      };
    }
  });

export const getSalesTeam = async () =>
  safeRequest({
    path: `${SALES_BASE}/team`,
    emptyData: [],
    fallbackData: salesDummyData.agents,
    extract: (payload) => (payload?.agents || []).map(mapSalesAgent)
  });

export const getProducts = async () =>
  safeRequest({
    path: `${SALES_BASE}/products`,
    emptyData: [],
    fallbackData: salesDummyData.products,
    extract: (payload) => (payload?.products || []).map(mapSalesProduct)
  });

export const getSalesFunnel = async () =>
  safeRequest({
    path: `${SALES_BASE}/funnel`,
    emptyData: { funnel: [], summary: { totalLeads: 0, convertedCount: 0, conversionRate: 0, totalRevenue: 0 } },
    fallbackData: () => {
      const funnel = (salesDummyData.reports?.conversion || []).map(normalizeFunnelStage);
      return {
        funnel,
        summary: buildFunnelSummary(funnel, salesDummyData.overview?.stats?.totalRevenue || 0)
      };
    },
    extract: (payload) => {
      const funnel = (payload?.funnel || []).map(normalizeFunnelStage);
      const summary = payload?.summary || {};
      const fallbackSummary = buildFunnelSummary(funnel, summary.totalRevenue);

      return {
        funnel,
        summary: {
          totalLeads: Number(summary.totalLeads ?? fallbackSummary.totalLeads),
          convertedCount: Number(summary.convertedCount ?? fallbackSummary.convertedCount),
          conversionRate: Number(summary.conversionRate ?? fallbackSummary.conversionRate),
          totalRevenue: Number(summary.totalRevenue ?? fallbackSummary.totalRevenue)
        }
      };
    }
  });
