import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SupportHeader from '../components/SupportHeader';
import { SUPPORT_CATEGORIES } from '../constants/supportCategories';
import { TICKET_PRIORITY } from '../constants/ticketPriority';
import { createTicket } from '../services/ticketApi';
import { getTicketDisplayId } from '../utils/ticketHelpers';

const initialDraft = {
  title: '',
  customer: '',
  category: 'technical',
  priority: 'medium',
  assignedTo: 'Support Desk',
  description: ''
};

const CreateTicket = () => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.title || !draft.customer || !draft.description) {
      setError('Title, customer, and description are required.');
      return;
    }
    setSaving(true);
    setError('');
    const response = await createTicket(draft);
    if (response.error) {
      setError(response.error);
    } else {
      const saved = response.data;
      const displayId = getTicketDisplayId(saved);
      if (saved?.id) {
        navigate(`/portal/support/ticket-details/${encodeURIComponent(saved.id)}`, {
          replace: true,
          state: {
            successMessage: `Ticket ${displayId || saved.id} created successfully.`
          }
        });
        return;
      }
      setMessage(`Ticket ${displayId || saved?.id || ''} created successfully.`);
      setDraft(initialDraft);
    }
    setSaving(false);
  };

  return (
    <div className="module-page module-page--platform">
      <SupportHeader title="Create Ticket" subtitle="Register a new support case with category, priority, assignment, and issue details." />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      <section className="panel-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Title
            <input value={draft.title} onChange={(event) => setField('title', event.target.value)} />
          </label>
          <label>
            Customer
            <input value={draft.customer} onChange={(event) => setField('customer', event.target.value)} />
          </label>
          <label>
            Category
            <select value={draft.category} onChange={(event) => setField('category', event.target.value)}>
              {SUPPORT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Priority
            <select value={draft.priority} onChange={(event) => setField('priority', event.target.value)}>
              {TICKET_PRIORITY.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Assigned To
            <input value={draft.assignedTo} onChange={(event) => setField('assignedTo', event.target.value)} />
          </label>
          <label className="full-row">
            Description
            <textarea rows="6" value={draft.description} onChange={(event) => setField('description', event.target.value)} />
          </label>
          <div className="student-job-actions full-row">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Ticket'}</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CreateTicket;
