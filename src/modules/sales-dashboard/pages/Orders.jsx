import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import ExportButtons from '../components/ExportButtons';
import FilterBar from '../components/FilterBar';
import OrderTable from '../components/OrderTable';
import SalesStatCards from '../components/SalesStatCards';
import { getOrders } from '../services/orderApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await getOrders();
      setOrders(response.data || []);
      setError(response.error || '');
      setLoading(false);
    };
    load();
  }, []);

  const rows = useMemo(() => {
    const search = String(filters.search || '').toLowerCase();
    return orders.filter((item) => {
      const matchesStatus = !filters.status || String(item.status || '').toLowerCase() === filters.status;
      const matchesSearch = !search || `${item.id} ${item.customer} ${item.product}`.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [orders, filters]);

  const cards = useMemo(() => [
    { label: 'Visible Orders', value: String(rows.length), helper: 'Current filtered orders', tone: 'info' },
    { label: 'Paid Orders', value: String(rows.filter((item) => item.paymentStatus === 'paid').length), helper: 'Collections received', tone: 'success' },
    { label: 'Pending Payment', value: String(rows.filter((item) => item.paymentStatus === 'pending').length), helper: 'Awaiting collection', tone: 'warning' },
    { label: 'Visible Revenue', value: formatCompactCurrency(rows.reduce((sum, item) => sum + Number(item.amount || 0), 0)), helper: 'Current filtered order value', tone: 'default' }
  ], [rows]);

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Sales"
        title="Orders"
        subtitle="Review sales orders, payment progress, assigned agents, and booked commercial value."
        action={<ExportButtons onExportCsv={() => {}} onExportPdf={() => {}} />}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <SalesStatCards cards={cards} />
      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Order registry</h2>
            <p className="admin-ops-panel-note">Track payment progress, customer demand, and booked revenue from one list.</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <FilterBar
            filters={[
              { key: 'status', label: 'Status', type: 'select', options: [{ value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' }, { value: 'cancelled', label: 'Cancelled' }] },
              { key: 'search', label: 'Search', type: 'text', placeholder: 'Order ID, customer, product', fullWidth: true }
            ]}
            values={filters}
            onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          />
          {loading ? <p className="module-note">Loading orders...</p> : null}
          <OrderTable rows={rows} />
        </div>
      </section>
    </div>
  );
};

export default Orders;
