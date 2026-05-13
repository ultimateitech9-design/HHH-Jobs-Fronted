import { useCallback, useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiMapPin,
  FiUser,
  FiUsers,
  FiX,
  FiXCircle
} from 'react-icons/fi';
import {
  fetchHrCampusDrives,
  fetchHrCampusDriveApplications,
  updateHrCampusDriveApplication
} from '../services/hrApi';

const STATUS_STYLES = {
  applied: 'bg-blue-50 text-blue-700',
  shortlisted: 'bg-amber-50 text-amber-700',
  selected: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  withdrawn: 'bg-slate-100 text-slate-500'
};

const DRIVE_STATUS_STYLES = {
  upcoming: 'bg-brand-50 text-brand-700',
  ongoing: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
  expired: 'bg-slate-100 text-slate-500'
};

const ROUNDS = ['Aptitude', 'Group Discussion', 'Technical Round 1', 'Technical Round 2', 'HR Round', 'Final Round'];

const formatDate = (value) => {
  if (!value) return 'Not set';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const capitalize = (s = '') => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';

// ── Drive List View ─────────────────────────────────────────────────────────

function DriveCard({ drive, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-[1.5rem] border border-slate-100 bg-white p-5 text-left shadow-[0_4px_16px_-8px_rgba(15,23,42,0.10)] transition hover:border-brand-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-extrabold text-navy">{drive.jobTitle}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${DRIVE_STATUS_STYLES[drive.status] || 'bg-slate-100 text-slate-600'}`}>
              {drive.status}
            </span>
          </div>
          {drive.college && (
            <p className="mt-0.5 text-sm text-slate-500">
              {drive.college.name}{drive.college.city ? `, ${drive.college.city}` : ''}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
          {drive.counts.total} applicants
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1"><FiCalendar size={12} /> {formatDate(drive.driveDate)}</span>
        <span className="flex items-center gap-1"><FiMapPin size={12} /> {drive.driveMode}{drive.location ? ` · ${drive.location}` : ''}</span>
        {drive.packageMin || drive.packageMax ? (
          <span className="font-medium text-slate-600">
            {drive.packageMin ? `₹${(drive.packageMin / 100000).toFixed(1)}L` : ''}
            {drive.packageMin && drive.packageMax ? ' – ' : ''}
            {drive.packageMax ? `₹${(drive.packageMax / 100000).toFixed(1)}L` : ''}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex gap-3">
        <MiniStat label="Shortlisted" count={drive.counts.shortlisted} color="text-amber-600" />
        <MiniStat label="Selected" count={drive.counts.selected} color="text-emerald-600" />
        <MiniStat label="Rejected" count={drive.counts.rejected} color="text-red-500" />
      </div>
    </button>
  );
}

function MiniStat({ label, count, color }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className={`text-lg font-extrabold ${color}`}>{count}</p>
    </div>
  );
}

// ── Applicant Detail View ───────────────────────────────────────────────────

function ApplicantRow({ app, onUpdate, updating }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(app.currentRound || '');
  const [notes, setNotes] = useState(app.notes || '');

  const handleAction = async (status) => {
    await onUpdate(app.id, { status, currentRound: round, notes, eliminatedInRound: status === 'rejected' ? round : '' });
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FiUser size={14} className="shrink-0 text-slate-400" />
            <p className="truncate text-sm font-bold text-navy">{app.candidate.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[app.status] || 'bg-slate-100 text-slate-500'}`}>
              {capitalize(app.status)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
            <span>{app.candidate.email}</span>
            {app.candidate.branch && <span>{app.candidate.branch}</span>}
            {app.candidate.cgpa && <span>CGPA: {app.candidate.cgpa}</span>}
            {app.currentRound && <span className="font-medium text-slate-600">Round: {app.currentRound}</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Update Result <FiChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Current Round
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300"
              >
                <option value="">Select round</option>
                {ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Notes
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note (optional)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAction('shortlisted')}
              disabled={updating}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              <FiCheck size={13} /> Shortlist
            </button>
            <button
              type="button"
              onClick={() => handleAction('selected')}
              disabled={updating}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <FiCheckCircle size={13} /> Select (Hired)
            </button>
            <button
              type="button"
              onClick={() => handleAction('rejected')}
              disabled={updating}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              <FiXCircle size={13} /> Reject
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              <FiX size={13} /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Drive Detail (Applicant Management) ─────────────────────────────────────

function DriveApplicantsView({ driveId, onBack }) {
  const [drive, setDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchHrCampusDriveApplications(driveId);
      setDrive(result.drive);
      setApplications(result.applications);
      setSummary(result.summary);
    } catch (err) {
      setError(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [driveId]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (applicationId, payload) => {
    try {
      setUpdating(true);
      await updateHrCampusDriveApplication(driveId, applicationId, payload);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to update.');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        <FiArrowLeft size={14} /> Back to Drives
      </button>

      {drive && (
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
          <h2 className="text-lg font-extrabold text-navy">{drive.jobTitle}</h2>
          <p className="text-sm text-slate-500">{drive.collegeName} · {formatDate(drive.driveDate)}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Total', value: summary.total, color: 'text-slate-700' },
              { label: 'Applied', value: summary.applied, color: 'text-blue-600' },
              { label: 'Shortlisted', value: summary.shortlisted, color: 'text-amber-600' },
              { label: 'Selected', value: summary.selected, color: 'text-emerald-600' },
              { label: 'Rejected', value: summary.rejected, color: 'text-red-500' }
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{s.label}</p>
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {['all', 'applied', 'shortlisted', 'selected', 'rejected'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === f ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {capitalize(f)} {f !== 'all' ? `(${applications.filter((a) => a.status === f).length})` : `(${applications.length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <FiUsers size={32} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-400">No applicants {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicantRow key={app.id} app={app} onUpdate={handleUpdate} updating={updating} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function HrCampusDrivesPage() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDriveId, setSelectedDriveId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchHrCampusDrives();
        setDrives(result.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load campus drives.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (selectedDriveId) {
    return (
      <div className="space-y-5">
        <DriveApplicantsView
          driveId={selectedDriveId}
          onBack={() => setSelectedDriveId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-navy">Campus Drives</h1>
        <p className="mt-1 max-w-4xl text-[13px] text-slate-500">
          View campus drives where your company is the hiring partner. Update shortlist, selection, and rejection results directly — the college placement cell gets notified automatically.
        </p>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : drives.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <FiBriefcase size={34} className="mx-auto text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-500">No campus drives found</p>
          <p className="mt-1 text-sm text-slate-400">
            Campus drives will appear here when a college creates a drive with your company name and you have an accepted connection.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drives.map((drive) => (
            <DriveCard
              key={drive.id}
              drive={drive}
              onSelect={() => setSelectedDriveId(drive.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
