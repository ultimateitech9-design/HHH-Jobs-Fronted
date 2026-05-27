import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClock, FiHelpCircle, FiMessageSquare, FiSend } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { getMyHelpSupportQueries, submitHelpSupportQuery } from '../services/helpSupportApi';

const roleCopy = {
  student: {
    eyebrow: 'Student Support',
    title: 'Help & Support',
    subtitle: 'Send profile, application, job, ATS, payment, or technical queries to the support team.',
    audience: 'Student'
  },
  retired_employee: {
    eyebrow: 'Retired Professional Support',
    title: 'Help & Support',
    subtitle: 'Send profile, opportunity, application, or technical issues to the support team.',
    audience: 'Retired Professional'
  },
  hr: {
    eyebrow: 'HR Support',
    title: 'Help & Support',
    subtitle: 'Raise hiring, job posting, candidate, package, billing, or campus workflow issues.',
    audience: 'HR'
  },
  campus_connect: {
    eyebrow: 'Campus Support',
    title: 'Help & Support',
    subtitle: 'Raise student upload, drive, company connection, billing, or placement workflow issues.',
    audience: 'Campus'
  }
};

const issueTypes = [
  { value: 'general', label: 'General support' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'profile_data', label: 'Profile / data correction' },
  { value: 'application', label: 'Application / candidate issue' },
  { value: 'onboarding', label: 'Onboarding / data entry' },
  { value: 'sales', label: 'Package / sales' },
  { value: 'billing', label: 'Billing / invoice' }
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const normalizeRoleFromPath = (pathname = '') => {
  if (pathname.includes('/portal/hr')) return 'hr';
  if (pathname.includes('/portal/campus-connect')) return 'campus_connect';
  return getCurrentUser()?.role || 'student';
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const HelpSupportPage = () => {
  const location = useLocation();
  const currentUser = getCurrentUser();
  const portalRole = normalizeRoleFromPath(location.pathname);
  const copy = roleCopy[portalRole] || roleCopy.student;
  const [form, setForm] = useState({
    title: '',
    category: 'general',
    priority: 'medium',
    state: '',
    company: currentUser?.companyName || currentUser?.company_name || '',
    description: ''
  });
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const latestTickets = useMemo(() => tickets.slice(0, 5), [tickets]);

  useEffect(() => {
    let mounted = true;

    getMyHelpSupportQueries()
      .then((rows) => {
        if (!mounted) return;
        setTickets(rows);
      })
      .catch((queryError) => {
        if (!mounted) return;
        setError(queryError.message || 'Unable to load recent support queries.');
      })
      .finally(() => {
        if (mounted) setLoadingTickets(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!form.title.trim()) {
      setError('Subject is required.');
      return;
    }

    if (!form.description.trim()) {
      setError('Message is required.');
      return;
    }

    setSaving(true);
    try {
      const ticket = await submitHelpSupportQuery({
        ...form,
        customerRole: portalRole,
        name: currentUser?.name || '',
        company: form.company,
        state: form.state
      });
      setTickets((current) => [ticket, ...current].filter(Boolean));
      setForm((current) => ({
        ...current,
        title: '',
        category: 'general',
        priority: 'medium',
        description: ''
      }));
      setMessage(`Query submitted to Support${ticket?.ticket_number ? ` (${ticket.ticket_number})` : ''}.`);
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit support query.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page module-page--platform">
      <section className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">{copy.eyebrow}</p>
            <h1 className="mt-1 font-heading text-2xl font-black text-navy">{copy.title}</h1>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{copy.subtitle}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand-700">
            <FiHelpCircle size={14} />
            {copy.audience}
          </span>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="admin-ops-panel">
          <div className="admin-ops-panel-header">
            <div>
              <h2 className="admin-ops-panel-title">Raise a Support Query</h2>
              <p className="admin-ops-panel-note">Your query goes to the Support desk first. They can transfer it to Admin, Data Entry, Sales, Accounts, or another specialist queue.</p>
            </div>
          </div>
          <form className="grid gap-3 px-4 pb-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">
              Subject
              <input
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Short title for your issue"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold normal-case tracking-normal"
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Issue Type
              <select
                value={form.category}
                onChange={(event) => updateField('category', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold normal-case tracking-normal"
              >
                {issueTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Priority
              <select
                value={form.priority}
                onChange={(event) => updateField('priority', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold normal-case tracking-normal"
              >
                {priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              State / Location
              <input
                value={form.state}
                onChange={(event) => updateField('state', event.target.value)}
                placeholder="Example: Delhi"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold normal-case tracking-normal"
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Company / Campus
              <input
                value={form.company}
                onChange={(event) => updateField('company', event.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold normal-case tracking-normal"
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">
              Message
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Explain the issue clearly. Add ID, job name, invoice, campus drive, or profile details if relevant."
                rows={6}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold normal-case tracking-normal"
              />
            </label>
            <button type="submit" className="btn-primary sm:w-fit" disabled={saving}>
              <FiSend size={15} />
              {saving ? 'Submitting...' : 'Submit Query'}
            </button>
          </form>
        </section>

        <section className="admin-ops-panel">
          <div className="admin-ops-panel-header">
            <div>
              <h2 className="admin-ops-panel-title">Recent Queries</h2>
              <p className="admin-ops-panel-note">Track the latest support requests submitted from this account.</p>
            </div>
          </div>
          <div className="space-y-3 px-4 pb-4">
            {loadingTickets ? <p className="module-note">Loading support queries...</p> : null}
            {!loadingTickets && latestTickets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                No support queries submitted yet.
              </div>
            ) : null}
            {latestTickets.map((ticket) => (
              <article key={ticket.id || ticket.ticket_number} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-navy">{ticket.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {ticket.ticket_number || ticket.id} · {ticket.category || 'general'}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase text-slate-600">
                    {ticket.status || 'open'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1"><FiMessageSquare size={13} /> {ticket.assigned_department || 'support'}</span>
                  <span className="inline-flex items-center gap-1"><FiClock size={13} /> {formatDateTime(ticket.updated_at || ticket.created_at)}</span>
                  {String(ticket.status || '').toLowerCase() === 'resolved' ? <span className="inline-flex items-center gap-1 text-emerald-700"><FiCheckCircle size={13} /> Resolved</span> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpSupportPage;
