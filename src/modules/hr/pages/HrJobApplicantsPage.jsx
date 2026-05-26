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
const getApplicantGroup = (application = {}) => {
  const status = String(application.status || '').toLowerCase();
  if (status === 'interview_scheduled' || status === 'interviewed') return 'interview';
  if (status === 'hired' || status === 'offered') return 'selected';
  if (status === 'rejected') return 'rejected';
  return 'applicants';
};

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
  const [activeFilter, setActiveFilter] = useState('applicants');

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

  const visibleApplicants = useMemo(() => {
    if (activeFilter === 'applicants') return state.applicants;
    return state.applicants.filter((applicant) => getApplicantGroup(applicant) === activeFilter);
  }, [activeFilter, state.applicants]);

  useEffect(() => {
    setSelectedIds((current) => {
      const visibleIds = new Set(visibleApplicants.map((item) => getApplicationId(item)).filter(Boolean));
      return new Set(Array.from(current).filter((id) => visibleIds.has(id)));
    });

    if (!visibleApplicants.length) {
      setActiveApplicantId(null);
      return;
    }

    if (!visibleApplicants.some((item) => getApplicationId(item) === activeApplicantId)) {
      setActiveApplicantId(getApplicationId(visibleApplicants[0]));
    }
  }, [activeApplicantId, visibleApplicants]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const visibleIds = visibleApplicants.map((item) => getApplicationId(item)).filter(Boolean);
      if (visibleIds.length > 0 && visibleIds.every((id) => prev.has(id))) return new Set();
      return new Set(visibleIds);
    });
  }, [visibleApplicants]);

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
    visibleApplicants.forEach(app => {
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
    a.download = `${activeFilter}-${jobId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFilter, visibleApplicants, jobId]);

  const allSelected = visibleApplicants.length > 0 && visibleApplicants.every((item) => selectedIds.has(getApplicationId(item)));
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
    <div className="space-y-6 pb-12 h-full flex flex-col min-h-[calc(100vh-8rem)]">

      <header className="shrink-0">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 xl:max-w-[360px]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Job Applications</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-navy">{targetJob?.jobTitle || 'Loading Job...'}</h1>
              {targetJob && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-500">{targetJob.employmentType || 'Full-Time'}</span>}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Reviewing {state.applicants.length} {state.applicants.length === 1 ? 'applicant' : 'applicants'} across this hiring pipeline.
            </p>
          </div>

          <div className="flex w-full min-w-0 items-center gap-2 overflow-x-auto pb-1 xl:w-auto xl:shrink-0 xl:justify-end xl:overflow-visible xl:pb-0">
            <Link
              to="/portal/hr/jobs"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <FiArrowLeft size={14} /> Back To Jobs
            </Link>
            {[
              { key: 'applicants', label: 'Applicants', value: statusSummary.total, tone: 'border-slate-200 bg-slate-50 text-slate-700', activeTone: 'ring-slate-300' },
              { key: 'interview', label: 'Interviews', value: statusSummary.interview, tone: 'border-violet-200 bg-violet-50 text-violet-700', activeTone: 'ring-violet-300' },
              { key: 'selected', label: 'Selected', value: statusSummary.selected, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700', activeTone: 'ring-emerald-300' },
              { key: 'rejected', label: 'Rejected', value: statusSummary.rejected, tone: 'border-red-200 bg-red-50 text-red-700', activeTone: 'ring-red-300' }
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveFilter(item.key)}
                aria-pressed={activeFilter === item.key}
                className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition hover:-translate-y-px hover:shadow-sm ${item.tone} ${activeFilter === item.key ? `ring-2 ring-offset-1 ${item.activeTone}` : ''}`}
              >
                {item.value} {item.label}
              </button>
            ))}
            {!state.loading && state.applicants.length > 0 && (
              <button
                onClick={exportToCsv}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <FiDownload size={14} /> Export CSV
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
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">

          {/* Left Side: Applicant List */}
          <div className="w-full md:w-[320px] xl:w-[340px] flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-brand-700 transition-colors"
              >
                {allSelected ? <FiCheckSquare size={16} className="text-brand-700" /> : someSelected ? <FiCheckSquare size={16} className="text-brand-400" /> : <FiSquare size={16} />}
                Applications ({visibleApplicants.length})
              </button>
              {selectedIds.size > 0 && (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{selectedIds.size} selected</span>
              )}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 animate-fade-in">
                <FiUsers size={14} className="text-slate-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 flex-1">{selectedIds.size} selected</span>
                <button
                  onClick={() => handleBulkAction('shortlist')}
                  disabled={bulkProcessing}
                  className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {bulkProcessing ? '...' : 'Shortlist All'}
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={bulkProcessing}
                  className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
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

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 custom-scrollbar">
              {visibleApplicants.length > 0 ? visibleApplicants.map(app => {
                const applicationId = getApplicationId(app);
                const isActive = activeApplicantId === applicationId;
                const isSelected = selectedIds.has(applicationId);
                const name = app.applicant?.name || app.applicantEmail || 'Candidate';
                const email = app.applicant?.email || app.applicantEmail || 'No email';
                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <div key={applicationId} className="flex items-start gap-2 px-3 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(applicationId); }}
                      className={`mt-2 p-1 rounded transition-colors shrink-0 ${isSelected ? 'text-brand-700' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      {isSelected ? <FiCheckSquare size={14} /> : <FiSquare size={14} />}
                    </button>
                    <button
                      onClick={() => setActiveApplicantId(applicationId)}
                      className={`flex-1 text-left rounded-xl transition-colors flex items-start gap-2.5 ${isActive ? 'text-navy' : 'text-slate-600 hover:text-navy'
                        }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isActive ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-navy' : 'text-slate-900'}`}>{name}</h4>
                          <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                            {new Date(app.createdAt || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="truncate text-[11px] font-medium text-slate-500">{email}</p>
                        <div className="mt-1.5 flex items-center">
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${getStatusColor(app.status)}`}>
                            {getStatusLabel(app.status || 'applied')}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              }) : (
                <div className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
                  No {activeFilter === 'interview' ? 'interview' : activeFilter} applicants found.
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Active Applicant Details */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white overflow-y-auto custom-scrollbar flex flex-col">
            {activeApplicant ? (
              <div className="animate-fade-in flex flex-col min-h-full">
                <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="w-11 h-11 bg-slate-100 text-navy rounded-full flex items-center justify-center text-base font-bold shrink-0">
                      {activeApplicant.applicant?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CA'}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-bold tracking-tight text-navy">
                        {activeApplicant.applicant?.name || activeApplicant.applicantEmail || 'Candidate Profile'}
                      </h2>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${getStatusColor(activeApplicant.status || 'applied')}`}>
                          {getStatusLabel(activeApplicant.status || 'applied')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><FiMail size={14} className="text-slate-400" /> {activeApplicant.applicant?.email || activeApplicant.applicantEmail || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><FiPhone size={14} className="text-slate-400" /> {activeApplicant.applicant?.mobile || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <select
                      value={APPLICATION_STATUS_OPTIONS.includes(statusDrafts[activeApplicant.id]) ? statusDrafts[activeApplicant.id] : ''}
                      onChange={(e) => {
                        setStatusDrafts({ ...statusDrafts, [activeApplicant.id]: e.target.value });
                        setStatusInlineMessages((current) => ({ ...current, [activeApplicant.id]: null }));
                      }}
                      className="h-10 w-full min-w-[190px] rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold capitalize text-slate-700 focus:ring-2 focus:ring-brand-500 sm:w-[220px]"
                    >
                      <option value="" disabled>Choose next stage</option>
                      {APPLICATION_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{getStatusLabel(status)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateStatus(activeApplicant.id)}
                      className="inline-flex h-10 min-w-[88px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      <FiCheck /> Save
                    </button>
                    {activeApplicantResumeUrl && (
                      <a
                        href={activeApplicantResumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        <FiFileText /> Open Resume
                      </a>
                    )}
                  </div>
                </div>
                </div>

                <div className="grid grid-cols-1 flex-1 divide-y divide-slate-200">

                  {/* Status & Notes */}
                  <div>
                    <section className="px-5 py-5">
                      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-navy">
                        <FiFileText className="text-brand-600" /> Cover Letter
                      </h3>
                      {activeApplicantCoverLetter ? (
                        <div className="max-h-[320px] overflow-y-auto text-sm leading-7 text-slate-600 whitespace-pre-wrap custom-scrollbar">
                          {activeApplicantCoverLetter}
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-slate-500">No cover letter was submitted with this application.</p>
                      )}
                    </section>

                    <section className="px-5 py-5">
                      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-navy">
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
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 resize-none focus:ring-2 focus:ring-brand-500"
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
                    </section>
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
