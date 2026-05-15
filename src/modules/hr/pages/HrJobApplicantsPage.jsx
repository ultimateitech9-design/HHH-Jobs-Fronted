import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiClock,
  FiMessageSquare,
  FiVideo,
  FiMapPin,
  FiCalendar,
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
  createHrInterview,
  getApplicantsForJob,
  getHrJobs,
  updateApplicationStatus
} from '../services/hrApi';

const APPLICATION_STATUS_OPTIONS = ['applied', 'shortlisted', 'interviewed', 'offered', 'rejected', 'hired'];

const defaultInterviewDraft = {
  scheduledAt: '',
  mode: 'virtual',
  meetingLink: '',
  location: '',
  note: ''
};

const getStatusColor = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'applied': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'shortlisted': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'interviewed': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'offered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'hired': return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const getApplicationId = (application = {}) => application.id || application._id || '';

const HrJobApplicantsPage = () => {
  const { jobId } = useParams();
  const [state, setState] = useState({ loading: true, error: '', applicants: [], jobs: [] });
  const [message, setMessage] = useState('');
  const [activeApplicantId, setActiveApplicantId] = useState(null);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [notesDrafts, setNotesDrafts] = useState({});
  const [interviewDrafts, setInterviewDrafts] = useState({});
  const [interviewInlineErrors, setInterviewInlineErrors] = useState({});
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
      const nextInterview = {};

      applicants.forEach((item) => {
        const applicationId = getApplicationId(item);
        if (!applicationId) return;
        nextStatus[applicationId] = item.status || 'applied';
        nextNotes[applicationId] = item.hrNotes || '';
        nextInterview[applicationId] = { ...defaultInterviewDraft };
      });

      setStatusDrafts(nextStatus);
      setNotesDrafts(nextNotes);
      setInterviewDrafts(nextInterview);

      if (applicants.length > 0) {
        setActiveApplicantId(getApplicationId(applicants[0]));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [jobId]);

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
    const status = statusDrafts[applicationId] || 'applied';
    const hrNotes = notesDrafts[applicationId] || '';

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

  const scheduleInterview = async (applicationId) => {
    setMessage('');
    setInterviewInlineErrors((current) => ({ ...current, [applicationId]: '' }));
    const interview = interviewDrafts[applicationId] || defaultInterviewDraft;

    if (!interview.scheduledAt) {
      setInterviewInlineErrors((current) => ({
        ...current,
        [applicationId]: 'Please choose interview date and time.'
      }));
      return;
    }

    try {
      await createHrInterview({ applicationId, ...interview });
      setInterviewDrafts((current) => ({
        ...current,
        [applicationId]: { ...defaultInterviewDraft }
      }));
      showMessage('Interview scheduled successfully.');

      if (statusDrafts[applicationId] !== 'interviewed' && statusDrafts[applicationId] !== 'hired' && statusDrafts[applicationId] !== 'offered') {
        setStatusDrafts(prev => ({ ...prev, [applicationId]: 'interviewed' }));
        updateStatus(applicationId);
      }
    } catch (error) {
      showMessage(String(error.message || 'Unable to schedule interview.'));
    }
  };

  const setInterviewField = (applicationId, key, value) => {
    setInterviewDrafts((current) => ({
      ...current,
      [applicationId]: { ...(current[applicationId] || defaultInterviewDraft), [key]: value }
    }));

    if (key === 'scheduledAt' || key === 'mode') {
      setInterviewInlineErrors((current) => ({ ...current, [applicationId]: '' }));
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

  return (
    <div className="space-y-6 pb-10 h-full flex flex-col min-h-[calc(100vh-8rem)]">

      <header className="shrink-0 flex items-center justify-between bg-white p-4 md:p-6 rounded-[2rem] border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/portal/hr/jobs" className="w-10 h-10 bg-neutral-50 text-neutral-500 rounded-full flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-colors shrink-0">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-primary truncate max-w-sm md:max-w-xl">{targetJob?.jobTitle || 'Loading Job...'}</h1>
              {targetJob && <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">{targetJob.employmentType || 'Full-Time'}</span>}
            </div>
            <p className="text-sm font-bold text-neutral-400">
              Reviewing {state.applicants.length} {state.applicants.length === 1 ? 'applicant' : 'applicants'} pipeline
            </p>
          </div>
        </div>
        {!state.loading && state.applicants.length > 0 && (
          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 text-neutral-700 font-bold rounded-xl hover:bg-neutral-100 transition-colors border border-neutral-200 text-sm shrink-0"
          >
            <FiDownload size={15} /> Export CSV
          </button>
        )}
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
          <div className="w-full md:w-1/3 flex flex-col bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-hidden shrink-0">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-bold text-primary hover:text-brand-600 transition-colors"
              >
                {allSelected ? <FiCheckSquare size={16} className="text-brand-600" /> : someSelected ? <FiCheckSquare size={16} className="text-brand-300" /> : <FiSquare size={16} />}
                Applications ({state.applicants.length})
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs font-bold text-brand-600">{selectedIds.size} selected</span>
              )}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="p-3 bg-brand-50 border-b border-brand-100 flex items-center gap-2 animate-fade-in">
                <FiUsers size={14} className="text-brand-600 shrink-0" />
                <span className="text-xs font-bold text-brand-700 flex-1">{selectedIds.size} selected</span>
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

            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
              {state.applicants.map(app => {
                const applicationId = getApplicationId(app);
                const isActive = activeApplicantId === applicationId;
                const isSelected = selectedIds.has(applicationId);
                const name = app.applicant?.name || app.applicantEmail || 'Candidate';
                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <div key={applicationId} className="flex items-start gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(applicationId); }}
                      className={`mt-3.5 p-1 rounded transition-colors shrink-0 ${isSelected ? 'text-brand-600' : 'text-neutral-300 hover:text-neutral-500'}`}
                    >
                      {isSelected ? <FiCheckSquare size={15} /> : <FiSquare size={15} />}
                    </button>
                    <button
                      onClick={() => setActiveApplicantId(applicationId)}
                      className={`flex-1 text-left p-3 rounded-xl transition-all flex items-start gap-3 ${isActive ? 'bg-brand-50 border border-brand-200 shadow-sm' : 'hover:bg-neutral-50 border border-transparent'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${isActive ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`font-bold truncate ${isActive ? 'text-brand-700' : 'text-primary'}`}>{name}</h4>
                        <div className="mt-1 flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(app.status)}`}>
                            {app.status || 'Applied'}
                          </span>
                          <span className="text-xs text-neutral-400 font-bold">
                            {new Date(app.createdAt || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
          <div className="flex-1 bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-y-auto custom-scrollbar flex flex-col">
            {activeApplicant ? (
              <div className="p-6 md:p-8 animate-fade-in flex flex-col min-h-full">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-neutral-100 pb-8">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 border border-brand-200 rounded-2xl flex items-center justify-center text-xl font-black shrink-0">
                      {activeApplicant.applicant?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CA'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-primary mb-2">
                        {activeApplicant.applicant?.name || activeApplicant.applicantEmail || 'Candidate Profile'}
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-neutral-500">
                        <span className="flex items-center gap-1.5"><FiMail /> {activeApplicant.applicant?.email || activeApplicant.applicantEmail || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><FiPhone /> {activeApplicant.applicant?.mobile || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {activeApplicantResumeUrl && (
                    <a
                      href={activeApplicantResumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors shadow-sm shrink-0"
                    >
                      <FiFileText /> Open Resume
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">

                  {/* Status & Notes */}
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-neutral-200">
                      <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        <FiFileText className="text-brand-500" /> Cover Letter
                      </h3>
                      {activeApplicantCoverLetter ? (
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-7 text-neutral-700 whitespace-pre-wrap">
                          {activeApplicantCoverLetter}
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-neutral-500">No cover letter was submitted with this application.</p>
                      )}
                    </div>

                    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                      <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        <FiCheckCircle className="text-brand-500" /> Application Status
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-neutral-700">Current Stage</label>
                          <select
                            value={statusDrafts[activeApplicant.id] || 'applied'}
                            onChange={(e) => {
                              setStatusDrafts({ ...statusDrafts, [activeApplicant.id]: e.target.value });
                              setStatusInlineMessages((current) => ({ ...current, [activeApplicant.id]: null }));
                            }}
                            className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-primary capitalize"
                          >
                            {APPLICATION_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-neutral-700">Internal HR Notes</label>
                          <textarea
                            rows={4}
                            placeholder="Add evaluation notes, salary expectations, etc. hidden from candidate."
                            value={notesDrafts[activeApplicant.id] || ''}
                            onChange={(e) => {
                              setNotesDrafts({ ...notesDrafts, [activeApplicant.id]: e.target.value });
                              setStatusInlineMessages((current) => ({ ...current, [activeApplicant.id]: null }));
                            }}
                            className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm text-neutral-700 resize-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => updateStatus(activeApplicant.id)}
                          className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-500 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                          <FiCheck /> Save Evaluation
                        </button>
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

                  {/* Interview Scheduling */}
                  <div className="space-y-6">
                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                      <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <FiVideo className="text-purple-600" /> Schedule Interview
                      </h3>

                      {(() => {
                        const interview = interviewDrafts[activeApplicant.id] || defaultInterviewDraft;
                        const interviewInlineError = interviewInlineErrors[activeApplicant.id] || '';
                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                <label className="text-sm font-bold text-purple-900/70">Date & Time</label>
                                <div className="relative">
                                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                                  <input
                                    type="datetime-local"
                                    value={interview.scheduledAt}
                                    onChange={(e) => setInterviewField(activeApplicant.id, 'scheduledAt', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-sm text-purple-900"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                <label className="text-sm font-bold text-purple-900/70">Format</label>
                                <select
                                  value={interview.mode}
                                  onChange={(e) => setInterviewField(activeApplicant.id, 'mode', e.target.value)}
                                  className="w-full px-3 py-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-purple-900 text-sm"
                                >
                                  <option value="virtual">Virtual (Video)</option>
                                  <option value="phone">Phone Screening</option>
                                  <option value="onsite">On-Site / Office</option>
                                </select>
                              </div>
                            </div>

                            {(interview.mode === 'virtual' || interview.mode === 'phone') && (
                              <div className="space-y-1.5">
                                <label className="text-sm font-bold text-purple-900/70">Meeting Link / Phone No.</label>
                                <input
                                  value={interview.meetingLink}
                                  placeholder={interview.mode === 'virtual' ? 'https://meet.google.com/...' : '+91 9876543210'}
                                  onChange={(e) => setInterviewField(activeApplicant.id, 'meetingLink', e.target.value)}
                                  className="w-full px-4 py-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-sm"
                                />
                              </div>
                            )}

                            {interview.mode === 'onsite' && (
                              <div className="space-y-1.5">
                                <label className="text-sm font-bold text-purple-900/70">Office Location</label>
                                <div className="relative">
                                  <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                                  <input
                                    value={interview.location}
                                    placeholder="Full office address"
                                    onChange={(e) => setInterviewField(activeApplicant.id, 'location', e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-sm"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <label className="text-sm font-bold text-purple-900/70">Message to Candidate</label>
                              <div className="relative">
                                <FiMessageSquare className="absolute left-3 top-3 text-purple-400" />
                                <textarea
                                  rows={2}
                                  placeholder="E.g., Please prepare a portfolio presentation."
                                  value={interview.note}
                                  onChange={(e) => setInterviewField(activeApplicant.id, 'note', e.target.value)}
                                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-sm resize-none"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => scheduleInterview(activeApplicant.id)}
                              className="w-full py-3 bg-[#c97c09] text-white font-bold rounded-xl hover:bg-[#b86f07] transition-colors shadow-sm border border-[#c97c09] flex items-center justify-center gap-2"
                            >
                              <FiClock /> Schedule Invite
                            </button>
                            {interviewInlineError ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                                {interviewInlineError}
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
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
