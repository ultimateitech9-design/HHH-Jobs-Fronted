import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import RevenueCards from '../components/RevenueCards';
import RevenueChart from '../components/RevenueChart';
import { getRevenueReports } from '../services/reportApi';
import { formatCurrency } from '../utils/currencyFormat';

const Reports = () => {
  const [report, setReport] = useState({ revenue: [], categoryPerformance: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await getRevenueReports();
      setReport(response.data || { revenue: [], categoryPerformance: [] });
      setError(response.error || '');
      setLoading(false);
    };

    load();
  }, []);

  const cards = useMemo(() => {
    const summary = report.summary || {};
    const totalRevenue = summary.totalRevenue ?? (report.revenue || []).reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    const totalExpenses = summary.totalExpenses ?? (report.revenue || []).reduce((sum, item) => sum + Number(item.expenses || 0), 0);
    const totalRefunds = summary.totalRefunds ?? (report.revenue || []).reduce((sum, item) => sum + Number(item.refunds || 0), 0);

    return [
      { label: 'Reported Revenue', value: formatCurrency(totalRevenue), helper: 'Period total', tone: 'success' },
      { label: 'Reported Expenses', value: formatCurrency(totalExpenses), helper: 'Period total', tone: 'warning' },
      { label: 'Reported Refunds', value: formatCurrency(totalRefunds), helper: 'Period total', tone: 'danger' },
      { label: 'Net Contribution', value: formatCurrency(totalRevenue - totalExpenses - totalRefunds), helper: 'Revenue less spend and reversals', tone: 'info' }
    ];
  }, [report]);

  const columns = [
    { key: 'label', label: 'Metric' },
    {
      key: 'value',
      label: 'Value',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      label: 'Health',
      render: (value) => <StatusPill value={value || 'healthy'} />
    }
  ];

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Accounts"
        title="Reports"
        subtitle="Financial reporting view for revenue trends, cost pressure, and business-line performance."
      />

      {error ? <p className="form-error">{error}</p> : null}
      <RevenueCards cards={cards} />

      <div className="split-grid">
        <RevenueChart points={report.revenue || []} />

        <section className="admin-ops-panel">
          <div className="admin-ops-panel-header">
            <div>
              <h2 className="admin-ops-panel-title">Category performance</h2>
              <p className="admin-ops-panel-note">Compare business-line contribution and operational health across revenue categories.</p>
            </div>
          </div>
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            {loading ? <p className="module-note">Loading reports...</p> : null}
            <DataTable columns={columns} rows={report.categoryPerformance || []} searchable pagination itemsPerPage={6} searchPlaceholder="Search metric, value, or health" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reports;
