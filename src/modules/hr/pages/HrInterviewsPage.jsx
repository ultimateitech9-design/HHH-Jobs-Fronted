import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiInfo,
  FiMonitor,
  FiStar,
  FiUsers,
  FiVideo
} from 'react-icons/fi';
import {
  createHrInterview,
  formatDateTime,
  getApplicantsForJob,
  getHrInterviews,
  getHrJobs,
  updateHrInterview
} from '../services/hrApi';

const defaultInterviewForm = {
  jobId: '',
  applicationId: '',
  title: '',
  roundLabel: 'Technical Round',
  scheduledAt: '',
  durationMinutes: 45,
  timezone: 'Asia/Kolkata',
  mode: 'virtual',
  meetingLink: '',
  location: '',
  note: '',
  calendarProvider: 'google',
  candidateConsentRequired: true,
  panelMode: false,
  panelMembersInput: ''
};

const parsePanelMembersInput = (value = '') =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      name: item.includes('<') ? item.split('<')[0].trim() : item,
      email: item.includes('<') && item.includes('>') ? item.slice(item.indexOf('<') + 1, item.indexOf('>')).trim() : ''
    }));

const getStatusBadge = (status) => {
  const normalized = String(status || 'scheduled').toLowerCase();
  if (normalized === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'cancelled') return 'border-red-200 bg-red-50 text-red-700';
  if (normalized === 'no_show') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
};

const HrInterviewsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [jobApplicants, setJobApplicants] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [state, setState] = useState({ loading: true, error: '', message: '' });
  const [form, setForm] = useState(defaultInterviewForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      const [jobsResponse, interviewsResponse] = await Promise.all([
        getHrJobs(),
        getHrInterviews()
      ]);

      if (!mounted) return;

      const jobsList = jobsResponse.data || [];
      const interviewList = (interviewsResponse.data || []).sort(
        (left, right) => new Date(right.scheduled_at || right.scheduledAt) - new Date(left.scheduled_at || left.scheduledAt)
      );

      setJobs(jobsList);
      setInterviews(interviewList);
      setState({
        loading: false,
        error: jobsResponse.error || interviewsResponse.error || '',
        message: ''
      });

      if (jobsList.length > 0) {
        setForm((current) => ({ ...current, jobId: current.jobId || jobsList[0].id || jobsList[0]._id }));
      }
    };

    loadInitial();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadApplicants = async () => {
      if (!form.jobId) {
        setJobApplicants([]);
        return;
      }

      const response = await getApplicantsForJob(form.jobId);
      if (!mounted) return;

      const applicants = response.data || [];
      setJobApplicants(applicants);
      setForm((current) => ({
        ...current,
        applicationId: current.applicationId || applicants[0]?.id || ''
      }));
    };

    loadApplicants();
    return () => { mounted = false; };
  }, [form.jobId]);

  const applicantOptions = useMemo(
    () => jobApplicants.map((item) => ({
      value: item.id,
      label: `${item.applicant?.name || item.applicantEmail || item.applicant_id} • ${item.status || 'applied'}`
    })),
    [jobApplicants]
  );

  const filteredInterviews = useMemo(() => interviews.filter((interview) => {
    const normalized = String(interview.status || 'scheduled').toLowerCase();
    if (activeTab === 'upcoming') return ['scheduled', 'rescheduled'].includes(normalized);
    if (activeTab === 'completed') return normalized === 'completed';
    return normalized === 'cancelled' || normalized === 'no_show';
  }), [activeTab, interviews]);

  const setMessage = (message, isError = false) => {
    setState((current) => ({ ...current, message, error: isError ? message : current.error }));
  };

  const handleCreateInterview = async (event) => {
    event.preventDefault();
    if (!form.applicationId || !form.scheduledAt) {
      setMessage('Application and time are required.', true);
      return;
    }

    setSaving(true);
    try {
      const created = await createHrInterview({
        ...form,
        panelMembers: parsePanelMembersInput(form.panelMembersInput)
      });
      setInterviews((current) => [created, ...current]);
      setState((current) => ({ ...current, message: 'Interview scheduled inside HHH Jobs.', error: '' }));
      setForm((current) => ({
        ...current,
        title: '',
        scheduledAt: '',
        note: '',
        panelMembersInput: ''
      }));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || 'Unable to schedule interview.' }));
    } finally {
      setSaving(false);
    }
  };

  const patchInterview = async (interviewId, payload, message) => {
    try {
      const updated = await updateHrInterview(interviewId, payload);
      setInterviews((current) => current.map((item) => (item.id === interviewId ? { ...item, ...updated } : item)));
      setState((current) => ({ ...current, error: '', message }));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || 'Unable to update interview.' }));
    }
  };

  const inputClass = 'mt-1 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 shadow-sm transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:outline-none';
  const labelClass = 'block text-[10px] font-semibold uppercase tracking-wide text-slate-500';

  const tabCounts = useMemo(() => ({
    upcoming: interviews.filter((i) => ['scheduled', 'rescheduled'].includes(String(i.status || 'scheduled').toLowerCase())).length,
    completed: interviews.filter((i) => String(i.status || '').toLowerCase() === 'completed').length,
    attention: interviews.filter((i) => ['cancelled', 'no_show'].includes(String(i.status || '').toLowerCase())).length
  }), [interviews]);

  return (
    <div className="space-y-5 pb-8">
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          {state.error}
        </div>
      )}
      {state.message && !state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-medium text-emerald-700">
          <FiCheckCircle size={14} className="shrink-0" />
          {state.message}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Schedule Form */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm self-start">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <h2 className="text-[13px] font-bold text-slate-900">Schedule Interview</h2>
            <p className="text-[10px] text-slate-400">Video room &middot; recording &middot; transcript</p>
          </div>

          <form onSubmit={handleCreateInterview} className="space-y-2.5 px-4 py-3">
            <div>
              <label className={labelClass}>Job role</label>
              <select value={form.jobId} onChange={(event) => setForm((current) => ({ ...current, jobId: event.target.value, applicationId: '' }))} className={inputClass}>
                <option value="" disabled>Select a role</option>
                {jobs.map((job) => (
                  <option key={job.id || job._id} value={job.id || job._id}>{job.jobTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Candidate</label>
              <select value={form.applicationId} onChange={(event) => setForm((current) => ({ ...current, applicationId: event.target.value }))} className={inputClass}>
                {applicantOptions.length > 0 ? applicantOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                )) : <option value="">No applicants</option>}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Title</label>
                <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} placeholder="Optional" />
              </div>
              <div>
                <label className={labelClass}>Round</label>
                <input value={form.roundLabel} onChange={(event) => setForm((current) => ({ ...current, roundLabel: event.target.value }))} className={inputClass} placeholder="Technical" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Date &amp; time</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Duration (min)</label>
                <input type="number" min="15" max="180" value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value || 45) }))} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Mode</label>
                <select value={form.mode} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))} className={inputClass}>
                  <option value="virtual">Video room</option>
                  <option value="onsite">On-site</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Timezone</label>
                <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} className={inputClass} />
              </div>
            </div>

            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5">
                <input type="checkbox" checked={form.candidateConsentRequired} onChange={(event) => setForm((current) => ({ ...current, candidateConsentRequired: event.target.checked }))} className="h-3 w-3 rounded border-slate-300 text-indigo-600" />
                <span className="text-[10px] font-medium text-slate-600">Consent</span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5">
                <input type="checkbox" checked={form.panelMode} onChange={(event) => setForm((current) => ({ ...current, panelMode: event.target.checked }))} className="h-3 w-3 rounded border-slate-300 text-indigo-600" />
                <span className="text-[10px] font-medium text-slate-600">Panel</span>
              </label>
            </div>

            {form.panelMode && (
              <div>
                <label className={labelClass}>Panel members</label>
                <input value={form.panelMembersInput} onChange={(event) => setForm((current) => ({ ...current, panelMembersInput: event.target.value }))} className={inputClass} placeholder="Name, Name <email>" />
              </div>
            )}

            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} rows={1} className={inputClass} placeholder="Agenda or prep notes" />
            </div>

            <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50">
              <FiVideo size={12} />
              {saving ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </form>
        </div>

        {/* Interview Directory */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-[15px] font-bold text-slate-900">Interviews</h2>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {[
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'completed', label: 'Completed' },
                { key: 'attention', label: 'Attention' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab.label}
                  {tabCounts[tab.key] > 0 && (
                    <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${activeTab === tab.key ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {tabCounts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {state.loading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-64 animate-pulse rounded bg-slate-50" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredInterviews.length > 0 ? filteredInterviews.map((interview) => (
              <div key={interview.id} className="px-5 py-4 transition hover:bg-slate-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-600">
                      {(interview.candidate_name || 'C')[0].toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-semibold text-slate-900">{interview.title || interview.job_title || 'Interview'}</p>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(interview.status)}`}>
                          {interview.status || 'Scheduled'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-slate-500">
                        {interview.candidate_name || 'Candidate'} &middot; {interview.round_label || 'Interview'} &middot; {interview.company_name || 'HHH Jobs'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1"><FiClock size={11} /> {formatDateTime(interview.scheduled_at || interview.scheduledAt)}</span>
                        <span className="inline-flex items-center gap-1"><FiVideo size={11} /> {interview.mode === 'onsite' ? 'On-site' : interview.mode === 'phone' ? 'Phone' : 'Video room'}</span>
                        {interview.panel_mode && <span className="inline-flex items-center gap-1"><FiUsers size={11} /> Panel</span>}
                        {interview.candidate_recording_consent && <span className="inline-flex items-center gap-1"><FiStar size={11} /> Consent given</span>}
                      </div>
                      {interview.note && (
                        <p className="mt-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-500">{interview.note}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link to={`/portal/hr/interviews/${interview.id}/room`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800">
                      <FiMonitor size={12} /> Open
                    </Link>
                    {interview.calendar_event_url && (
                      <a href={interview.calendar_event_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
                        <FiCalendar size={12} />
                      </a>
                    )}
                    <button type="button" onClick={() => patchInterview(interview.id, { status: 'completed' }, 'Interview marked completed.')} className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 transition hover:bg-emerald-100" title="Mark complete">
                      <FiCheckCircle size={14} />
                    </button>
                    <button type="button" onClick={() => patchInterview(interview.id, { status: 'cancelled' }, 'Interview cancelled.')} className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100" title="Cancel interview">
                      <FiInfo size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-5 py-16 text-center">
                <FiCalendar className="mx-auto text-slate-300" size={32} />
                <p className="mt-3 text-[14px] font-semibold text-slate-500">No {activeTab} interviews</p>
                <p className="mt-1 text-[12px] text-slate-400">
                  {activeTab === 'upcoming' ? 'Schedule an interview using the form on the left.' : activeTab === 'completed' ? 'Completed interviews will appear here.' : 'Cancelled or no-show interviews will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HrInterviewsPage;
