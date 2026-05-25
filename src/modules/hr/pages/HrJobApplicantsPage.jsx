import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiCheck,
  FiSquare,
  FiCheckSquare,
  FiDownload,
  FiUsers,
  FiAlertCircle
} from 'react-icons/fi';
import {
  bulkUpdateApplications,
  getApplicantsForJob,
  getHrJobs,
  updateApplicationStatus
} from '../services/hrApi';

const APPLICATION_STATUS_OPTIONS = ['shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'rejected', 'hired'];

const getStatusColor = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'applied': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'shortlisted': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'interview_scheduled': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'interviewed': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'offered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'hired': return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const getStatusLabel = (status = '') => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'interview_scheduled') return 'Interview Scheduled';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getApplicationId = (application = {}) => application.id || application._id || '';

const HrJobApplicantsPage = () => {
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedApplicationId = searchParams.get('applicationId') || '';
  const [state, setState] = useState({ loading: true, error: '', applicants: [], jobs: [] });
  const [message, setMessage] = useState('');
  const [activeApplicantId, setActiveApplicantId] = useState(null);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [notesDrafts, setNotesDrafts] = useState({});
  const [statusInlineMessages, setStatusInlineMessages] = useState({});

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [applicantsRes, jobsRes] = await Promise.all([
        getApplicantsForJob(jobId),
        getHrJobs()
      ]);

      if (!mounted) return;

      const applicants = applicantsRes.data || [];

      setState({
        loading: false,
        error: applicantsRes.error || jobsRes.error || '',
        applicants,
        jobs: jobsRes.data || []
      });

      const nextStatus = {};
      const nextNotes = {};

      applicants.forEach((item) => {
        const applicationId = getApplicationId(item);
        if (!applicationId) return;
        nextStatus[applicationId] = item.status || 'applied';
        nextNotes[applicationId] = item.hrNotes || '';
      });

      setStatusDrafts(nextStatus);
      setNotesDrafts(nextNotes);

      if (applicants.length > 0) {
        const requestedApplicant = applicants.find((item) => getApplicationId(item) === requestedApplicationId);
        setActiveApplicantId(getApplicationId(requestedApplicant || applicants[0]));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [jobId, requestedApplicationId]);

  const targetJob = useMemo(() => state.jobs.find((job) => (job.id || job._id) === jobId), [state.jobs, jobId]);
  const activeApplicant = useMemo(
    () => state.applicants.find((application) => getApplicationId(application) === activeApplicantId),
    [state.applicants, activeApplicantId]
  );

  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }, []);

  const updateStatus = async (applicationId) => {
    setMessage('');
    setStatusInlineMessages((current) => ({ ...current, [applicationId]: null }));
    const status = statusDrafts[applicationId] || '';
    const hrNotes = notesDrafts[applicationId] || '';

    if (!APPLICATION_STATUS_OPTIONS.includes(status)) {
      setStatusInlineMessages((current) => ({
        ...current,
        [applicationId]: { type: 'error', text: 'Choose the next stage before saving.' }
      }));
      return;
    }

    try {
      const updated = await updateApplicationStatus({ applicationId, status, hrNotes });
      setState((current) => ({
        ...current,
        applicants: current.applicants.map((item) =>
          item.id === applicationId ? { ...item, ...updated, status, hrNotes } : item
        )
      }));
      setStatusInlineMessages((current) => ({
        ...current,
        [applicationId]: { type: 'success', text: 'Application status updated successfully.' }
      }));
    } catch (error) {
      setStatusInlineMessages((current) => ({
        ...current,
        [applicationId]: { type: 'error', text: String(error.message || 'Unable to update status.') }
      }));
    }
  };

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === state.applicants.length) return new Set();
      return new Set(state.applicants.map(a => a.id));
    });
  }, [state.applicants]);

  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    const selectedApplicationIds = Array.from(selectedIds).filter(Boolean);
    if (selectedApplicationIds.length === 0) {
      showMessage('Please select valid applications first.');
      return;
    }

    setBulkProcessing(true);
    setMessage('');

    const result = await bulkUpdateApplications({
      jobId,
      applicationIds: selectedApplicationIds,
      action
    });

    if (result.error) {
      showMessage(`Bulk action failed: ${result.error}`);
    } else {
      const newStatus = action === 'shortlist' ? 'shortlisted' : 'rejected';
      setState((current) => ({
        ...current,
        applicants: current.applicants.map((app) =>
          selectedApplicationIds.includes(getApplicationId(app)) ? { ...app, status: newStatus } : app
        )
      }));
      setStatusDrafts((prev) => {
        const next = { ...prev };
        selectedApplicationIds.forEach((id) => {
          next[id] = newStatus;
        });
        return next;
      });
      setSelectedIds(new Set());
      showMessage(`${result.data?.updatedCount || selectedApplicationIds.length} applications moved to ${newStatus}.`);
    }

    setBulkProcessing(false);
  };

  const exportToCsv = useCallback(() => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Status', 'Applied At']
    ];
    state.applicants.forEach(app => {
      rows.push([
        app.applicant?.name || app.applicantEmail || '',
        app.applicant?.email || app.applicantEmail || '',
        app.applicant?.mobile || '',
        app.status || '',
        new Date(app.createdAt || '').toLocaleDateString()
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applicants-${jobId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.applicants, jobId]);

  const allSelected = state.applicants.length > 0 && selectedIds.size === state.applicants.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const activeApplicantResumeUrl =
    activeApplicant?.resumeUrl
    || activeApplicant?.applicant?.resumeUrl
    || activeApplicant?.applicant?.resume_url
    || '';
  const activeApplicantCoverLetter = String(activeApplicant?.coverLetter || '').trim();
  const statusSummary = useMemo(() => {
    const summary = {
      total: state.applicants.length,
      interview: 0,
      selected: 0,
      rejected: 0
    };

    state.applicants.forEach((app) => {
      const status = String(app.status || '').toLowerCase();
      if (status === 'interview_scheduled' || status === 'interviewed') summary.interview += 1;
      if (status === 'hired' || status === 'offered') summary.selected += 1;
      if (status === 'rejected') summary.rejected += 1;
    });

    return summary;
  }, [state.applicants]);

  return (
    <div className="space-y-5 pb-10 h-full flex flex-col min-h-[calc(100vh-8rem)]">

      <header className="shrink-0 overflow-hidden rounded-[1.75rem] border border-amber-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex min-w-0 items-center gap-4">
          <Link to="/portal/hr/jobs" className="w-11 h-11 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center hover:bg-amber-100 hover:text-amber-800 transition-colors shrink-0">
            <FiArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-950 truncate max-w-sm md:max-w-xl">{targetJob?.jobTitle || 'Loading Job...'}</h1>
              {targetJob && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">{targetJob.employmentType || 'Full-Time'}</span>}
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Reviewing {state.applicants.length} {state.applicants.length === 1 ? 'applicant' : 'applicants'} pipeline
            </p>
          </div>
        </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Applicants', value: statusSummary.total, tone: 'border-slate-200 bg-slate-50 text-slate-700' },
              { label: 'Interviews', value: statusSummary.interview, tone: 'border-violet-200 bg-violet-50 text-violet-700' },
              { label: 'Selected', value: statusSummary.selected, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
              { label: 'Rejected', value: statusSummary.rejected, tone: 'border-red-200 bg-red-50 text-red-700' }
            ].map((item) => (
              <span key={item.label} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${item.tone}`}>
                {item.value} {item.label}
              </span>
            ))}
            {!state.loading && state.applicants.length > 0 && (
              <button
                onClick={exportToCsv}
                className="ml-0 flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:bg-amber-50 md:ml-2"
              >
                <FiDownload size={15} /> Export CSV
              </button>
            )}
          </div>
        </div>
      </header>

      {state.error && (
        <div className="shrink-0 bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-200 shadow-sm animate-fade-in">
          <FiXCircle size={20} className="shrink-0" /> <span className="font-semibold">{state.error}</span>
        </div>
      )}
      {message && !state.error && (
        <div className={`shrink-0 p-4 rounded-2xl flex items-center gap-3 border shadow-sm animate-fade-in transition-all ${message.includes('Unable') || message.includes('failed') ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {message.includes('Unable') || message.includes('failed') ? <FiAlertCircle size={20} className="shrink-0" /> : <FiCheckCircle size={20} className="shrink-0" />}
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {state.loading ? (
        <div className="flex-1 bg-white rounded-[2rem] border border-neutral-100 animate-pulse flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      ) : state.applicants.length > 0 ? (
        <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0">

          {/* Left Side: Applicant List */}
          <div className="w-full md:w-[320px] xl:w-[340px] flex flex-col bg-white rounded-[1.25rem] border border-slate-200 shadow-sm overflow-hidden shrink-0">
            <div className="px-3.5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-black text-slate-900 hover:text-amber-700 transition-colors"
              >
                {allSelected ? <FiCheckSquare size={16} className="text-amber-700" /> : someSelected ? <FiCheckSquare size={16} className="text-amber-400" /> : <FiSquare size={16} />}
                Applications ({state.applicants.length})
              </button>
              {selectedIds.size > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">{selectedIds.size} selected</span>
              )}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2 animate-fade-in">
                <FiUsers size={14} className="text-amber-700 shrink-0" />
                <span className="text-xs font-bold text-amber-800 flex-1">{selectedIds.size} selected</span>
                <button
                  onClick={() => handleBulkAction('shortlist')}
                  disabled={bulkProcessing}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors text-xs disabled:opacity-50"
                >
                  {bulkProcessing ? '...' : 'Shortlist All'}
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={bulkProcessing}
                  className="px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-xs disabled:opacity-50"
                >
                  {bulkProcessing ? '...' : 'Reject All'}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2 py-1.5 text-neutral-500 hover:text-neutral-700 text-xs font-bold"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="overflow-y-auto flex-1 p-2 space-y-1.5 custom-scrollbar">
              {state.applicants.map(app => {
                const applicationId = getApplicationId(app);
                const isActive = activeApplicantId === applicationId;
                const isSelected = selectedIds.has(applicationId);
                const name = app.applicant?.name || app.applicantEmail || 'Candidate';
                const email = app.applicant?.email || app.applicantEmail || 'No email';
                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <div key={applicationId} className="flex items-start gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(applicationId); }}
                      className={`mt-3 p-1 rounded transition-colors shrink-0 ${isSelected ? 'text-amber-700' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      {isSelected ? <FiCheckSquare size={14} /> : <FiSquare size={14} />}
                    </button>
                    <button
                      onClick={() => setActiveApplicantId(applicationId)}
                      className={`flex-1 text-left px-2.5 py-2.5 rounded-xl transition-all flex items-start gap-2.5 ${isActive ? 'bg-amber-50 border border-amber-200 shadow-sm ring-1 ring-amber-100' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${isActive ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-black truncate ${isActive ? 'text-amber-800' : 'text-slate-900'}`}>{name}</h4>
                          <span className="text-[11px] text-slate-400 font-bold shrink-0">
                            {new Date(app.createdAt || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="truncate text-[11px] font-medium text-slate-500">{email}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase border ${getStatusColor(app.status)}`}>
                            {getStatusLabel(app.status || 'applied')}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Active Applicant Details */}
          <div className="flex-1 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-y-auto custom-scrollbar flex flex-col">
            {activeApplicant ? (
              <div className="p-5 md:p-7 animate-fade-in flex flex-col min-h-full">
                <div className="mb-6 rounded-[1.35rem] border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-slate-50 p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-amber-50 text-amber-800 border border-amber-200 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-sm">
                      {activeApplicant.applicant?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CA'}
                    </div>
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black tracking-tight text-slate-950">
                        {activeApplicant.applicant?.name || activeApplicant.applicantEmail || 'Candidate Profile'}
                      </h2>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${getStatusColor(activeApplicant.status || 'applied')}`}>
                          {getStatusLabel(activeApplicant.status || 'applied')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5"><FiMail /> {activeApplicant.applicant?.email || activeApplicant.applicantEmail || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><FiPhone /> {activeApplicant.applicant?.mobile || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={APPLICATION_STATUS_OPTIONS.includes(statusDrafts[activeApplicant.id]) ? statusDrafts[activeApplicant.id] : ''}
                      onChange={(e) => {
                        setStatusDrafts({ ...statusDrafts, [activeApplicant.id]: e.target.value });
                        setStatusInlineMessages((current) => ({ ...current, [activeApplicant.id]: null }));
                      }}
                      className="h-11 min-w-[190px] rounded-xl border border-amber-200 bg-white px-3 text-sm font-bold capitalize text-slate-900 shadow-sm focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="" disabled>Choose next stage</option>
                      {APPLICATION_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{getStatusLabel(status)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateStatus(activeApplicant.id)}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                      <FiCheck /> Save
                    </button>
                    {activeApplicantResumeUrl && (
                      <a
                        href={activeApplicantResumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 items-center justify-center gap-2 px-5 bg-slate-950 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm shrink-0"
                      >
                        <FiFileText /> Open Resume
                      </a>
                    )}
                  </div>
                </div>
                </div>

                <div className="grid grid-cols-1 gap-5 flex-1">

                  {/* Status & Notes */}
                  <div className="space-y-5">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-black text-slate-950 mb-4 flex items-center gap-2">
                        <FiFileText className="text-amber-600" /> Cover Letter
                      </h3>
                      {activeApplicantCoverLetter ? (
                        <div className="max-h-[360px] overflow-y-auto rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-4 text-sm leading-7 text-slate-700 whitespace-pre-wrap custom-scrollbar">
                          {activeApplicantCoverLetter}
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-slate-500">No cover letter was submitted with this application.</p>
                      )}
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-black text-slate-950 mb-4 flex items-center gap-2">
                        <FiCheckCircle className="text-emerald-600" /> Internal HR Notes
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <textarea
                            rows={4}
                            placeholder="Add evaluation notes, salary expectations, etc. hidden from candidate."
                            value={notesDrafts[activeApplicant.id] || ''}
                            onChange={(e) => {
                              setNotesDrafts({ ...notesDrafts, [activeApplicant.id]: e.target.value });
                              setStatusInlineMessages((current) => ({ ...current, [activeApplicant.id]: null }));
                            }}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium text-sm text-slate-700 resize-none"
                          />
                        </div>
                        {statusInlineMessages[activeApplicant.id]?.text ? (
                          <div
                            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${statusInlineMessages[activeApplicant.id]?.type === 'error'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              }`}
                          >
                            {statusInlineMessages[activeApplicant.id]?.text}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : null}
          </div>

        </div>
      ) : (
        <div className="flex-1 bg-white rounded-[2rem] border border-neutral-100 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-24 h-24 bg-neutral-50 text-neutral-300 rounded-full flex items-center justify-center mb-6">
            <FiFileText size={40} />
          </div>
          <h3 className="text-2xl font-bold text-primary mb-2">No Applicants Yet</h3>
          <p className="text-neutral-500 max-w-sm">No one has applied to this job posting yet. Try editing the job to improve visibility or sharing it.</p>
        </div>
      )}

    </div>
  );
};

export default HrJobApplicantsPage;
