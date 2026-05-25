import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMonitor,
  FiTrash2,
  FiVideo
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentSurfaceCard,
  studentPrimaryButtonClassName
} from '../components/StudentExperience';
import { deleteStudentInterview, formatDateTime, getStudentInterviews } from '../services/studentApi';
import { getCurrentUser } from '../../../utils/auth';

const REMOVABLE_INTERVIEW_STATUSES = new Set(['cancelled', 'canceled', 'no_show']);

const statusBadgeClassName = (status) => {
  const normalized = String(status || 'scheduled').toLowerCase();
  if (normalized === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'cancelled') return 'border-red-200 bg-red-50 text-red-700';
  if (normalized === 'no_show') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
};

const canRemoveStudentInterview = (interview) =>
  [interview?.status, interview?.room_status]
    .map((status) => String(status || '').trim().toLowerCase())
    .some((status) => REMOVABLE_INTERVIEW_STATUSES.has(status));

const StudentInterviewsPage = () => {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [state, setState] = useState({ loading: true, error: '', isDemo: false, interviews: [] });
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [deletingInterviewId, setDeletingInterviewId] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadInterviews = async () => {
      const response = await getStudentInterviews();
      if (!mounted) return;

      setState({
        loading: false,
        error: response.error || '',
        isDemo: response.isDemo,
        interviews: response.data || []
      });
    };

    loadInterviews();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const interviews = state.interviews || [];
    return {
      scheduled: interviews.filter((item) => ['scheduled', 'rescheduled'].includes(String(item.status || '').toLowerCase())).length,
      completed: interviews.filter((item) => String(item.status || '').toLowerCase() === 'completed').length,
      recordingsReady: interviews.filter((item) => String(item.recording_status || '').toLowerCase() === 'available').length,
      consentPending: interviews.filter((item) => item.candidate_consent_required && !item.candidate_recording_consent).length
    };
  }, [state.interviews]);

  const userName = currentUser?.name || 'Student';

  const handleDeleteInterview = async (interview) => {
    setDeletingInterviewId(interview.id);
    setNotice({ type: '', text: '' });

    try {
      await deleteStudentInterview(interview.id);
      setState((current) => ({
        ...current,
        interviews: current.interviews.filter((item) => item.id !== interview.id)
      }));
      setNotice({ type: 'success', text: 'Cancelled interview removed.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to delete interview.' });
    } finally {
      setDeletingInterviewId('');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {state.isDemo ? <StudentNotice type="info" text="Demo mode is active, so sample interview data is being shown." /> : null}
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}
      {notice.text ? <StudentNotice type={notice.type} text={notice.text} /> : null}

      <section className="rounded-[1.55rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_45%,#f8fafc_100%)] p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.42)] sm:p-5">
        <div className="max-w-4xl space-y-2.5">
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">
            Interview center
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight text-navy">{userName}, your interview room is already inside HHH Jobs</h1>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-slate-500">
              Join the scheduled room, approve recording only when you are comfortable, and use the built-in whiteboard plus Monaco editor for technical rounds.
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Upcoming', value: stats.scheduled, helper: 'Live rooms on deck' },
            { label: 'Completed', value: stats.completed, helper: 'Rounds already wrapped' },
            { label: 'Recordings saved', value: stats.recordingsReady, helper: 'Sessions with uploaded recording' },
            { label: 'Consent pending', value: stats.consentPending, helper: 'Approve if you want recording + transcript' }
          ].map((item) => (
            <div key={item.label} className="rounded-[1rem] border border-slate-200 bg-white/95 px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <div className="mt-1 flex min-w-0 items-end justify-between gap-2">
                <p className="shrink-0 text-2xl font-bold leading-none text-navy">{item.value}</p>
                <p className="min-w-0 text-[11px] leading-4 text-slate-500">{item.helper}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <StudentSurfaceCard className="!rounded-[1.45rem] !p-3.5 sm:!p-4 xl:!p-4">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-700">Interview list</p>
          <h2 className="mt-1 font-heading text-xl font-bold text-navy">Every scheduled room, transcript status, and join path</h2>
          <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">
            No Zoom links needed. Each card opens the in-app room with recruiter notes, coding panel, and whiteboard support.
          </p>
        </div>
        {state.loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-44 animate-pulse rounded-[1.1rem] bg-slate-100" />
            ))}
          </div>
        ) : state.interviews.length > 0 ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {state.interviews.map((interview) => {
              const isRemovableInterview = canRemoveStudentInterview(interview);
              const isDeletingInterview = deletingInterviewId === interview.id;

              return (
              <article key={interview.id} className="rounded-[1.1rem] border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_34px_rgba(15,23,42,0.09)]">
                <div className="flex h-full min-h-[206px] flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusBadgeClassName(interview.status)}`}>
                      <FiClock size={12} />
                      <span className="truncate">{interview.status || 'Scheduled'}</span>
                    </span>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      {interview.room_status || 'scheduled'}
                    </span>
                  </div>

                  <div className="mt-2.5 min-w-0">
                    <h2 className="line-clamp-2 min-h-[40px] text-[0.95rem] font-bold leading-5 text-navy">{interview.title || interview.job_title || 'Interview room'}</h2>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                      {interview.company_name || 'Hiring team'} • {interview.round_label || 'Interview'}
                    </p>
                  </div>

                  <div className="mt-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                      <span className="mt-0.5 shrink-0 text-slate-400">
                        <FiCalendar size={13} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-black uppercase tracking-[0.12em] text-slate-400">Time</p>
                        <p className="mt-0.5 truncate font-semibold text-slate-800">{formatDateTime(interview.scheduled_at || interview.scheduledAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                      <span className="mt-0.5 shrink-0 text-slate-400">
                        <FiVideo size={13} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-black uppercase tracking-[0.12em] text-slate-400">Tools</p>
                        <p className="mt-0.5 truncate font-semibold text-slate-800">Video, code, whiteboard</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                      <span className="mt-0.5 shrink-0 text-slate-400">
                        <FiCheckCircle size={13} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-black uppercase tracking-[0.12em] text-slate-400">Recording</p>
                        <p className="mt-0.5 truncate font-semibold text-slate-800">
                          {interview.candidate_consent_required
                            ? (interview.candidate_recording_consent ? 'Consent saved' : 'Consent required')
                            : 'Optional'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    {isRemovableInterview ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-400"
                        title="Cancelled interviews cannot be joined"
                      >
                        <FiMonitor size={15} />
                        Join interview room
                      </button>
                    ) : (
                      <Link
                        to={`/portal/student/interviews/${interview.room_interview_id || interview.id}/room`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-warning-400 px-3 py-2 text-[11px] font-black text-white shadow-[0_10px_20px_rgba(229,155,23,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(229,155,23,0.28)]"
                      >
                        <FiMonitor size={15} />
                        Join interview room
                      </Link>
                    )}

                    {isRemovableInterview ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteInterview(interview)}
                        disabled={isDeletingInterview}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                        title={isDeletingInterview ? 'Deleting interview' : 'Delete cancelled interview'}
                      >
                        <FiTrash2 size={15} />
                        <span className="sr-only">Delete cancelled interview</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        ) : (
          <StudentEmptyState
            icon={FiCalendar}
            title="No interviews scheduled"
            description="Once recruiters shortlist you for a round, your in-app interview room will appear here with the exact join flow."
            className="border-none bg-slate-50/80"
            action={(
              <Link to="/portal/student/applications" className={studentPrimaryButtonClassName}>
                Review applications
              </Link>
            )}
          />
        )}
      </StudentSurfaceCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">How it works</p>
          <h2 className="mt-2 text-2xl font-bold text-navy">From shortlist to saved interview artifacts</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              'Recruiter schedules a room and you get a notification with the exact slot.',
              'You join the in-app room and can approve recording plus transcript before the round starts.',
              'The interview keeps code, whiteboard, notes, and saved artifacts connected to your candidate profile.'
            ].map((item) => (
              <div key={item} className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Quick prep</p>
          <h2 className="mt-2 text-2xl font-bold text-navy">Before you join</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">Review the job description and your project story once before the call.</div>
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">Test camera and microphone early so the WebRTC room connects smoothly.</div>
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">Use the whiteboard and code editor during technical prompts without leaving the portal.</div>
          </div>
          <Link to="/portal/student/jobs" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
            Explore more roles
            <FiArrowRight size={14} />
          </Link>
        </aside>
      </section>
    </div>
  );
};

export default StudentInterviewsPage;
