import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import RevenueChart from '../components/RevenueChart';
import SalesChart from '../components/SalesChart';
import SalesStatCards from '../components/SalesStatCards';
import { getSalesReports } from '../services/reportApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const Reports = () => {
  const [report, setReport] = useState({ summary: {}, topSources: [], conversion: [], monthlyRevenue: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await getSalesReports();
      setReport(response.data || { summary: {}, topSources: [], conversion: [], monthlyRevenue: [] });
      setError(response.error || '');
      setLoading(false);
    };
    load();
  }, []);

  const cards = useMemo(() => [
    { label: 'Lead Sources', value: String((report.topSources || []).length), helper: 'Lead acquisition channels', tone: 'info' },
    { label: 'Total Leads', value: String(report.summary?.totalLeads || 0), helper: 'Visible lead volume', tone: 'success' },
    { label: 'Paid Orders', value: String(report.summary?.paidOrders || 0), helper: 'Collected sales orders', tone: 'default' },
    { label: 'Revenue', value: formatCompactCurrency(report.summary?.totalRevenue || 0), helper: 'Visible collected revenue', tone: 'warning' }
  ], [report]);

  const sourceColumns = [
    { key: 'label', label: 'Source' },
    { key: 'value', label: 'Volume' },
    {
      key: 'status',
      label: 'Health',
      render: (value) => <StatusPill value={value || 'healthy'} />
    }
  ];
  const performanceColumns = [
    { key: 'label', label: 'Zone / Owner' },
    { key: 'leads', label: 'Leads' },
    { key: 'converted', label: 'Converted' },
    { key: 'revenue', label: 'Revenue', render: (value) => formatCompactCurrency(value) }
  ];

  return (
    <div className="module-page module-page--platform">
      <SectionHeader eyebrow="Sales" title="Reports" subtitle="Review source performance, conversion stages, and monthly revenue direction." />
      {error ? <p className="form-error">{error}</p> : null}
      <SalesStatCards cards={cards} />
      <div className="split-grid">
        <SalesChart points={(report.conversion || []).map((item) => ({ month: item.label || item.stage, value: item.count }))} />
        <RevenueChart points={report.monthlyRevenue || []} />
      </div>
      <section className="panel-card">
        {loading ? <p className="module-note">Loading reports...</p> : null}
        <DataTable columns={sourceColumns} rows={report.topSources || []} />
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel-card">
          <h2 className="admin-ops-panel-title">Zone performance</h2>
          <DataTable columns={performanceColumns} rows={report.zonePerformance || []} />
        </section>
        <section className="panel-card">
          <h2 className="admin-ops-panel-title">Sales owner performance</h2>
          <DataTable columns={performanceColumns} rows={report.ownerPerformance || []} />
        </section>
      </div>
    </div>
  );
};

export default Reports;
