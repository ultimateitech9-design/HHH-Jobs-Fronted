import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FiAlertTriangle, FiLock, FiX, FiClock } from 'react-icons/fi';
import SupportHeader from '../components/SupportHeader';
import TicketReplyBox from '../components/TicketReplyBox';
import TicketStatusBadge from '../components/TicketStatusBadge';
import { formatDateTime } from '../utils/formatDate';
import { getTicketDetails, replyToTicket, escalateTicket, addInternalNote, updateTicket } from '../services/ticketApi';

const TicketDetails = () => {
  const { ticketId: ticketIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [escalateModal, setEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [escalateError, setEscalateError] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [internalNotes, setInternalNotes] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const ticketId = ticketIdParam || searchParams.get('ticketId') || searchParams.get('id') || '';

  const slaDeadline = useMemo(() => {
    if (!ticket?.createdAt) return null;
    return new Date(new Date(ticket.createdAt).getTime() + 48 * 60 * 60 * 1000);
  }, [ticket]);

  const slaBreached = slaDeadline ? new Date() > slaDeadline : false;
  const slaHoursLeft = slaDeadline ? Math.max(0, Math.round((slaDeadline - new Date()) / (60 * 60 * 1000))) : null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getTicketDetails(ticketId);
      const data = response.data || null;
      setTicket(data);
      setAssignedTo(data?.assignedTo || '');
      if (data?.replies) {
        setInternalNotes(data.replies.filter(r => r.isInternal));
      }
      setError(response.error || '');
      setLoading(false);
    };
    load();
  }, [ticketId]);

  const handleReply = async () => {
    if (!ticket?.id || !reply.trim()) return;
    setSending(true);
    const result = await replyToTicket(ticket.id, reply);
    if (result.data) {
      setTicket((current) => (current ? { ...current, replies: [...(current.replies || []), result.data] } : current));
    }
    setReply('');
    setSending(false);
  };

  const handleEscalate = async () => {
    if (!ticket?.id) return;
    setEscalating(true);
    setEscalateError('');
    const result = await escalateTicket(ticket.id, escalateReason);
    if (result.error) {
      setEscalateError(result.error);
      setEscalating(false);
      return;
    }
    setTicket((current) => current ? { ...current, status: 'escalated', escalationReason: escalateReason } : current);
    setEscalateModal(false);
    setEscalateReason('');
    setEscalating(false);
  };

  const handleAddInternalNote = async () => {
    if (!ticket?.id || !internalNote.trim()) return;
    setAddingNote(true);
    setNoteError('');
    const result = await addInternalNote(ticket.id, internalNote);
    if (result.error) {
      setNoteError(result.error);
      setAddingNote(false);
      return;
    }
    setInternalNotes((prev) => [...prev, result.data]);
    setInternalNote('');
    setAddingNote(false);
  };

  const handleTicketUpdate = async (updates) => {
    if (!ticket?.id) return;
    setSending(true);
    setError('');
    const result = await updateTicket(ticket.id, {
      status: updates.status,
      priority: updates.priority,
      assignee_name: updates.assignedTo
    });
    if (result.error) {
      setError(result.error);
    } else {
      setTicket((current) => ({ ...(current || {}), ...result.data }));
      if (result.data?.assignedTo) setAssignedTo(result.data.assignedTo);
    }
    setSending(false);
  };

  return (
    <div className="module-page module-page--platform">
      <SupportHeader title="Ticket Details" subtitle="Review the full support conversation, status, and response history for one ticket." />

      {escalateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-primary flex items-center gap-2">
                <FiAlertTriangle className="text-amber-500" /> Escalate Ticket
              </h3>
              <button onClick={() => { setEscalateModal(false); setEscalateError(''); }} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FiX size={20} />
              </button>
            </div>
            <p className="text-sm text-neutral-500 mb-4">Explain why this ticket needs to be escalated. This note will be logged internally.</p>
            <textarea
              rows={4}
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="E.g., Customer is threatening legal action. Needs immediate management review."
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm resize-none mb-3"
            />
            {escalateError && (
              <p className="text-red-600 text-sm font-semibold mb-3">{escalateError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setEscalateModal(false); setEscalateError(''); }}
                className="flex-1 py-3 border border-neutral-200 text-neutral-600 font-bold rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={escalating}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60"
              >
                {escalating ? 'Escalating...' : 'Escalate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error ? <p className="form-error">{error}</p> : null}
      {!loading && !ticketId ? <p className="module-note">No ticket ID was provided.</p> : null}
      {loading ? <p className="module-note">Loading ticket details...</p> : null}

      {!loading && ticket ? (
        <div className="space-y-6">
          {slaDeadline && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl border font-semibold text-sm ${
              slaBreached
                ? 'bg-red-50 border-red-200 text-red-700'
                : slaHoursLeft <= 6
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <FiClock size={18} className="shrink-0" />
              {slaBreached
                ? 'SLA Breached — Response overdue. Escalate immediately.'
                : `SLA Due: ${slaDeadline.toLocaleString()} — ${slaHoursLeft}h remaining`}
            </div>
          )}

          <section className="panel-card">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <h2 className="text-xl font-extrabold text-primary">{ticket.title}</h2>
              {ticket.status !== 'escalated' && ticket.status !== 'resolved' && (
                <button
                  onClick={() => setEscalateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 text-sm"
                >
                  <FiAlertTriangle size={14} /> Escalate
                </button>
              )}
            </div>
            <div className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <button type="button" className="btn-secondary" onClick={() => handleTicketUpdate({ status: 'open' })}>Open</button>
              <button type="button" className="btn-secondary" onClick={() => handleTicketUpdate({ status: 'pending' })}>Assign Review</button>
              <button type="button" className="btn-primary" onClick={() => handleTicketUpdate({ status: 'resolved' })}>Resolve</button>
              <button type="button" className="btn-secondary" onClick={() => handleTicketUpdate({ status: 'closed' })}>Close Ticket</button>
              <label className="min-w-[220px] flex-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                Assigned User
                <input
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  placeholder="Support owner"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal"
                />
              </label>
              <button type="button" className="btn-secondary" onClick={() => handleTicketUpdate({ assignedTo })}>Save Assignee</button>
            </div>
            <div className="dash-list">
              <li><strong>Ticket ID</strong><span>{ticket.id}</span></li>
              <li><strong>Customer</strong><span>{ticket.customer}</span></li>
              <li><strong>Category</strong><span>{ticket.category}</span></li>
              <li><strong>Priority</strong><span><TicketStatusBadge value={ticket.priority} /></span></li>
              <li><strong>Status</strong><span><TicketStatusBadge value={ticket.status} /></span></li>
              <li><strong>Assigned To</strong><span>{ticket.assignedTo}</span></li>
              <li><strong>Updated</strong><span>{formatDateTime(ticket.updatedAt)}</span></li>
            </div>
            {ticket.escalationReason && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                <strong>Escalation reason:</strong> {ticket.escalationReason}
              </div>
            )}
            <p style={{ marginTop: '1rem' }}>{ticket.description}</p>
          </section>

          <section className="panel-card">
            <div className="dash-card-head">
              <div>
                <h3>Replies</h3>
                <p>Message trail between customer and support.</p>
              </div>
            </div>
            <ul className="dash-feed">
              {(ticket.replies || []).filter(item => !item.isInternal).map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.author || item.authorName}</strong>
                    <p>{item.message}</p>
                    <span>{formatDateTime(item.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-card" style={{ borderLeft: '4px solid #9333ea' }}>
            <div className="dash-card-head mb-4">
              <div className="flex items-center gap-2">
                <FiLock size={16} className="text-purple-500 shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold text-primary">Internal Notes</h3>
                  <p className="text-xs text-neutral-500">Visible to support team only. Not shown to customers.</p>
                </div>
              </div>
            </div>
            {internalNotes.length > 0 && (
              <ul className="space-y-3 mb-4">
                {internalNotes.map((note, idx) => (
                  <li key={note.id || idx} className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-purple-800">{note.authorName || note.author || 'Support'}</strong>
                      <span className="text-purple-500 text-xs">{formatDateTime(note.createdAt)}</span>
                    </div>
                    <p className="text-purple-700">{note.message}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-3">
              <textarea
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Add an internal note for the team..."
                className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm resize-none"
              />
              <button
                onClick={handleAddInternalNote}
                disabled={addingNote || !internalNote.trim()}
                className="px-5 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm shrink-0"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </section>

          <TicketReplyBox value={reply} onChange={setReply} onSubmit={handleReply} sending={sending} />
        </div>
      ) : !loading ? (
        <section className="panel-card">
          <p className="text-sm text-slate-500">No ticket details are available for the selected ticket.</p>
        </section>
      ) : null}
    </div>
  );
};

export default TicketDetails;
