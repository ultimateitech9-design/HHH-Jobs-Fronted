export const normalizeTicket = (ticket = {}) => ({
  id: ticket.id || '',
  ticketNumber: ticket.ticket_number || ticket.ticketNumber || '',
  title: ticket.title || '',
  customer: ticket.customer || ticket.user || ticket.requester_name || '',
  customerEmail: ticket.customerEmail || ticket.requester_email || '',
  category: ticket.category || 'technical',
  priority: ticket.priority || 'medium',
  status: ticket.status || 'open',
  assignedTo: ticket.assignedTo || ticket.assignee_name || 'Unassigned',
  description: ticket.description || '',
  escalationReason: ticket.escalationReason || ticket.escalation_reason || '',
  replies: Array.isArray(ticket.replies)
    ? ticket.replies.map((reply) => ({
      id: reply.id || '',
      author: reply.author || reply.author_name || '',
      authorName: reply.authorName || reply.author_name || '',
      role: reply.role || reply.author_role || '',
      message: reply.message || '',
      isInternal: Boolean(reply.isInternal ?? reply.is_internal),
      createdAt: reply.createdAt || reply.created_at || ''
    }))
    : [],
  createdAt: ticket.createdAt || ticket.created_at || '',
  updatedAt: ticket.updatedAt || ticket.updated_at || ''
});

export const filterTickets = (tickets = [], filters = {}) => {
  const search = String(filters.search || '').trim().toLowerCase();
  const status = String(filters.status || '').trim().toLowerCase();
  const priority = String(filters.priority || '').trim().toLowerCase();
  const category = String(filters.category || '').trim().toLowerCase();

  return tickets.filter((ticket) => {
    const matchesSearch = !search || `${ticket.id} ${ticket.title} ${ticket.customer} ${ticket.assignedTo}`.toLowerCase().includes(search);
    const matchesStatus = !status || String(ticket.status || '').toLowerCase() === status;
    const matchesPriority = !priority || String(ticket.priority || '').toLowerCase() === priority;
    const matchesCategory = !category || String(ticket.category || '').toLowerCase() === category;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });
};
