import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiEye,
  FiExternalLink,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiUsers,
  FiX
} from 'react-icons/fi';
import {
  bulkUpdateCampusDriveApplications,
  createCampusDrive,
  deleteCampusDrive,
  getCampusDriveApplications,
  getCampusDrives,
  updateCampusDrive,
  updateCampusDriveApplication
} from '../services/campusConnectApi';

const EMPTY_FORM = {
  companyName: '',
  jobTitle: '',
  driveDate: '',
  applicationDeadline: '',
  driveMode: 'on-campus',
  location: '',
  eligibleBranches: [],
  eligibleCgpa: '',
  description: '',
  packageMin: '',
  packageMax: '',
  visibilityScope: 'campus_only',
  status: 'upcoming'
};

const BRANCH_OPTIONS = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'MBA', 'MCA', 'All Branches'];
const APPLICATION_STATUS_OPTIONS = ['applied', 'shortlisted', 'selected', 'rejected', 'withdrawn'];
const APPLICATION_PAGE_SIZES = [25, 50, 100];

const getLocalIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateInputValue = (value) => {
  if (!value) return '';

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDriveDeadlineValue = (drive = {}) =>
  formatDateInputValue(drive.application_deadline || drive.applicationDeadline || drive.drive_date || drive.driveDate || '');

const isDriveAcceptingApplications = (drive = {}) => {
  const status = String(drive.status || '').trim().toLowerCase();
  if (['completed', 'closed', 'cancelled', 'archived', 'past'].includes(status)) return false;

  const deadline = getDriveDeadlineValue(drive);
  if (!deadline) return true;

  return deadline >= getLocalIsoDate();
};

const getDriveDisplayStatus = (drive = {}) => {
  const status = String(drive.status || 'upcoming').trim().toLowerCase();
  if (!isDriveAcceptingApplications(drive) && ['upcoming', 'ongoing'].includes(status)) {
    return 'expired';
  }

  return status || 'upcoming';
};

const STATUS_STYLES = {
  upcoming: 'bg-brand-50 text-brand-700',
  ongoing: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
  expired: 'bg-amber-50 text-amber-700'
};

const APPLICATION_STATUS_STYLES = {
  applied: 'bg-slate-100 text-slate-700',
  shortlisted: 'bg-sky-50 text-sky-700',
  selected: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
  withdrawn: 'bg-amber-50 text-amber-700'
};

const VISIBILITY_OPTIONS = [
  {
    value: 'campus_only',
    label: 'Campus Only',
    description: 'Only linked students from your imported campus pool can see and apply.'
  },
  {
    value: 'platform_open',
    label: 'Open to Platform',
    description: 'Any student using HHH Jobs can see and apply directly from the platform.'
  }
];

const mapDriveToForm = (drive = {}) => ({
  id: drive.id,
  companyName: drive.company_name || drive.companyName || '',
  jobTitle: drive.job_title || drive.jobTitle || '',
  driveDate: formatDateInputValue(drive.drive_date || drive.driveDate || ''),
  applicationDeadline: formatDateInputValue(drive.application_deadline || drive.applicationDeadline || drive.drive_date || drive.driveDate || ''),
  driveMode: drive.drive_mode || drive.driveMode || 'on-campus',
  location: drive.location || '',
  eligibleBranches: Array.isArray(drive.eligible_branches)
    ? drive.eligible_branches
    : (Array.isArray(drive.eligibleBranches) ? drive.eligibleBranches : []),
  eligibleCgpa: drive.eligible_cgpa ?? drive.eligibleCgpa ?? '',
  description: drive.description || '',
  packageMin: drive.package_min ?? drive.packageMin ?? '',
  packageMax: drive.package_max ?? drive.packageMax ?? '',
  visibilityScope: drive.visibility_scope || drive.visibilityScope || 'campus_only',
  status: drive.status || 'upcoming'
});

const buildApplicationSummary = (applications = []) => ({
  total: applications.length,
  applied: applications.filter((item) => item.status === 'applied').length,
  shortlisted: applications.filter((item) => item.status === 'shortlisted').length,
  selected: applications.filter((item) => item.status === 'selected').length,
  rejected: applications.filter((item) => item.status === 'rejected').length,
  withdrawn: applications.filter((item) => item.status === 'withdrawn').length
});

const formatStatusLabel = (value = '') => {
  const normalized = String(value || '').trim();
  if (!normalized) return 'Unknown';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/_/g, ' ');
};

