import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import StatusBadge from '../components/StatusBadge';
import { getSupportTickets } from '../services/reportsApi';
import { formatDateTime } from '../utils/formatDate';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await getSupportTickets();
      setTickets(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };
    load();
  }, []);

  const cards = useMemo(() => [
    { label: 'Total Tickets', value: String(tickets.length), helper: `${tickets.filter((item) => item.status === 'open').length} open`, tone: 'info' },
    { label: 'Escalated', value: String(tickets.filter((item) => item.status === 'escalated').length), helper: 'Needs cross-team attention', tone: 'danger' },
    { label: 'High Priority', value: String(tickets.filter((item) => ['high', 'critical'].includes(item.priority)).length), helper: 'Protect customer trust', tone: 'warning' },
    { label: 'Assigned', value: String(tickets.filter((item) => item.assignedTo).length), helper: 'Ownership already set', tone: 'success' }
  ], [tickets]);

  const columns = [
    { key: 'id', label: 'Ticket ID' },
    { key: 'title', label: 'Title' },
    { key: 'company', label: 'Company' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'priority', label: 'Priority', render: (value) => <StatusBadge value={value} /> },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge value={value} /> },
    { key: 'updatedAt', label: 'Updated', render: (value) => formatDateTime(value) }
  ];

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Support Tickets" subtitle="Track escalations and resolution flow." />
      {isDemo ? <p className="module-note">Demo data is shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card">
        {loading ? <p className="module-note">Loading support tickets...</p> : null}
        <DataTable columns={columns} rows={tickets} searchable pagination itemsPerPage={10} searchPlaceholder="Search tickets by ID, title, company, or assignee" />
      </section>
    </div>
  );
};

export default SupportTickets;
