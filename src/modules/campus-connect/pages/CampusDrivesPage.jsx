import { useEffect, useState } from 'react';
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX
} from 'react-icons/fi';
import {
  createCampusDrive,
  deleteCampusDrive,
  getCampusDrives,
  updateCampusDrive
} from '../services/campusConnectApi';

const EMPTY_FORM = {
  companyName: '', jobTitle: '', driveDate: '', driveMode: 'on-campus',
  location: '', eligibleBranches: [], eligibleCgpa: '', description: '',
  packageMin: '', packageMax: '', status: 'upcoming'
};

const BRANCH_OPTIONS = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'MBA', 'MCA', 'All Branches'];

const STATUS_STYLES = {
  upcoming: 'bg-brand-50 text-brand-700',
  ongoing: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600'
};

const DriveFormModal = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleBranch = (branch) => {
    setForm((f) => ({
      ...f,
      eligibleBranches: f.eligibleBranches.includes(branch)
        ? f.eligibleBranches.filter((b) => b !== branch)
        : [...f.eligibleBranches, branch]
    }));
  };

  const handleSubmit = async () => {
    if (!form.companyName || !form.jobTitle || !form.driveDate) {
      setError('Company name, job title, and drive date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let saved;
      if (initial?.id) {
        saved = await updateCampusDrive(initial.id, form);
      } else {
        saved = await createCampusDrive(form);
      }
      onSaved(saved, Boolean(initial?.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-navy">{initial?.id ? 'Edit Drive' : 'Schedule Campus Drive'}</h3>
          <button type="button" onClick={onClose}><FiX size={20} className="text-slate-400" /></button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Company Name <span className="text-red-400">*</span></label>
            <input value={form.companyName} onChange={(e) => update('companyName', e.target.value)}
              placeholder="e.g. Infosys, TCS, Amazon"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Job Title / Role <span className="text-red-400">*</span></label>
            <input value={form.jobTitle} onChange={(e) => update('jobTitle', e.target.value)}
              placeholder="e.g. Software Engineer, Analyst"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Drive Date <span className="text-red-400">*</span></label>
            <input type="date" value={form.driveDate} onChange={(e) => update('driveDate', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Drive Mode</label>
            <select value={form.driveMode} onChange={(e) => update('driveMode', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100">
              <option value="on-campus">On-Campus</option>
              <option value="virtual">Virtual / Online</option>
              <option value="off-campus">Off-Campus</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Location</label>
            <input value={form.location} onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Campus Auditorium / Online via Teams"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Min CGPA Required</label>
            <input type="number" step="0.1" min="0" max="10" value={form.eligibleCgpa}
              onChange={(e) => update('eligibleCgpa', e.target.value)}
              placeholder="e.g. 6.5"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Package Min (₹ LPA)</label>
            <input type="number" value={form.packageMin} onChange={(e) => update('packageMin', e.target.value)}
              placeholder="e.g. 4"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Package Max (₹ LPA)</label>
            <input type="number" value={form.packageMax} onChange={(e) => update('packageMax', e.target.value)}
              placeholder="e.g. 8"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>

          {initial?.id && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Status</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Eligible Branches</label>
            <div className="flex flex-wrap gap-2">
              {BRANCH_OPTIONS.map((branch) => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => toggleBranch(branch)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    form.eligibleBranches.includes(branch)
                      ? 'bg-[#2d5bff] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-[#2d5bff]'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Drive Description / Instructions</label>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe the drive: rounds, selection process, dress code, documents required..."
              className="w-full rounded-[1.25rem] border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#ef5c30] disabled:opacity-70">
            {saving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
            {saving ? 'Saving...' : initial?.id ? 'Update Drive' : 'Schedule Drive'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}
      </div>
    </div>
  );
};

export default function CampusDrivesPage() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await getCampusDrives();
    setDrives(data || []);
    setError(err || '');
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSaved = (drive, isEdit) => {
    setDrives((prev) =>
      isEdit ? prev.map((d) => d.id === drive.id ? drive : d) : [drive, ...prev]
    );
    setShowForm(false);
    setEditingDrive(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campus drive?')) return;
    try {
      await deleteCampusDrive(id);
      setDrives((prev) => prev.filter((d) => d.id !== id));
    } catch (err) { alert(err.message); }
  };

  const upcoming = drives.filter((d) => d.status === 'upcoming');
  const past = drives.filter((d) => d.status !== 'upcoming');

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-6 pb-12">
      {(showForm || editingDrive) && (
        <DriveFormModal
          initial={editingDrive}
          onClose={() => { setShowForm(false); setEditingDrive(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">Campus Drives</h1>
          <p className="mt-1 text-sm text-slate-500">{drives.length} total · {upcoming.length} upcoming · Only eligible active students are notified</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
        >
          <FiPlus size={15} />
          Schedule Drive
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-[1.5rem] border border-slate-100 bg-white shadow-[0_4px_16px_-8px_rgba(15,23,42,0.10)]" />
          ))}
        </div>
      ) : drives.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white text-center">
          <FiBriefcase size={36} className="mb-3 text-slate-300" />
          <p className="font-semibold text-slate-400">No drives scheduled yet.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-5 py-2 text-sm font-bold text-white hover:bg-[#ef5c30]"
          >
            <FiPlus size={14} />
            Schedule first drive
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-bold text-navy">Upcoming Drives</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((drive) => (
                  <DriveCard key={drive.id} drive={drive}
                    onEdit={() => { setEditingDrive({ ...EMPTY_FORM, ...drive }); }}
                    onDelete={() => handleDelete(drive.id)} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-bold text-slate-500">Past Drives</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {past.map((drive) => (
                  <DriveCard key={drive.id} drive={drive}
                    onEdit={() => { setEditingDrive({ ...EMPTY_FORM, ...drive }); }}
                    onDelete={() => handleDelete(drive.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DriveCard({ drive, onEdit, onDelete }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-extrabold text-navy">{drive.company_name}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[drive.status] || 'bg-slate-100 text-slate-600'}`}>
              {drive.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-slate-600">{drive.job_title}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button type="button" onClick={onEdit}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50">
            Edit
          </button>
          <button type="button" onClick={onDelete}
            className="rounded-full border border-red-100 bg-red-50 p-1.5 text-red-500 hover:bg-red-100">
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <FiCalendar size={12} />
          {new Date(drive.drive_date).toDateString()}
        </span>
        <span className="flex items-center gap-1">
          <FiMapPin size={12} />
          {drive.drive_mode} {drive.location ? `· ${drive.location}` : ''}
        </span>
        {drive.eligible_cgpa && (
          <span className="font-medium text-slate-600">Min CGPA: {drive.eligible_cgpa}</span>
        )}
        {(drive.package_min || drive.package_max) && (
          <span className="font-medium text-brand-600">
            ₹{drive.package_min || '?'}–{drive.package_max || '?'}L
          </span>
        )}
      </div>

      {drive.eligible_branches?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {drive.eligible_branches.map((b) => (
            <span key={b} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{b}</span>
          ))}
        </div>
      )}

      {drive.description && (
        <p className="mt-3 text-xs text-slate-400 line-clamp-2">{drive.description}</p>
      )}
    </div>
  );
}
