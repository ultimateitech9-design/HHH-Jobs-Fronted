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

  return (
    <div className="space-y-6 pb-8">
      {state.error ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</div>
      ) : null}
      {state.message && !state.error ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{state.message}</div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.42)]">
          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-700">
              Video interview
            </span>
            <h1 className="text-2xl font-extrabold leading-tight text-navy">Schedule inside HHH Jobs</h1>
            <p className="text-sm leading-6 text-slate-500">
              Launch the full in-app room with consent, transcript, whiteboard, code editor, live notes, and stored recruiter ratings.
            </p>
          </div>

          <form onSubmit={handleCreateInterview} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Job</label>
              <select value={form.jobId} onChange={(event) => setForm((current) => ({ ...current, jobId: event.target.value, applicationId: '' }))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <option value="" disabled>Select a role</option>
                {jobs.map((job) => (
                  <option key={job.id || job._id} value={job.id || job._id}>{job.jobTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Candidate</label>
              <select value={form.applicationId} onChange={(event) => setForm((current) => ({ ...current, applicationId: event.target.value }))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {applicantOptions.length > 0 ? applicantOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                )) : <option value="">No applicants available</option>}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">Interview title</label>
                <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" placeholder="Optional custom title" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Round label</label>
                <input value={form.roundLabel} onChange={(event) => setForm((current) => ({ ...current, roundLabel: event.target.value }))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" placeholder="Technical / Managerial / Final" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">Start time</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Duration</label>
                <input type="number" min="15" max="180" value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value || 45) }))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">Mode</label>
                <select value={form.mode} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <option value="virtual">HHH video room</option>
                  <option value="onsite">On-site</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Timezone</label>
                <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <input type="checkbox" checked={form.candidateConsentRequired} onChange={(event) => setForm((current) => ({ ...current, candidateConsentRequired: event.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" />
                <span>
                  <span className="block font-bold text-slate-700">Record with consent</span>
                  <span className="mt-1 block text-xs">Require candidate approval for recording and AI transcript.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <input type="checkbox" checked={form.panelMode} onChange={(event) => setForm((current) => ({ ...current, panelMode: event.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" />
                <span>
                  <span className="block font-bold text-slate-700">Panel mode</span>
                  <span className="mt-1 block text-xs">Track multiple interviewers and group-round context.</span>
                </span>
              </label>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Panel members</label>
              <input value={form.panelMembersInput} onChange={(event) => setForm((current) => ({ ...current, panelMembersInput: event.target.value }))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" placeholder="Rahul, Priya <priya@company.com>" />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Interview notes</label>
              <textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} rows={4} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" placeholder="Prep prompts, agenda, or role-specific guidance." />
            </div>

            <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-[#2d5bff] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(45,91,255,0.28)]">
              {saving ? 'Scheduling…' : 'Schedule interview room'}
            </button>
          </form>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.42)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[34rem]">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Interview directory
              </span>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight text-navy">Upcoming rooms and completed rounds</h2>
            </div>
            <div className="flex w-full max-w-full shrink-0 overflow-x-auto rounded-full border border-slate-200 bg-slate-50 p-1 sm:w-auto">
              {['upcoming', 'completed', 'attention'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`min-w-[88px] whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold capitalize ${activeTab === tab ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {state.loading ? (
              [1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-[1.8rem] bg-slate-100" />)
            ) : filteredInterviews.length > 0 ? filteredInterviews.map((interview) => (
              <article key={interview.id} className="rounded-[1.7rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${getStatusBadge(interview.status)}`}>
                        {interview.status || 'Scheduled'}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {interview.room_status || 'scheduled'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-navy">{interview.title || interview.job_title || 'Interview room'}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {interview.candidate_name || 'Candidate'} • {interview.company_name || 'HHH Jobs'} • {interview.round_label || 'Interview'}
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <p className="flex items-center gap-2 font-bold text-slate-700"><FiClock /> Timing</p>
                        <p className="mt-2">{formatDateTime(interview.scheduled_at || interview.scheduledAt)}</p>
                      </div>
                      <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <p className="flex items-center gap-2 font-bold text-slate-700"><FiVideo /> Room tools</p>
                        <p className="mt-2">Video, transcript, whiteboard, code editor</p>
                      </div>
                      <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <p className="flex items-center gap-2 font-bold text-slate-700"><FiUsers /> Panel + consent</p>
                        <p className="mt-2">{interview.panel_mode ? 'Panel mode on' : 'Single interviewer'} • {interview.candidate_recording_consent ? 'consented' : 'awaiting consent'}</p>
                      </div>
                    </div>
                    {interview.note ? (
                      <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        <p className="flex items-center gap-2 font-bold text-slate-700"><FiFileText /> Notes</p>
                        <p className="mt-2">{interview.note}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex min-w-[240px] flex-col gap-3">
                    <Link to={`/portal/hr/interviews/${interview.id}/room`} className="inline-flex items-center justify-center gap-2 rounded-[1.1rem] bg-[#0f172a] px-4 py-3 text-sm font-bold text-white">
                      <FiMonitor />
                      Open room
                    </Link>
                    {interview.calendar_event_url ? (
                      <a href={interview.calendar_event_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                        <FiCalendar />
                        Calendar
                      </a>
                    ) : null}
                    <button type="button" onClick={() => patchInterview(interview.id, { status: 'completed' }, 'Interview marked completed.')} className="inline-flex items-center justify-center gap-2 rounded-[1.1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                      <FiCheckCircle />
                      Complete
                    </button>
                    <button type="button" onClick={() => patchInterview(interview.id, { status: 'cancelled' }, 'Interview cancelled.')} className="inline-flex items-center justify-center gap-2 rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                      <FiInfo />
                      Cancel
                    </button>
                  </div>
                </div>
              </article>
            )) : (
              <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
                  <FiCalendar size={24} />
                </div>
                <h3 className="mt-4 text-2xl font-extrabold text-navy">No interviews in this view</h3>
                <p className="mt-2 text-sm text-slate-500">Scheduled rooms, completed rounds, and no-show tracking will appear here.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};

export default HrInterviewsPage;
