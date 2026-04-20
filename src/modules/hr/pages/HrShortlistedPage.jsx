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

const cardClass = 'rounded-[1.6rem] border border-slate-100 bg-white p-5 shadow-[0_10px_32px_-24px_rgba(15,23,42,0.2)]';

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
    <div className="mx-auto w-full max-w-[1120px] space-y-6 pb-12">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-navy">
            <FiStar size={22} className="text-amber-500" />
            Shortlisted candidates
          </h1>
          <p className="mt-1 text-sm text-slate-500">Your recruiter CRM for saved candidates, tags, notes, and follow-ups.</p>
        </div>
        <div className="rounded-[1.25rem] border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Connected candidates</p>
          <p className="mt-1 text-2xl font-black text-navy">{summary.connected}</p>
        </div>
      </section>

      {!access.hasPaidAccess ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <FiLock size={16} className="mt-0.5 shrink-0" />
            <p>Shortlisting works on free access, but full candidate details and contact unlocks still require a paid hiring plan.</p>
          </div>
          <Link to="/portal/hr/jobs" className="rounded-full bg-amber-600 px-4 py-2 font-bold text-white transition hover:bg-amber-700">
            Upgrade plan
          </Link>
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}

      {entries.length === 0 ? (
        <div className={`${cardClass} flex min-h-[320px] flex-col items-center justify-center text-center`}>
          <FiStar size={36} className="text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">No shortlisted candidates yet.</p>
          <p className="mt-2 text-sm text-slate-400">Save promising profiles from the Candidate Database to build your sourcing pipeline.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-navy">Edit shortlist entry</h2>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tags</span>
                <input
                  value={editTags}
                  onChange={(event) => setEditTags(event.target.value)}
                  placeholder="react, final-year, mumbai"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Private notes</span>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  placeholder="Strong React signal, worth warm outreach."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={actionState.edit === 'saving'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6b3d] py-2.5 text-sm font-bold text-white hover:bg-[#ef5c30] disabled:opacity-60"
              >
                {actionState.edit === 'saving' ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-amber-100 bg-amber-50 text-base font-black text-amber-600">
            {(candidate.user?.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-navy">{candidate.user?.name || 'Candidate'}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">{candidate.profile?.headline || 'Student profile'}</p>
          </div>
        </div>

        <button type="button" onClick={onEdit} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
          <FiEdit2 size={15} />
        </button>
      </div>

      {(entry.tags || []).length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {entry.notes ? (
        <div className="mt-4 rounded-[1.2rem] border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          &ldquo;{entry.notes}&rdquo;
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info label="College" value={candidate.education?.college || '-'} />
        <Info label="Batch year" value={candidate.education?.batchYear || '-'} />
        <Info label="Location" value={candidate.profile?.location || '-'} />
        <Info label="Interest" value={interestStatus || 'Not sent'} />
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-dashed border-slate-200 px-4 py-3">
        {candidate.access?.canViewResume ? (
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2"><FiUser size={14} /> {candidate.user?.email || '-'}</span>
            <span className="inline-flex items-center gap-2"><FiSend size={14} /> {candidate.user?.mobile || '-'}</span>
            {candidate.profile?.resumeUrl ? (
              <a href={candidate.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-brand-700 hover:underline">
                <FiFileText size={14} />
                View resume
              </a>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-slate-500">
            <FiLock size={15} className="mt-0.5 shrink-0 text-amber-600" />
            <p>{candidate.access?.blurReason || 'Resume and contacts unlock after candidate acceptance.'}</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {interestStatus ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            <FiCheckCircle size={14} />
            Interest {interestStatus}
          </span>
        ) : (
          <button
            type="button"
            onClick={onInterest}
            disabled={actionState[`interest_${entry.student_user_id}`] === 'sending' || !candidate.access?.canSendInterest}
            className="inline-flex items-center gap-2 rounded-full bg-[#2d5bff] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2449d8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionState[`interest_${entry.student_user_id}`] === 'sending' ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSend size={14} />}
            Send interest
          </button>
        )}

        <button
          type="button"
          onClick={onRemove}
          disabled={actionState[`remove_${entry.student_user_id}`] === 'removing'}
          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
        >
          {actionState[`remove_${entry.student_user_id}`] === 'removing' ? <FiRefreshCw size={14} className="animate-spin" /> : <FiTrash2 size={14} />}
          Remove
        </button>
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-[1rem] border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-navy">{value}</p>
    </div>
  );
}
