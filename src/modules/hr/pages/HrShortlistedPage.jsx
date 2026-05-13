import { useEffect, useState } from 'react';
import {
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiLock,
  FiRefreshCw,
  FiSend,
  FiStar,
  FiTrash2,
  FiUser,
  FiX
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
  getHrShortlisted,
  removeFromShortlist,
  sendCandidateInterest,
  updateShortlistEntry
} from '../services/hrApi';

const cardClass = 'rounded-lg border border-slate-200 bg-white p-2 shadow-sm';

export default function HrShortlistedPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [access, setAccess] = useState({ hasPaidAccess: false, requiresUpgrade: true, activePlanName: 'Free' });
  const [summary, setSummary] = useState({ total: 0, connected: 0 });
  const [entries, setEntries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [actionState, setActionState] = useState({});

  const load = async () => {
    setLoading(true);
    const response = await getHrShortlisted();
    setAccess(response.data?.access || { hasPaidAccess: false, requiresUpgrade: true, activePlanName: 'Free' });
    setSummary(response.data?.summary || { total: 0, connected: 0 });
    setEntries(response.data?.shortlisted || []);
    setError(response.error || '');
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (entry) => {
    setEditing(entry);
    setEditTags((entry.tags || []).join(', '));
    setEditNotes(entry.notes || '');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setActionState((current) => ({ ...current, edit: 'saving' }));
    try {
      const tags = editTags.split(',').map((item) => item.trim()).filter(Boolean);
      await updateShortlistEntry(editing.student_user_id, { tags, notes: editNotes });
      setEntries((current) =>
        current.map((entry) =>
          entry.student_user_id === editing.student_user_id
            ? { ...entry, tags, notes: editNotes, candidate: { ...entry.candidate, crm: { ...entry.candidate.crm, tags, notes: editNotes } } }
            : entry
        )
      );
      setEditing(null);
    } catch (saveError) {
      setError(saveError.message || 'Unable to update shortlist entry.');
    } finally {
      setActionState((current) => ({ ...current, edit: '' }));
    }
  };

  const removeEntry = async (studentId) => {
    setActionState((current) => ({ ...current, [`remove_${studentId}`]: 'removing' }));
    try {
      await removeFromShortlist(studentId);
      setEntries((current) => current.filter((entry) => entry.student_user_id !== studentId));
    } catch (removeError) {
      setError(removeError.message || 'Unable to remove shortlist entry.');
    } finally {
      setActionState((current) => ({ ...current, [`remove_${studentId}`]: '' }));
    }
  };

  const sendInterest = async (entry) => {
    setActionState((current) => ({ ...current, [`interest_${entry.student_user_id}`]: 'sending' }));
    try {
      await sendCandidateInterest(entry.student_user_id, { campaignLabel: 'shortlist_follow_up' });
      setEntries((current) =>
        current.map((item) =>
          item.student_user_id === entry.student_user_id
            ? { ...item, candidate: { ...item.candidate, crm: { ...item.candidate.crm, interestStatus: 'pending' } } }
            : item
        )
      );
    } catch (interestError) {
      setError(interestError.message || 'Unable to send interest.');
    } finally {
      setActionState((current) => ({ ...current, [`interest_${entry.student_user_id}`]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <FiRefreshCw size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-4 pb-8">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-base font-bold tracking-tight text-navy md:text-lg">
            <FiStar size={16} className="text-amber-500" />
            Shortlisted Candidates
          </h1>
          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">Your recruiter CRM for saved candidates, tags, notes, and follow-ups.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Connected candidates</p>
          <p className="mt-0.5 text-base font-bold tabular-nums text-navy">{summary.connected}</p>
        </div>
      </section>

      {!access.hasPaidAccess ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
          <div className="flex items-start gap-2">
            <FiLock size={13} className="mt-0.5 shrink-0" />
            <p>Shortlisting works on free access, but full candidate details and contact unlocks still require a paid hiring plan.</p>
          </div>
          <Link to="/portal/hr/jobs" className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-700">
            Upgrade plan
          </Link>
        </div>
      ) : null}

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-semibold text-red-600">{error}</div> : null}

      {entries.length === 0 ? (
        <div className="flex min-h-[calc(100vh-280px)] items-center justify-center">
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-8 py-10 text-center">
            <FiStar size={24} className="mx-auto text-slate-300" />
            <p className="mt-2 text-[13px] font-semibold text-slate-500">No shortlisted candidates yet.</p>
            <p className="mt-1 max-w-sm text-[12px] text-slate-400">Save promising profiles from the Candidate Database to build your sourcing pipeline.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <ShortlistCard
              key={entry.student_user_id}
              entry={entry}
              actionState={actionState}
              onEdit={() => openEdit(entry)}
              onRemove={() => removeEntry(entry.student_user_id)}
              onInterest={() => sendInterest(entry)}
            />
          ))}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-navy">Edit shortlist entry</h2>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                <FiX size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tags</span>
                <input
                  value={editTags}
                  onChange={(event) => setEditTags(event.target.value)}
                  placeholder="react, final-year, mumbai"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Private notes</span>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  placeholder="Strong React signal, worth warm outreach."
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-full border border-slate-200 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={actionState.edit === 'saving'}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#ff6b3d] py-2 text-[13px] font-semibold text-white hover:bg-[#ef5c30] disabled:opacity-60"
              >
                {actionState.edit === 'saving' ? <FiRefreshCw size={13} className="animate-spin" /> : <FiCheckCircle size={13} />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ShortlistCard({ entry, actionState, onEdit, onRemove, onInterest }) {
  const candidate = entry.candidate || {};
  const interestStatus = candidate.crm?.interestStatus;

  return (
    <article className={cardClass}>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-amber-100 bg-amber-50 text-[10px] font-bold text-amber-600">
            {(candidate.user?.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[12px] font-bold leading-tight text-navy">{candidate.user?.name || 'Candidate'}</h2>
            <p className="truncate text-[10px] text-slate-500">{candidate.profile?.headline || 'Student profile'}</p>
          </div>
        </div>
        <button type="button" onClick={onEdit} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50">
          <FiEdit2 size={10} />
        </button>
      </div>

      {(entry.tags || []).length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-brand-100 bg-brand-50 px-1.5 py-px text-[9px] font-semibold text-brand-700">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {entry.notes ? (
        <div className="mt-1.5 rounded border border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px] leading-snug text-slate-600">
          &ldquo;{entry.notes}&rdquo;
        </div>
      ) : null}

      <div className="mt-1.5 grid grid-cols-4 gap-1">
        <Info label="College" value={candidate.education?.college || '-'} />
        <Info label="Batch" value={candidate.education?.batchYear || '-'} />
        <Info label="Location" value={candidate.profile?.location || '-'} />
        <Info label="Interest" value={interestStatus || 'Not sent'} />
      </div>

      <div className="mt-1.5 rounded border border-dashed border-slate-200 px-2 py-1 text-[10px] leading-snug text-slate-500">
        {candidate.access?.canViewResume ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-0.5 text-slate-700"><FiUser size={10} /> {candidate.user?.email || '-'}</span>
            <span className="inline-flex items-center gap-0.5 text-slate-700"><FiSend size={10} /> {candidate.user?.mobile || '-'}</span>
            {candidate.profile?.resumeUrl ? (
              <a href={candidate.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-brand-700 hover:underline">
                <FiFileText size={10} /> Resume
              </a>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start gap-1">
            <FiLock size={10} className="mt-px shrink-0 text-amber-600" />
            <p>{candidate.access?.blurReason || 'Upgrade to unlock profiles.'}</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {interestStatus ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <FiCheckCircle size={10} />
            Interest {interestStatus}
          </span>
        ) : (
          <button
            type="button"
            onClick={onInterest}
            disabled={actionState[`interest_${entry.student_user_id}`] === 'sending' || !candidate.access?.canSendInterest}
            className="inline-flex items-center gap-1 rounded-full bg-[#2d5bff] px-2 py-0.5 text-[10px] font-bold text-white transition hover:bg-[#2449d8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionState[`interest_${entry.student_user_id}`] === 'sending' ? <FiRefreshCw size={10} className="animate-spin" /> : <FiSend size={10} />}
            Send Interest
          </button>
        )}

        <button
          type="button"
          onClick={onRemove}
          disabled={actionState[`remove_${entry.student_user_id}`] === 'removing'}
          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
        >
          {actionState[`remove_${entry.student_user_id}`] === 'removing' ? <FiRefreshCw size={10} className="animate-spin" /> : <FiTrash2 size={10} />}
          Remove
        </button>
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1">
      <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-[11px] font-semibold text-navy">{value}</p>
    </div>
  );
}
