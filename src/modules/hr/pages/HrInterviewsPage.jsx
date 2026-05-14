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
  fetchHrCampusDriveApplications,
  fetchHrCampusDrives,
  formatDateTime,
  getApplicantsForJob,
  getHrInterviews,
  getHrJobs,
  updateHrInterview
} from '../services/hrApi';

const defaultInterviewForm = {
  sourceType: 'job',
  jobId: '',
  applicationId: '',
  applicationIds: [],
  campusDriveId: '',
  campusApplicationIds: [],
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

const MAX_INTERVIEW_ROOM_PARTICIPANTS = 25;
const defaultCampusApplicantSummary = {
  total: 0,
  applied: 0,
  shortlisted: 0,
  selected: 0,
  rejected: 0,
  withdrawn: 0,
  interviewReady: 0
};
const defaultCampusApplicantPagination = {
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 1,
  count: 0
};

const toggleSelection = (list = [], value) => (
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
);

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
  const [campusDrives, setCampusDrives] = useState([]);
  const [jobApplicants, setJobApplicants] = useState([]);
  const [campusApplicants, setCampusApplicants] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [state, setState] = useState({ loading: true, error: '', message: '' });
  const [form, setForm] = useState(defaultInterviewForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [campusApplicantQuery, setCampusApplicantQuery] = useState({
    search: '',
    status: 'all',
    round: 'all',
    readyOnly: true,
    page: 1,
    limit: 25
  });
  const [campusApplicantMeta, setCampusApplicantMeta] = useState({
    loading: false,
    summary: defaultCampusApplicantSummary,
    pagination: defaultCampusApplicantPagination,
    availableRounds: []
  });

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      const [jobsResponse, interviewsResponse, campusDrivesResponse] = await Promise.all([
        getHrJobs(),
        getHrInterviews(),
        fetchHrCampusDrives()
      ]);

      if (!mounted) return;

      const jobsList = jobsResponse.data || [];
      const interviewList = (interviewsResponse.data || []).sort(
        (left, right) => new Date(right.scheduled_at || right.scheduledAt) - new Date(left.scheduled_at || left.scheduledAt)
      );

      setJobs(jobsList);
      setCampusDrives(campusDrivesResponse.data || []);
      setInterviews(interviewList);
      setState({
        loading: false,
        error: jobsResponse.error || interviewsResponse.error || '',
        message: ''
      });

      setForm((current) => ({
        ...current,
        jobId: current.jobId || jobsList[0]?.id || jobsList[0]?._id || '',
        campusDriveId: current.campusDriveId || campusDrivesResponse.data?.[0]?.id || ''
      }));
    };

    loadInitial();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadApplicants = async () => {
      if (form.sourceType !== 'job') {
        setJobApplicants([]);
        return;
      }
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
        applicationId: current.applicationId && applicants.some((item) => item.id === current.applicationId) ? current.applicationId : '',
        applicationIds: current.applicationIds.filter((id) => applicants.some((item) => item.id === id))
      }));
    };

    loadApplicants();
    return () => { mounted = false; };
  }, [form.jobId, form.sourceType]);

  useEffect(() => {
    let mounted = true;

    const loadCampusApplicants = async () => {
      if (form.sourceType !== 'campus' || !form.campusDriveId) {
        setCampusApplicants([]);
        setCampusApplicantMeta({
          loading: false,
          summary: defaultCampusApplicantSummary,
          pagination: defaultCampusApplicantPagination,
          availableRounds: []
        });
        return;
      }

      setCampusApplicantMeta((current) => ({ ...current, loading: true }));
      try {
        const response = await fetchHrCampusDriveApplications(form.campusDriveId, campusApplicantQuery);
        if (!mounted) return;

        setCampusApplicants(response.applications || []);
        setCampusApplicantMeta({
          loading: false,
          summary: response.summary || defaultCampusApplicantSummary,
          pagination: response.pagination || defaultCampusApplicantPagination,
          availableRounds: response.availableRounds || []
        });
        setState((current) => ({ ...current, error: '' }));
      } catch (error) {
        if (!mounted) return;
        setCampusApplicants([]);
        setCampusApplicantMeta({
          loading: false,
          summary: defaultCampusApplicantSummary,
          pagination: defaultCampusApplicantPagination,
          availableRounds: []
        });
        setState((current) => ({ ...current, error: error.message || 'Unable to load campus applicants.' }));
      }
    };

    loadCampusApplicants();
    return () => { mounted = false; };
  }, [
    campusApplicantQuery.limit,
    campusApplicantQuery.page,
    campusApplicantQuery.readyOnly,
    campusApplicantQuery.round,
    campusApplicantQuery.search,
    campusApplicantQuery.status,
    form.campusDriveId,
    form.sourceType
  ]);

  const applicantOptions = useMemo(
    () => jobApplicants.map((item) => ({
      value: item.id,
      label: `${item.applicant?.name || item.applicantEmail || item.applicant_id} • ${item.status || 'applied'}`
    })),
    [jobApplicants]
  );

  const campusApplicantOptions = useMemo(
    () => campusApplicants.map((item) => ({
      value: item.id,
      label: `${item.candidate?.name || item.candidate?.email || 'Candidate'} • ${item.currentRound || item.status || 'applied'}`,
      disabled: item.canScheduleInterview === false,
      helpText: item.canScheduleInterview === false ? 'This student is not linked to a platform account yet.' : ''
    })),
    [campusApplicants]
  );

  const campusSelectedCount = form.campusApplicationIds.length;
  const visibleCampusSelectableIds = useMemo(
    () => campusApplicants.filter((item) => item.canScheduleInterview !== false).map((item) => item.id),
    [campusApplicants]
  );

  const groupedInterviews = useMemo(() => {
    const grouped = new Map();
    interviews.forEach((interview) => {
      const roomInterviewId = interview.room_interview_id || interview.id;
      if (!grouped.has(roomInterviewId) || interview.id === roomInterviewId) {
        grouped.set(roomInterviewId, {
          ...interview,
          room_interview_id: roomInterviewId
        });
      }
    });
    return Array.from(grouped.values());
  }, [interviews]);

  const filteredInterviews = useMemo(() => groupedInterviews.filter((interview) => {
    const normalized = String(interview.status || 'scheduled').toLowerCase();
    if (activeTab === 'upcoming') return ['scheduled', 'rescheduled'].includes(normalized);
    if (activeTab === 'completed') return normalized === 'completed';
    return normalized === 'cancelled' || normalized === 'no_show';
  }), [activeTab, groupedInterviews]);

  const setMessage = (message, isError = false) => {
    setState((current) => ({ ...current, message, error: isError ? message : current.error }));
  };

  const updateCampusApplicantQuery = (patch) => {
    setCampusApplicantQuery((current) => ({
      ...current,
      ...patch,
      page: patch.page !== undefined ? patch.page : 1
    }));
  };

  const handleSelectVisibleCampusApplicants = () => {
    setForm((current) => {
      const next = new Set(current.campusApplicationIds);
      visibleCampusSelectableIds.forEach((id) => {
        if (next.size < MAX_INTERVIEW_ROOM_PARTICIPANTS) {
          next.add(id);
        }
      });
      return { ...current, campusApplicationIds: Array.from(next) };
    });

    if ((form.campusApplicationIds.length + visibleCampusSelectableIds.length) > MAX_INTERVIEW_ROOM_PARTICIPANTS) {
      setState((current) => ({
        ...current,
        error: `A single room supports up to ${MAX_INTERVIEW_ROOM_PARTICIPANTS} participants. Filter by round/status and schedule the rest in another batch.`
      }));
    }
  };

  const handleClearCampusSelection = () => {
    setForm((current) => ({ ...current, campusApplicationIds: [] }));
  };

  const handleCreateInterview = async (event) => {
    event.preventDefault();
    const selectedIds = form.sourceType === 'campus' ? form.campusApplicationIds : form.applicationIds;
    if (!selectedIds.length || !form.scheduledAt) {
      setMessage('Select at least one applicant and choose a schedule time.', true);
      return;
    }

    if (selectedIds.length > MAX_INTERVIEW_ROOM_PARTICIPANTS) {
      setMessage(`A single room supports up to ${MAX_INTERVIEW_ROOM_PARTICIPANTS} participants. Please schedule in smaller batches.`, true);
      return;
    }

    setSaving(true);
    try {
      const created = await createHrInterview({
        ...form,
        applicationIds: form.applicationIds,
        campusApplicationIds: form.campusApplicationIds,
        panelMembers: parsePanelMembersInput(form.panelMembersInput)
      });
      const refreshed = await getHrInterviews();
      setInterviews((refreshed.data || []).sort(
        (left, right) => new Date(right.scheduled_at || right.scheduledAt) - new Date(left.scheduled_at || left.scheduledAt)
      ));
      setState((current) => ({
        ...current,
        message: `${created.createdCount || selectedIds.length} interview room participant(s) scheduled inside HHH Jobs.`,
        error: ''
      }));
      setForm((current) => ({
        ...current,
        title: '',
        scheduledAt: '',
        note: '',
        panelMembersInput: '',
        applicationIds: current.sourceType === 'job' ? current.applicationIds : [],
        campusApplicationIds: current.sourceType === 'campus' ? current.campusApplicationIds : []
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
    upcoming: groupedInterviews.filter((i) => ['scheduled', 'rescheduled'].includes(String(i.status || 'scheduled').toLowerCase())).length,
    completed: groupedInterviews.filter((i) => String(i.status || '').toLowerCase() === 'completed').length,
    attention: groupedInterviews.filter((i) => ['cancelled', 'no_show'].includes(String(i.status || '').toLowerCase())).length
  }), [groupedInterviews]);

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
              <label className={labelClass}>Interview source</label>
              <select
                value={form.sourceType}
                onChange={(event) => {
                  const nextSourceType = event.target.value;
                  setForm((current) => ({ ...current, sourceType: nextSourceType, applicationId: '', applicationIds: [], campusApplicationIds: [] }));
                  if (nextSourceType === 'campus') {
                    setCampusApplicantQuery((current) => ({ ...current, page: 1 }));
                  }
                }}
                className={inputClass}
              >
                <option value="job">Job posting applicants</option>
                <option value="campus">Campus drive round</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>{form.sourceType === 'campus' ? 'Campus drive' : 'Job role'}</label>
              {form.sourceType === 'campus' ? (
                <select
                  value={form.campusDriveId}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, campusDriveId: event.target.value, campusApplicationIds: [] }));
                    setCampusApplicantQuery((current) => ({ ...current, search: '', status: 'all', round: 'all', readyOnly: true, page: 1 }));
                  }}
                  className={inputClass}
                >
                  <option value="" disabled>Select a campus drive</option>
                  {campusDrives.map((drive) => (
                    <option key={drive.id} value={drive.id}>{drive.jobTitle} • {drive.college?.name || drive.collegeName || 'Campus drive'}</option>
                  ))}
                </select>
              ) : (
                <select value={form.jobId} onChange={(event) => setForm((current) => ({ ...current, jobId: event.target.value, applicationId: '', applicationIds: [] }))} className={inputClass}>
                  <option value="" disabled>Select a role</option>
                  {jobs.map((job) => (
                    <option key={job.id || job._id} value={job.id || job._id}>{job.jobTitle}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className={labelClass}>{form.sourceType === 'campus' ? 'Campus applicants' : 'Candidates'}</label>
              {form.sourceType === 'campus' && (
                <div className="mt-1 space-y-2 rounded-md border border-slate-200 bg-slate-50/70 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={campusApplicantQuery.search}
                      onChange={(event) => updateCampusApplicantQuery({ search: event.target.value })}
                      className={inputClass}
                      placeholder="Search name, email, phone, branch"
                    />
                    <select
                      value={campusApplicantQuery.status}
                      onChange={(event) => updateCampusApplicantQuery({ status: event.target.value })}
                      className={inputClass}
                    >
                      <option value="all">All statuses</option>
                      <option value="applied">Applied</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={campusApplicantQuery.round}
                      onChange={(event) => updateCampusApplicantQuery({ round: event.target.value })}
                      className={inputClass}
                    >
                      <option value="all">All rounds</option>
                      <option value="__unassigned__">No round yet</option>
                      {campusApplicantMeta.availableRounds.map((round) => (
                        <option key={round} value={round}>{round}</option>
                      ))}
                    </select>
                    <select
                      value={campusApplicantQuery.limit}
                      onChange={(event) => updateCampusApplicantQuery({ limit: Number(event.target.value) })}
                      className={inputClass}
                    >
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[10px] text-slate-500">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Total: <strong className="text-slate-700">{campusApplicantMeta.summary.total}</strong></span>
                      <span>Ready: <strong className="text-slate-700">{campusApplicantMeta.summary.interviewReady}</strong></span>
                      <span>Filtered: <strong className="text-slate-700">{campusApplicantMeta.pagination.total}</strong></span>
                      <span>Selected: <strong className={campusSelectedCount > MAX_INTERVIEW_ROOM_PARTICIPANTS ? 'text-red-600' : 'text-slate-700'}>{campusSelectedCount}</strong> / {MAX_INTERVIEW_ROOM_PARTICIPANTS}</span>
                    </div>
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={campusApplicantQuery.readyOnly}
                        onChange={(event) => updateCampusApplicantQuery({ readyOnly: event.target.checked })}
                        className="h-3 w-3 rounded border-slate-300 text-indigo-600"
                      />
                      <span>Ready only</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectVisibleCampusApplicants}
                      disabled={visibleCampusSelectableIds.length === 0}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Select visible
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCampusSelection}
                      disabled={campusSelectedCount === 0}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear selection
                    </button>
                    <span className="text-slate-400">
                      Page {campusApplicantMeta.pagination.page} of {campusApplicantMeta.pagination.totalPages}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
                {form.sourceType === 'campus' && campusApplicantMeta.loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-9 animate-pulse rounded-md bg-slate-100" />
                    ))}
                  </div>
                ) : (form.sourceType === 'campus' ? campusApplicantOptions : applicantOptions).length > 0 ? (
                  <div className="space-y-1.5">
                    {(form.sourceType === 'campus' ? campusApplicantOptions : applicantOptions).map((option) => {
                      const checked = form.sourceType === 'campus'
                        ? form.campusApplicationIds.includes(option.value)
                        : form.applicationIds.includes(option.value);
                      const disabled = Boolean(option.disabled) || (!checked && form.sourceType === 'campus' && campusSelectedCount >= MAX_INTERVIEW_ROOM_PARTICIPANTS);
                      return (
                        <label key={option.value} className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-[12px] ${disabled ? 'cursor-not-allowed bg-slate-50 text-slate-400' : 'cursor-pointer text-slate-700 hover:bg-slate-50'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => setForm((current) => ({
                              ...current,
                              applicationId: option.value,
                              applicationIds: current.sourceType === 'job' ? toggleSelection(current.applicationIds, option.value) : current.applicationIds,
                              campusApplicationIds: current.sourceType === 'campus' ? toggleSelection(current.campusApplicationIds, option.value) : current.campusApplicationIds
                            }))}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="min-w-0">
                            <span className="block break-words">{option.label}</span>
                            {option.helpText && <span className="mt-0.5 block text-[10px] text-amber-600">{option.helpText}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400">
                    {form.sourceType === 'campus' ? 'No applicants match the current filters.' : 'No applicants available.'}
                  </p>
                )}
              </div>
              {form.sourceType === 'campus' && (
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => setCampusApplicantQuery((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                    disabled={campusApplicantMeta.pagination.page <= 1 || campusApplicantMeta.loading}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>
                    Showing {campusApplicantMeta.pagination.count} of {campusApplicantMeta.pagination.total} filtered applicants
                  </span>
                  <button
                    type="button"
                    onClick={() => setCampusApplicantQuery((current) => ({ ...current, page: current.page + 1 }))}
                    disabled={campusApplicantMeta.pagination.page >= campusApplicantMeta.pagination.totalPages || campusApplicantMeta.loading}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
              <p className="mt-1 text-[10px] text-slate-400">
                {form.sourceType === 'campus'
                  ? `For large campus drives, filter by round or status and schedule interview rooms in batches of up to ${MAX_INTERVIEW_ROOM_PARTICIPANTS} participants.`
                  : 'Select one candidate for a one-to-one room, or multiple candidates to create one shared interview room for the same round.'}
              </p>
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
              {saving
                ? 'Scheduling...'
                : ((form.sourceType === 'campus' ? form.campusApplicationIds.length : form.applicationIds.length) > 1
                  ? 'Schedule Group Interview Room'
                  : 'Schedule Interview')}
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
                        {interview.is_group_room && (
                          <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                            Group room
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-slate-500">
                        {interview.is_group_room
                          ? `${interview.room_participant_count || 1} candidates`
                          : (interview.candidate_name || 'Candidate')} &middot; {interview.round_label || 'Interview'} &middot; {interview.company_name || 'HHH Jobs'}
                      </p>
                      {interview.is_group_room && Array.isArray(interview.room_participant_names) && interview.room_participant_names.length > 0 && (
                        <p className="mt-1 truncate text-[11px] text-slate-400">{interview.room_participant_names.slice(0, 4).join(', ')}</p>
                      )}
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
                    <Link to={`/portal/hr/interviews/${interview.room_interview_id || interview.id}/room`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800">
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
