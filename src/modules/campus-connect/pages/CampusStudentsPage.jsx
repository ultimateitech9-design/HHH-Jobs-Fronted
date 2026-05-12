import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiX
} from 'react-icons/fi';
import {
  deleteCampusStudent,
  downloadStudentTemplate,
  getCampusStudents,
  importCampusStudents,
  updateCampusStudent
} from '../services/campusConnectApi';

const BRANCH_OPTIONS = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'MBA', 'MCA', 'Other'];

const PlacedBadge = ({ isPlaced }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
    isPlaced ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
  }`}>
    {isPlaced ? <FiCheckCircle size={11} /> : <FiAlertCircle size={11} />}
    {isPlaced ? 'Placed' : 'Placement seeking'}
  </span>
);

const ACCOUNT_STYLES = {
  pending_activation: 'bg-blue-50 text-blue-700',
  linked_existing: 'bg-violet-50 text-violet-700',
  active: 'bg-emerald-50 text-emerald-700',
  needs_review: 'bg-amber-50 text-amber-700'
};

const ACCOUNT_LABELS = {
  pending_activation: 'OTP invite sent',
  linked_existing: 'Linked existing',
  active: 'Active account',
  needs_review: 'Needs review'
};

const AccountBadge = ({ student }) => {
  const key = student.account_status || (student.student_user_id ? 'active' : 'pending_activation');
  return (
    <div>
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${ACCOUNT_STYLES[key] || 'bg-slate-100 text-slate-600'}`}>
        {ACCOUNT_LABELS[key] || 'Pending'}
      </span>
      {student.invite_sent_at ? (
        <p className="mt-1 text-[11px] text-slate-400">
          Invite {new Date(student.invite_sent_at).toLocaleDateString()}
        </p>
      ) : null}
    </div>
  );
};

