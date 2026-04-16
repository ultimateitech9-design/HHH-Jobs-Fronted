import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import { formatDateTime, getPlatformSupportTickets, updatePlatformSupportTicket } from '../services/platformApi';

const initialFilters = {
  status: 'all',
  priority: 'all',
  search: ''
};

const PlatformSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    const response = await getPlatformSupportTickets();
    setTickets(response.data || []);
    setIsDemo(response.isDemo);
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const search = String(filters.search || '').toLowerCase().trim();
    return tickets.filter((ticket) => {
      const matchStatus = filters.status === 'all' || ticket.status === filters.status;
      const matchPriority = filters.priority === 'all' || ticket.priority === filters.priority;
      const matchSearch =
        !search || `${ticket.title || ''} ${ticket.tenantName || ''} ${ticket.owner || ''}`.toLowerCase().includes(search);
      return matchStatus && matchPriority && matchSearch;
    });
  }, [tickets, filters]);

  const updateTicket = async (ticketId, payload) => {
    setError('');
    setMessage('');
    try {
      const updated = await updatePlatformSupportTicket(ticketId, payload);
      setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setMessage(`Ticket ${ticketId} updated.`);
    } catch (actionError) {
      setError(actionError.message || 'Unable to update ticket.');
    }
  };

  const columns = [
    { key: 'id', label: 'Ticket ID' },
    { key: 'tenantName', label: 'Tenant' },
    { key: 'title', label: 'Issue' },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => <StatusPill value={value || 'low'} />
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'open'} />
    },
    { key: 'owner', label: 'Owner' },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="student-job-actions">
          <button type="button" className="btn-link" onClick={() => updateTicket(row.id, { status: 'open' })}>Open</button>
          <button type="button" className="btn-link" onClick={() => updateTicket(row.id, { status: 'in_review' })}>Review</button>
          <button type="button" className="btn-link" onClick={() => updateTicket(row.id, { status: 'resolved' })}>Resolve</button>
          <button type="button" className="btn-link" onClick={() => updateTicket(row.id, { status: 'escalated' })}>Escalate</button>
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              const owner = window.prompt('Assign owner', row.owner || '');
              if (owner !== null) {
                updateTicket(row.id, { owner });
              }
            }}
          >
            Reassign
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Support"
        title="Priority Ticketing Operations"
        subtitle="Manage issue lifecycle, escalations, and ownership for tenant support workloads."
      />

      {isDemo ? <p className="module-note">Showing fallback support data because the live backend is unavailable right now.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <section className="panel-card">
        <div className="student-inline-controls">
          <label>
            Status
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
          </label>

          <label>
            Priority
            <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label className="full-width-control">
            Search
            <input
              value={filters.search}
              placeholder="Issue, tenant, owner"
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </label>
        </div>

        {loading ? <p className="module-note">Loading tickets...</p> : null}
        <DataTable columns={columns} rows={filteredTickets} />
      </section>
    </div>
  );
};

export default PlatformSupportPage;
