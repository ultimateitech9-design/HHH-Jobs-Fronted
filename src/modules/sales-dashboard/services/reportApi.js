import { SALES_BASE, safeRequest } from './salesApi';

const emptyReports = {
  summary: {
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    totalOrders: 0,
    paidOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0
  },
  topSources: [],
  conversion: [],
  monthlyRevenue: []
};

export const getSalesReports = async () =>
  safeRequest({
    path: `${SALES_BASE}/reports`,
    emptyData: emptyReports,
    extract: (payload) => {
      const reports = payload?.reports || payload || {};
      return {
        summary: {
          totalLeads: Number(reports.totalLeads || 0),
          convertedLeads: Number(reports.convertedLeads || 0),
          conversionRate: Number(reports.conversionRate || 0),
          totalOrders: Number(reports.totalOrders || 0),
          paidOrders: Number(reports.paidOrders || 0),
          totalCustomers: Number(reports.totalCustomers || 0),
          totalRevenue: Number(reports.totalRevenue || 0)
        },
        topSources: reports.topSources || [],
        conversion: reports.conversion || [],
        monthlyRevenue: reports.monthlyRevenue || []
      };
    }
  });
