import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import { getLeadDetails, updateLead } from '../services/leadApi';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const LeadDetails = () => {
  const { leadId: leadIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [followupHistory, setFollowupHistory] = useState([]);
  const [draft, setDraft] = useState({
    stage: 'new',
    onboardingStatus: 'prospect',
    nextFollowupAt: '',
    followupNotes: '',
    planInterestSlug: ''
  });
  const leadId = leadIdParam || searchParams.get('leadId') || searchParams.get('id') || '';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getLeadDetails(leadId);
      setLead(response.data || null);
      setDraft({
        stage: response.data?.stage || 'new',
        onboardingStatus: response.data?.onboardingStatus || 'prospect',
        nextFollowupAt: response.data?.nextFollowupAt ? String(response.data.nextFollowupAt).slice(0, 16) : '',
        followupNotes: response.data?.followupNotes || '',
        planInterestSlug: response.data?.planInterestSlug || ''
      });
      setFollowupHistory(response.data?.followupNotes ? [{
        id: `${response.data.id || 'lead'}-saved`,
        note: response.data.followupNotes,
        nextFollowupAt: response.data.nextFollowupAt,
        savedAt: response.data.lastFollowupAt || response.data.updatedAt || response.data.createdAt
      }] : []);
      setError(response.error || '');
      setLoading(false);
    };
    load();
  }, [leadId]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!lead?.id) return;

    setSaving(true);
    setError('');
    setMessage('');
    const savedAt = new Date().toISOString();
    try {
      const updated = await updateLead(lead.id, {
        status: draft.stage,
        onboarding_status: draft.onboardingStatus,
        next_followup_at: draft.nextFollowupAt ? new Date(draft.nextFollowupAt).toISOString() : null,
        last_followup_at: savedAt,
        followup_notes: draft.followupNotes,
        plan_interest_slug: draft.planInterestSlug
      });
      setLead(updated);
      setFollowupHistory((current) => [{
        id: `${lead.id}-${Date.now()}`,
        note: draft.followupNotes,
        nextFollowupAt: draft.nextFollowupAt,
        savedAt
      }, ...current]);
      setMessage('Follow-up saved successfully.');
    } catch (updateError) {
      setError(String(updateError.message || 'Unable to update lead.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page module-page--platform">
      <SectionHeader eyebrow="Sales" title="Lead Details" subtitle="Inspect lead ownership, source, expected deal value, and commercial stage." />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="module-note">{message}</p> : null}
      {!loading && !leadId ? (
        <p className="module-note">No lead ID was provided. Showing the first available lead from the queue.</p>
      ) : null}
      {loading ? <p className="module-note">Loading lead details...</p> : null}
      {!loading && lead ? (
        <section className="panel-card space-y-6">
          <div className="dash-list">
            <li><strong>Lead ID</strong><span>{lead.id}</span></li>
            <li><strong>Company</strong><span>{lead.company}</span></li>
            <li><strong>Contact</strong><span>{lead.contactName}</span></li>
            <li><strong>Email</strong><span>{lead.email}</span></li>
            <li><strong>Phone</strong><span>{lead.phone}</span></li>
            <li><strong>Audience</strong><span>{lead.targetRole || '-'}</span></li>
            <li><strong>Source</strong><span>{lead.source}</span></li>
            <li><strong>Owner</strong><span>{lead.assignedTo}</span></li>
            <li><strong>Expected Value</strong><span>{formatCurrency(lead.expectedValue)}</span></li>
            <li><strong>Stage</strong><span><StatusPill value={lead.stage} /></span></li>
            <li><strong>Onboarding</strong><span><StatusPill value={lead.onboardingStatus} /></span></li>
            <li><strong>Plan Interest</strong><span>{lead.planInterestSlug || '-'}</span></li>
            <li><strong>Coupon</strong><span>{lead.couponCode || '-'}</span></li>
            <li><strong>Next Follow-up</strong><span>{formatDateTime(lead.nextFollowupAt)}</span></li>
            <li><strong>Created</strong><span>{formatDateTime(lead.createdAt)}</span></li>
          </div>

          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-600">Stage</span>
              <select value={draft.stage} onChange={(event) => setDraft((current) => ({ ...current, stage: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-600">Onboarding</span>
              <select value={draft.onboardingStatus} onChange={(event) => setDraft((current) => ({ ...current, onboardingStatus: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="prospect">Prospect</option>
                <option value="negotiation">Negotiation</option>
                <option value="onboarding">Onboarding</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-600">Next Follow-up</span>
              <input type="datetime-local" value={draft.nextFollowupAt} onChange={(event) => setDraft((current) => ({ ...current, nextFollowupAt: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-600">Plan Interest</span>
              <input value={draft.planInterestSlug} onChange={(event) => setDraft((current) => ({ ...current, planInterestSlug: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-semibold text-slate-600">Follow-up Notes</span>
              <textarea rows={4} value={draft.followupNotes} onChange={(event) => setDraft((current) => ({ ...current, followupNotes: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={saving} className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Follow-up'}
              </button>
            </div>
          </form>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-extrabold text-slate-900">Follow-up History</h3>
            {followupHistory.length ? (
              <ul className="mt-3 space-y-2">
                {followupHistory.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <div className="font-bold text-slate-800">{item.note || 'Follow-up saved without notes.'}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      Saved {formatDateTime(item.savedAt)} | Next {formatDateTime(item.nextFollowupAt)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No follow-up updates saved yet.</p>
            )}
          </div>
        </section>
      ) : !loading ? (
        <section className="panel-card">
          <p className="text-sm text-slate-500">No lead details are available for the selected lead.</p>
        </section>
      ) : null}
    </div>
  );
};

export default LeadDetails;