const formatDateLabel = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const createApplicationDraft = (application = {}) => ({
  status: application.status || 'applied',
  currentRound: application.currentRound || '',
  notes: application.notes || ''
});

const applyApplicationUpdate = (application, updated = {}) => ({
  ...application,
  status: updated.status || application.status,
  currentRound: updated.current_round || '',
  eliminatedInRound: updated.eliminated_in_round || '',
  notes: updated.notes || '',
  reviewedAt: updated.reviewed_at || application.reviewedAt,
  decisionAt: updated.decision_at || application.decisionAt
});

const getApplicationSearchText = (application = {}) => [
  application.candidate?.name,
  application.applicantEmail,
  application.candidate?.phone,
  application.candidate?.branch,
  application.candidate?.degree,
  application.currentRound,
  application.notes
].filter(Boolean).join(' ').toLowerCase();

const DriveFormModal = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(initial ? mapDriveToForm(initial) : {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const today = getLocalIsoDate();

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const toggleBranch = (branch) => {
    setForm((current) => ({
      ...current,
      eligibleBranches: current.eligibleBranches.includes(branch)
        ? current.eligibleBranches.filter((item) => item !== branch)
        : [...current.eligibleBranches, branch]
    }));
  };

  const handleSubmit = async () => {
    if (!form.companyName || !form.jobTitle || !form.driveDate) {
      setError('Company name, job title, and drive date are required.');
      return;
    }

    const normalizedDriveDate = formatDateInputValue(form.driveDate);
    const normalizedApplicationDeadline = formatDateInputValue(form.applicationDeadline || form.driveDate);
    if (!normalizedDriveDate || !normalizedApplicationDeadline) {
      setError('Please select valid drive and application dates.');
      return;
    }
    if (normalizedDriveDate < today) {
      setError('Drive date cannot be in the past.');
      return;
    }
    if (normalizedApplicationDeadline < today) {
      setError('Application deadline cannot be in the past.');
      return;
    }
    if (normalizedApplicationDeadline > normalizedDriveDate) {
      setError('Application deadline cannot be after the drive date.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        driveDate: normalizedDriveDate,
        applicationDeadline: normalizedApplicationDeadline
      };
      const saved = initial?.id
        ? await updateCampusDrive(initial.id, payload)
        : await createCampusDrive(payload);

      onSaved(saved, Boolean(initial?.id));
    } catch (err) {
      setError(err.message || 'Unable to save drive.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-navy">{initial?.id ? 'Edit Drive' : 'Create Campus Pool'}</h3>
          <button type="button" onClick={onClose}><FiX size={20} className="text-slate-400" /></button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Company Name <span className="text-red-400">*</span></label>
            <input
              value={form.companyName}
              onChange={(event) => update('companyName', event.target.value)}
              placeholder="e.g. Infosys, TCS, Amazon"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Job Title / Role <span className="text-red-400">*</span></label>
            <input
              value={form.jobTitle}
              onChange={(event) => update('jobTitle', event.target.value)}
              placeholder="e.g. Software Engineer, Analyst"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Drive Date <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={form.driveDate}
              onChange={(event) => update('driveDate', event.target.value)}
              min={today}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Application Deadline</label>
            <input
              type="date"
              value={form.applicationDeadline}
              onChange={(event) => update('applicationDeadline', event.target.value)}
              min={form.driveDate ? today : today}
              max={form.driveDate || undefined}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Drive Mode</label>
            <select
              value={form.driveMode}
              onChange={(event) => update('driveMode', event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            >
              <option value="on-campus">On-Campus</option>
              <option value="virtual">Virtual / Online</option>
              <option value="off-campus">Off-Campus</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Location</label>
            <input
              value={form.location}
              onChange={(event) => update('location', event.target.value)}
              placeholder="e.g. Campus Auditorium / Online"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Minimum CGPA</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.eligibleCgpa}
              onChange={(event) => update('eligibleCgpa', event.target.value)}
              placeholder="e.g. 6.5"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Visibility Scope</label>
            <select
              value={form.visibilityScope}
              onChange={(event) => update('visibilityScope', event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {VISIBILITY_OPTIONS.find((item) => item.value === form.visibilityScope)?.description}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Package Min (₹ LPA)</label>
            <input
              type="number"
              value={form.packageMin}
              onChange={(event) => update('packageMin', event.target.value)}
              placeholder="e.g. 4"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Package Max (₹ LPA)</label>
            <input
              type="number"
              value={form.packageMax}
              onChange={(event) => update('packageMax', event.target.value)}
              placeholder="e.g. 8"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {initial?.id ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Status</label>
              <select
                value={form.status}
                onChange={(event) => update('status', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ) : null}

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
              rows="4"
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Describe the rounds, documents, interview process, or who can apply."
              className="w-full rounded-[1.25rem] border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#ef5c30] disabled:opacity-70"
          >
            {saving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
            {saving ? 'Saving...' : initial?.id ? 'Update Pool' : 'Publish Pool'}
          </button>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}
      </div>
    </div>
  );
};

const ApplicantsModal = ({ drive, onClose, onSummaryChange }) => {
  const [state, setState] = useState({
    loading: true,
    error: '',
    applications: [],
    summary: buildApplicationSummary([])
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APPLICATION_PAGE_SIZES[0]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [rowDrafts, setRowDrafts] = useState({});
  const [rowSavingId, setRowSavingId] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkForm, setBulkForm] = useState({
    status: '',
    currentRound: '',
    notes: ''
  });

  useEffect(() => {
    let active = true;

    const loadApplications = async () => {
      const response = await getCampusDriveApplications(drive.id);
      if (!active) return;

      const applications = response.data?.applications || [];
      setState({
        loading: false,
        error: response.error || '',
        applications,
        summary: response.data?.summary || buildApplicationSummary([])
      });
      setRowDrafts(Object.fromEntries(applications.map((application) => [application.id, createApplicationDraft(application)])));
      setSelectedIds([]);
      onSummaryChange(drive.id, response.data?.summary || buildApplicationSummary([]));
    };

    loadApplications();

    return () => {
      active = false;
    };
  }, [drive.id, onSummaryChange]);

  const syncApplications = (updater) => {
    setState((current) => {
      const applications = updater(current.applications);
      const summary = buildApplicationSummary(applications);
      onSummaryChange(drive.id, summary);

      return {
        ...current,
        applications,
        summary
      };
    });
  };

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return state.applications.filter((application) => {
      if (statusFilter !== 'all' && application.status !== statusFilter) return false;
      if (!normalizedSearch) return true;
      return getApplicationSearchText(application).includes(normalizedSearch);
    });
  }, [search, state.applications, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const visibleApplications = useMemo(
    () => filteredApplications.slice((page - 1) * pageSize, page * pageSize),
    [filteredApplications, page, pageSize]
  );
  const visibleIds = visibleApplications.map((application) => application.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.includes(id)).length;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const updateRowDraft = (applicationId, field, value) => {
    setRowDrafts((current) => ({
      ...current,
      [applicationId]: {
        ...(current[applicationId] || createApplicationDraft(state.applications.find((item) => item.id === applicationId))),
        [field]: value
      }
    }));
  };

  const mergeUpdatedApplications = (updatedRows = []) => {
    const updatedById = Object.fromEntries((updatedRows || []).map((row) => [row.id, row]));

    syncApplications((applications) => applications.map((application) => (
      updatedById[application.id]
        ? applyApplicationUpdate(application, updatedById[application.id])
        : application
    )));

    setRowDrafts((current) => {
      const next = { ...current };
      updatedRows.forEach((row) => {
        next[row.id] = {
          status: row.status || 'applied',
          currentRound: row.current_round || '',
          notes: row.notes || ''
        };
      });
      return next;
    });
  };

  const handleRowSave = async (applicationId) => {
    const draft = rowDrafts[applicationId];
    if (!draft) return;

    setRowSavingId(applicationId);
    setBulkMessage('');

    try {
      const updated = await updateCampusDriveApplication(drive.id, applicationId, draft);
      mergeUpdatedApplications([updated]);
      setBulkMessage('Applicant status updated.');
    } catch (error) {
      setBulkMessage(error.message || 'Unable to update applicant.');
    } finally {
      setRowSavingId('');
    }
  };

  const handleBulkApply = async () => {
    if (!selectedIds.length) {
      setBulkMessage('Select at least one student first.');
      return;
    }

    const payload = {
      applicationIds: selectedIds
    };

    if (bulkForm.status) payload.status = bulkForm.status;
    if (bulkForm.currentRound.trim()) payload.currentRound = bulkForm.currentRound.trim();
    if (bulkForm.notes.trim()) payload.notes = bulkForm.notes.trim();

    if (!payload.status && !payload.currentRound && !payload.notes) {
      setBulkMessage('Choose a bulk status, round, or notes before applying.');
      return;
    }

    setBulkSaving(true);
    setBulkMessage('');

    try {
      const response = await bulkUpdateCampusDriveApplications(drive.id, payload);
      mergeUpdatedApplications(response.applications || []);
      setSelectedIds([]);
      setBulkForm((current) => ({
        ...current,
        notes: ''
      }));
      setBulkMessage(`${response.updatedCount || 0} applicant${response.updatedCount === 1 ? '' : 's'} updated.`);
    } catch (error) {
      setBulkMessage(error.message || 'Unable to update selected applicants.');
    } finally {
      setBulkSaving(false);
    }
  };

  const toggleSelection = (applicationId) => {
    setSelectedIds((current) => (
      current.includes(applicationId)
        ? current.filter((id) => id !== applicationId)
        : [...current, applicationId]
    ));
  };

  const selectVisible = () => {
    setSelectedIds((current) => [...new Set([...current, ...visibleIds])]);
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700">Applicants</p>
            <h3 className="mt-2 text-2xl font-bold text-navy">{drive.company_name} · {drive.job_title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {drive.visibility_scope === 'platform_open' ? 'Open to all platform students' : 'Campus-only pool'} · Deadline {formatDateLabel(drive.application_deadline || drive.drive_date)}
            </p>
          </div>
          <button type="button" onClick={onClose}><FiX size={20} className="text-slate-400" /></button>
        </div>

        <div className="grid gap-3 sm:grid-cols-5">
          {[
            { label: 'Total', value: state.summary.total },
            { label: 'Applied', value: state.summary.applied },
            { label: 'Shortlisted', value: state.summary.shortlisted },
            { label: 'Selected', value: state.summary.selected },
            { label: 'Rejected', value: state.summary.rejected }
          ].map((item) => (
            <div key={item.label} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-navy">{item.value}</p>
            </div>
          ))}
        </div>

        {state.loading ? (
          <div className="mt-6 grid gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-[1.4rem] bg-slate-100" />
            ))}
          </div>
        ) : state.error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>
        ) : state.applications.length === 0 ? (
          <div className="mt-6 rounded-[1.4rem] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <FiUsers className="mx-auto mb-3 text-slate-300" size={34} />
            <p className="text-lg font-bold text-slate-500">No one has applied yet.</p>
            <p className="mt-2 text-sm text-slate-400">As students apply from the platform, their records will appear here for CRD review.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, phone, branch, degree"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              >
                <option value="all">All statuses</option>
                {APPLICATION_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{formatStatusLabel(status)}</option>
                ))}
              </select>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              >
                {APPLICATION_PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>

            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>Total: <strong className="text-navy">{state.applications.length}</strong></span>
                  <span>Filtered: <strong className="text-navy">{filteredApplications.length}</strong></span>
                  <span>Selected: <strong className="text-navy">{selectedIds.length}</strong></span>
                  <span>Visible selected: <strong className="text-navy">{selectedVisibleCount}</strong></span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={selectVisible}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Select visible
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Clear selection
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-[220px_220px_minmax(0,1fr)_180px]">
                <select
                  value={bulkForm.status}
                  onChange={(event) => setBulkForm((current) => ({ ...current, status: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Bulk status</option>
                  {APPLICATION_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{formatStatusLabel(status)}</option>
                  ))}
                </select>
                <input
                  value={bulkForm.currentRound}
                  onChange={(event) => setBulkForm((current) => ({ ...current, currentRound: event.target.value }))}
                  placeholder="Bulk round"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
                <input
                  value={bulkForm.notes}
                  onChange={(event) => setBulkForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Bulk notes"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={handleBulkApply}
                  disabled={bulkSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-3 text-sm font-bold text-white hover:bg-[#ef5c30] disabled:opacity-70"
                >
                  {bulkSaving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
                  {bulkSaving ? 'Applying...' : 'Apply to selected'}
                </button>
              </div>

              {bulkMessage ? (
                <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${bulkMessage.includes('updated') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {bulkMessage}
                </div>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-[1.3rem] border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-[1280px] divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                      <th className="px-4 py-3">Select</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Academic</th>
                      <th className="px-4 py-3">Applied</th>
                      <th className="px-4 py-3">Round</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {visibleApplications.map((application) => {
                      const draft = rowDrafts[application.id] || createApplicationDraft(application);
                      const savingRow = rowSavingId === application.id;

                      return (
                        <tr key={application.id} className="align-top">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(application.id)}
                              onChange={() => toggleSelection(application.id)}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-navy">{application.candidate?.name || 'Applicant'}</p>
                              <p className="mt-1 text-sm text-slate-500">{application.applicantEmail || 'No email'}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${APPLICATION_STATUS_STYLES[application.status] || APPLICATION_STATUS_STYLES.applied}`}>
                                  {formatStatusLabel(application.status)}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                  {application.source === 'platform_open' ? 'Platform Open' : 'Campus Pool'}
                                </span>
                              </div>
                              <p className="mt-2 text-xs text-slate-500">{application.candidate?.phone || 'Phone not added'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            <p><strong className="text-slate-800">Branch:</strong> {application.candidate?.branch || 'Open application'}</p>
                            <p className="mt-1"><strong className="text-slate-800">Degree:</strong> {application.candidate?.degree || 'Not added'}</p>
                            <p className="mt-1"><strong className="text-slate-800">CGPA:</strong> {application.candidate?.cgpa ?? 'N/A'}</p>
                            <p className="mt-1"><strong className="text-slate-800">Grad:</strong> {application.candidate?.graduationYear || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            <p>{formatDateLabel(application.appliedAt)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {application.reviewer?.name ? `Reviewed by ${application.reviewer.name}` : 'Not reviewed yet'}
                            </p>
                            {application.eliminatedInRound ? (
                              <p className="mt-2 text-xs font-semibold text-red-500">Out in {application.eliminatedInRound}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-4">
                            <input
                              value={draft.currentRound}
                              onChange={(event) => updateRowDraft(application.id, 'currentRound', event.target.value)}
                              placeholder="Current round"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <input
                              value={draft.notes}
                              onChange={(event) => updateRowDraft(application.id, 'notes', event.target.value)}
                              placeholder="Quick notes"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={draft.status}
                              onChange={(event) => updateRowDraft(application.id, 'status', event.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                            >
                              {APPLICATION_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{formatStatusLabel(status)}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => handleRowSave(application.id)}
                                disabled={savingRow}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2 text-sm font-bold text-white hover:bg-[#ef5c30] disabled:opacity-70"
                              >
                                {savingRow ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
                                {savingRow ? 'Saving...' : 'Save'}
                              </button>
                              {application.resumeUrl ? (
                                <a
                                  href={application.resumeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  <FiExternalLink size={14} />
                                  Resume
                                </a>
                              ) : application.hasResumeText ? (
                                <span className="inline-flex justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                                  Resume text
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                No applicants match the current filters.
              </div>
            ) : null}

            <div className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-slate-500">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredApplications.length)} of {filteredApplications.length} applicants
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CampusDrivesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [draftDrive, setDraftDrive] = useState(null);
  const [selectedDrive, setSelectedDrive] = useState(null);

  const load = async () => {
    setLoading(true);
    const response = await getCampusDrives();
    setDrives(response.data || []);
    setError(response.error || '');
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const nextDraft = location.state?.prefillDrive;
    if (!location.state?.autoOpenDriveForm || !nextDraft) return;

    setEditingDrive(null);
    setDraftDrive(nextDraft);
    setShowForm(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleSaved = (drive, isEdit) => {
    setDrives((current) => (
      isEdit
        ? current.map((item) => (
            item.id === drive.id
              ? {
                  ...item,
                  ...drive,
                  applicant_count: item.applicant_count || 0,
                  shortlisted_count: item.shortlisted_count || 0,
                  selected_count: item.selected_count || 0
                }
              : item
          ))
        : [{ ...drive, applicant_count: 0, shortlisted_count: 0, selected_count: 0 }, ...current]
    ));
    setShowForm(false);
    setEditingDrive(null);
    setDraftDrive(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campus pool?')) return;

    try {
      await deleteCampusDrive(id);
      setDrives((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message || 'Unable to delete drive.');
    }
  };

  const handleSummaryChange = useCallback((driveId, summary) => {
    setDrives((current) => current.map((drive) => (
      drive.id === driveId
        ? {
            ...drive,
            applicant_count: summary.total || 0,
            shortlisted_count: summary.shortlisted || 0,
            selected_count: summary.selected || 0
          }
        : drive
    )));
  }, []);

  const upcoming = useMemo(
    () => drives.filter((drive) => ['upcoming', 'ongoing'].includes(getDriveDisplayStatus(drive))),
    [drives]
  );
  const past = useMemo(
    () => drives.filter((drive) => !['upcoming', 'ongoing'].includes(getDriveDisplayStatus(drive))),
    [drives]
  );
  const totalApplicants = useMemo(
    () => drives.reduce((sum, drive) => sum + Number(drive.applicant_count || 0), 0),
    [drives]
  );
  const platformOpenCount = useMemo(
    () => drives.filter((drive) => (drive.visibility_scope || 'campus_only') === 'platform_open').length,
    [drives]
  );
  const selectedTotal = useMemo(
    () => drives.reduce((sum, drive) => sum + Number(drive.selected_count || 0), 0),
    [drives]
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 pb-12">
      {(showForm || editingDrive) ? (
        <DriveFormModal
          initial={editingDrive || draftDrive}
          onClose={() => { setShowForm(false); setEditingDrive(null); setDraftDrive(null); }}
          onSaved={handleSaved}
        />
      ) : null}

      {selectedDrive ? (
        <ApplicantsModal
          drive={selectedDrive}
          onClose={() => setSelectedDrive(null)}
          onSummaryChange={handleSummaryChange}
        />
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Campus Pools & Drive Workflow</h1>
          <p className="mt-1 text-sm text-slate-500">
            Publish pools, collect applications inside the platform, and manage shortlist or placement status without Excel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingDrive(null); setDraftDrive(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
        >
          <FiPlus size={15} />
          Create Drive Pool
        </button>
      </div>

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}

      {!loading && drives.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active Pools', value: upcoming.length, helper: 'Currently live or upcoming' },
            { label: 'Closed Pools', value: past.length, helper: 'Past, completed, or expired' },
            { label: 'Applicants', value: totalApplicants, helper: 'Total submissions across pools' },
            { label: 'Selected', value: selectedTotal, helper: `${platformOpenCount} open to platform` }
          ].map((item) => (
            <article key={item.label} className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.18)]">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-navy">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.helper}</p>
            </article>
          ))}
        </section>
      ) : null}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-[1.25rem] border border-slate-100 bg-white shadow-[0_4px_16px_-8px_rgba(15,23,42,0.10)]" />
          ))}
        </div>
      ) : drives.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white text-center">
          <FiBriefcase size={36} className="mb-3 text-slate-300" />
          <p className="font-semibold text-slate-400">No campus pools published yet.</p>
          <button
            type="button"
            onClick={() => { setEditingDrive(null); setDraftDrive(null); setShowForm(true); }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-5 py-2 text-sm font-bold text-white hover:bg-[#ef5c30]"
          >
            <FiPlus size={14} />
            Publish first pool
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-navy">Active Pools</h2>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {upcoming.length} live
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((drive) => (
                  <DriveCard
                    key={drive.id}
                    drive={drive}
                    onEdit={() => { setDraftDrive(null); setEditingDrive(drive); }}
                    onDelete={() => handleDelete(drive.id)}
                    onApplicants={() => setSelectedDrive(drive)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {past.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-500">Closed / Past Pools</h2>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {past.length} archived
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {past.map((drive) => (
                  <DriveCard
                    key={drive.id}
                    drive={drive}
                    onEdit={() => { setDraftDrive(null); setEditingDrive(drive); }}
                    onDelete={() => handleDelete(drive.id)}
                    onApplicants={() => setSelectedDrive(drive)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DriveCard({ drive, onEdit, onDelete, onApplicants }) {
  const visibilityLabel = VISIBILITY_OPTIONS.find((item) => item.value === (drive.visibility_scope || 'campus_only'))?.label || 'Campus Only';
  const displayStatus = getDriveDisplayStatus(drive);
  const isExpired = displayStatus === 'expired';
  const compactModeLabel = String(drive.drive_mode || 'on-campus').replace(/-/g, ' ');

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.35)] transition hover:border-slate-300 hover:shadow-[0_16px_30px_-22px_rgba(15,23,42,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[1.05rem] font-bold text-navy">{drive.company_name}</p>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${STATUS_STYLES[displayStatus] || 'bg-slate-100 text-slate-600'}`}>
              {displayStatus}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
              {visibilityLabel}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-600">{drive.job_title}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-red-100 bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
        <span className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <FiCalendar size={12} />
          Drive {formatDateLabel(drive.drive_date)}
        </span>
        <span className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <FiMapPin size={12} />
          {compactModeLabel} {drive.location ? `· ${drive.location}` : ''}
        </span>
        <span className="rounded-xl bg-slate-50 px-2.5 py-2 font-semibold text-slate-600">
          Deadline: {formatDateLabel(drive.application_deadline || drive.drive_date)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-[1rem] border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Applicants</p>
          <p className="mt-1.5 text-xl font-bold text-navy">{drive.applicant_count || 0}</p>
        </div>
        <div className="rounded-[1rem] border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Shortlisted</p>
          <p className="mt-1.5 text-xl font-bold text-navy">{drive.shortlisted_count || 0}</p>
        </div>
        <div className="rounded-[1rem] border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Selected</p>
          <p className="mt-1.5 text-xl font-bold text-navy">{drive.selected_count || 0}</p>
        </div>
      </div>

      {drive.eligible_branches?.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {drive.eligible_branches.slice(0, 5).map((branch) => (
            <span key={branch} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{branch}</span>
          ))}
          {drive.eligible_branches.length > 5 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              +{drive.eligible_branches.length - 5} more
            </span>
          ) : null}
        </div>
      ) : null}

      {drive.description ? (
        <p className="mt-3 text-xs leading-5 text-slate-400 line-clamp-2">{drive.description}</p>
      ) : null}

      {isExpired ? (
        <p className="mt-3 text-xs font-semibold text-amber-700">
          This pool is no longer live for student applications because its deadline or drive date has already passed.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApplicants}
          className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100"
        >
          <FiUsers size={13} />
          Manage Applicants
        </button>
        <button
          type="button"
          onClick={onApplicants}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <FiEye size={13} />
          View Pipeline
        </button>
      </div>
    </div>
  );
}
