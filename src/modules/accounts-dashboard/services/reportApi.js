import { ACCOUNTS_BASE, safeRequest } from './accountsApi';

const buildCategoryPerformance = (summary = {}) => ([
  {
    label: 'Total Revenue',
    value: Number(summary.totalRevenue || 0),
    status: 'healthy'
  },
  {
    label: 'Total Expenses',
    value: Number(summary.totalExpenses || 0),
    status: Number(summary.totalExpenses || 0) > 0 ? 'warning' : 'default'
  },
  {
    label: 'Net Profit',
    value: Number(summary.netProfit || 0),
    status: Number(summary.netProfit || 0) >= 0 ? 'healthy' : 'warning'
  }
]);

export const getRevenueReports = async () =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/reports/revenue`,
    emptyData: {
      summary: {},
      revenue: [],
      categoryPerformance: []
    },
    extract: (payload) => {
      const summary = payload?.revenue || {};
      const monthlyPoints = Array.isArray(summary.monthly)
        ? summary.monthly.map((item) => ({
            month: item.month,
            revenue: Number(item.revenue || 0),
            expenses: 0,
            refunds: 0
          }))
        : [];

      return {
        summary,
        revenue: monthlyPoints,
        categoryPerformance: Array.isArray(payload?.categoryPerformance) && payload.categoryPerformance.length
          ? payload.categoryPerformance
          : buildCategoryPerformance(summary)
      };
    }
  });