export default function CampusStudentsPage() {
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterPlaced, setFilterPlaced] = useState('');

  // Placement modal state
  const [placingStudent, setPlacingStudent] = useState(null);
  const [placementForm, setPlacementForm] = useState({ placedCompany: '', placedRole: '', placedSalary: '' });
  const [placingSaving, setPlacingSaving] = useState(false);
  const poolPreparation = location.state?.poolPreparation || null;

  const load = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (filterBranch) params.branch = filterBranch;
    if (filterPlaced !== '') params.isPlaced = filterPlaced;

    const { data, error: err } = await getCampusStudents(params);
    setStudents(data?.students || []);
    setTotal(data?.total || 0);
    setError(err || '');
    setLoading(false);
  }, [search, filterBranch, filterPlaced]);

  useEffect(() => { load(); }, [load]);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    try {
      const result = await importCampusStudents(file);
      setImportResult({ success: true, ...result });
      load();
    } catch (err) {
      setImportResult({ success: false, message: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this student from the portal?')) return;
    try {
      await deleteCampusStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const openPlacementModal = (student) => {
    setPlacingStudent(student);
    setPlacementForm({
      placedCompany: student.placed_company || '',
      placedRole: student.placed_role || '',
      placedSalary: student.placed_salary || ''
    });
  };

  const savePlacement = async () => {
    if (!placingStudent) return;
    setPlacingSaving(true);
    try {
      const updated = await updateCampusStudent(placingStudent.id, {
        isPlaced: true,
        ...placementForm,
        placedSalary: placementForm.placedSalary ? parseFloat(placementForm.placedSalary) : undefined
      });
      setStudents((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setPlacingStudent(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setPlacingSaving(false);
    }
  };

  const markUnplaced = async (student) => {
    try {
      const updated = await updateCampusStudent(student.id, { isPlaced: false });
      setStudents((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTemplateDownload = async () => {
    const res = await downloadStudentTemplate();
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-6 pb-12">
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">Student Pool</h1>
          <p className="mt-1 text-sm text-slate-500">{total} students · Invite via OTP · Existing accounts auto-linked</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTemplateDownload}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <FiDownload size={14} />
            Download Template
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ef5c30] disabled:opacity-70"
          >
            {importing ? <FiRefreshCw size={14} className="animate-spin" /> : <FiUploadCloud size={14} />}
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      </div>

      {poolPreparation ? (
        <div className="rounded-[1.5rem] border border-brand-200 bg-brand-50 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Pool Preparation</p>
              <h2 className="mt-1 text-lg font-extrabold text-navy">Prepare eligible candidates for {poolPreparation.companyName}</h2>
              <p className="mt-1 text-sm text-slate-600">{poolPreparation.suggestion}</p>
            </div>

            <Link
              to="/portal/campus-connect/drives"
              state={{
                autoOpenDriveForm: true,
                prefillDrive: {
                  companyName: poolPreparation.companyName,
                  jobTitle: '',
                  visibilityScope: 'campus_only',
                  description: `Prepared from student pool workspace for ${poolPreparation.companyName}.`
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
            >
              <FiCheckCircle size={14} />
              Launch Drive Draft
            </Link>
          </div>
        </div>
      ) : null}

      {/* Import result banner */}
      {importResult && (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
          importResult.success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-600'
        }`}>
          {importResult.success ? <FiCheckCircle size={16} className="mt-0.5 shrink-0" /> : <FiAlertCircle size={16} className="mt-0.5 shrink-0" />}
          <div className="flex-1">
            {importResult.success ? (
              <div className="space-y-1">
                <p className="font-semibold">
                  Imported {importResult.imported} students. {importResult.invited || 0} OTP invites sent, {importResult.linkedExisting || 0} existing accounts linked.
                </p>
                <p className="text-xs opacity-90">
                  {importResult.invalidRows ? `${importResult.invalidRows} invalid rows skipped. ` : ''}
                  {importResult.duplicateRows ? `${importResult.duplicateRows} duplicate emails ignored. ` : ''}
                  {importResult.needsReview ? `${importResult.needsReview} rows need manual review because the email already belongs to a non-student account.` : ''}
                </p>
              </div>
            ) : importResult.message}
          </div>
          <button type="button" onClick={() => setImportResult(null)} className="shrink-0">
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* CSV format hint */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>CSV format:</strong> Name, Email, Phone, Degree, Branch, Graduation Year, CGPA, Skills (semicolon-separated)
        · Email is required because new students are activated through OTP/invite.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, branch..."
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300"
        >
          <option value="">All Branches</option>
          {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={filterPlaced}
          onChange={(e) => setFilterPlaced(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300"
        >
          <option value="">All Students</option>
          <option value="true">Placed</option>
          <option value="false">Placement seeking</option>
        </select>
      </div>

      {/* Student table */}
      {loading ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]">
          <div className="grid grid-cols-8 gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-3 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
          <div className="space-y-4 px-5 py-5">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-8 gap-4">
                {Array.from({ length: 8 }).map((__, columnIndex) => (
                  <div
                    key={`${rowIndex}-${columnIndex}`}
                    className={`animate-pulse rounded bg-slate-100 ${columnIndex === 0 ? 'h-12' : 'h-10'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white text-center">
          <FiUploadCloud size={36} className="mb-3 text-slate-300" />
          <p className="font-semibold text-slate-400">No students yet.</p>
          <p className="mt-1 text-sm text-slate-400">Import a CSV file to add your student pool.</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-5 py-2 text-sm font-bold text-white hover:bg-[#ef5c30]"
          >
            <FiUploadCloud size={14} />
            Import now
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Name</th>
                <th className="px-4 py-3">Branch / Degree</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">CGPA</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Placed At</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => (
                <tr key={student.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-800">{student.name || '—'}</p>
                    <p className="text-xs text-slate-400">{student.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">{student.branch || '—'}</p>
                    <p className="text-xs text-slate-400">{student.degree || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{student.graduation_year || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-700">{student.cgpa || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PlacedBadge isPlaced={student.is_placed} />
                  </td>
                  <td className="px-4 py-3">
                    <AccountBadge student={student} />
                  </td>
                  <td className="px-4 py-3">
                    {student.is_placed ? (
                      <div>
                        <p className="font-medium text-slate-700">{student.placed_company || '—'}</p>
                        <p className="text-xs text-slate-400">
                          {student.placed_role || ''}
                          {student.placed_salary ? ` · ₹${(student.placed_salary / 100000).toFixed(1)}L` : ''}
                        </p>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {student.is_placed ? (
                        <button
                          type="button"
                          onClick={() => markUnplaced(student)}
                          className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100"
                        >
                          Mark placement-seeking
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openPlacementModal(student)}
                          className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          Mark placed
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(student.id)}
                        className="inline-flex items-center justify-center rounded-full border border-red-100 bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Placement Modal */}
      {placingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setPlacingStudent(null); }}
        >
          <div className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-navy">Mark as Placed</h3>
              <button type="button" onClick={() => setPlacingStudent(null)}>
                <FiX size={18} className="text-slate-400" />
              </button>
            </div>
            <p className="mb-5 text-sm text-slate-500">
              Recording placement for <strong className="text-slate-800">{placingStudent.name}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Company Name <span className="text-red-400">*</span></label>
                <input
                  value={placementForm.placedCompany}
                  onChange={(e) => setPlacementForm((f) => ({ ...f, placedCompany: e.target.value }))}
                  placeholder="e.g. Infosys, TCS, Startup"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Role / Designation</label>
                <input
                  value={placementForm.placedRole}
                  onChange={(e) => setPlacementForm((f) => ({ ...f, placedRole: e.target.value }))}
                  placeholder="e.g. Software Engineer, Analyst"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Package (₹ per annum)</label>
                <input
                  type="number"
                  value={placementForm.placedSalary}
                  onChange={(e) => setPlacementForm((f) => ({ ...f, placedSalary: e.target.value }))}
                  placeholder="e.g. 600000 for ₹6L"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPlacingStudent(null)}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePlacement}
                disabled={placingSaving || !placementForm.placedCompany}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-70"
              >
                {placingSaving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
                {placingSaving ? 'Saving...' : 'Confirm Placement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
