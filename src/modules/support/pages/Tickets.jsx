import SupportHeader from '../components/SupportHeader';
import TicketFilterBar from '../components/TicketFilterBar';
import TicketTable from '../components/TicketTable';
import SupportStatsCards from '../components/SupportStatsCards';
import useTickets from '../hooks/useTickets';

const Tickets = () => {
  const { filteredTickets, filters, setFilters, loading, error, isDemo } = useTickets();

  const cards = [
    { label: 'Visible Tickets', value: String(filteredTickets.length), helper: 'Current filtered support queue', tone: 'info' },
    { label: 'Open', value: String(filteredTickets.filter((ticket) => ticket.status === 'open').length), helper: 'Needs first response', tone: 'warning' },
    { label: 'Resolved', value: String(filteredTickets.filter((ticket) => ticket.status === 'resolved').length), helper: 'Completed cases', tone: 'success' },
    { label: 'Escalated', value: String(filteredTickets.filter((ticket) => ticket.status === 'escalated').length), helper: 'Urgent cases', tone: 'danger' }
  ];

  return (
    <div className="module-page module-page--platform">
      <SupportHeader title="Tickets" subtitle="Review all support tickets by priority, status, category, and ownership." />
      {isDemo ? <p className="module-note">Demo support ticket data is displayed.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <SupportStatsCards cards={cards} />
      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Support queue workspace</h2>
            <p className="admin-ops-panel-note">Triage tickets quickly by status, priority, category, and ownership.</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <TicketFilterBar filters={filters} onChange={(field, value) => setFilters((current) => ({ ...current, [field]: value }))} />
          {loading ? <p className="module-note">Loading tickets...</p> : null}
          <TicketTable rows={filteredTickets} />
        </div>
      </section>
    </div>
  );
};

export default Tickets;
