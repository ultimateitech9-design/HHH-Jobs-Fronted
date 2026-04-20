import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMonitor,
  FiVideo
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentSurfaceCard,
  studentPrimaryButtonClassName
} from '../components/StudentExperience';
import { formatDateTime, getStudentInterviews } from '../services/studentApi';
import { getCurrentUser } from '../../../utils/auth';

const statusBadgeClassName = (status) => {
  const normalized = String(status || 'scheduled').toLowerCase();
  if (normalized === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'cancelled') return 'border-red-200 bg-red-50 text-red-700';
  if (normalized === 'no_show') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
};

const StudentInterviewsPage = () => {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [state, setState] = useState({ loading: true, error: '', isDemo: false, interviews: [] });

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

  return (
    <div className="space-y-6 pb-8">
      {state.isDemo ? <StudentNotice type="info" text="Demo mode is active, so sample interview data is being shown." /> : null}
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}

      <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_45%,#f8fafc_100%)] p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.42)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-700">
              Interview center
            </span>
            <div>
              <h1 className="text-3xl font-extrabold text-navy">{userName}, your interview room is already inside HHH Jobs</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Join the scheduled room, approve recording only if you’re comfortable, and use the built-in whiteboard plus Monaco editor for technical rounds.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            {[
              { label: 'Upcoming', value: stats.scheduled, helper: 'Live rooms on deck' },
              { label: 'Completed', value: stats.completed, helper: 'Rounds already wrapped' },
              { label: 'Recordings saved', value: stats.recordingsReady, helper: 'Sessions with uploaded recording' },
              { label: 'Consent pending', value: stats.consentPending, helper: 'Approve if you want recording + transcript' }
            ].map((item) => (
              <div key={item.label} className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-extrabold text-navy">{item.value}</p>
                <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StudentSurfaceCard
        eyebrow="Interview list"
        title="Every scheduled room, transcript status, and join path"
        subtitle="No Zoom links needed. Each card opens the in-app room with recruiter notes, coding panel, and whiteboard support."
      >
        {state.loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-[2rem] bg-slate-100" />
            ))}
          </div>
        ) : state.interviews.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {state.interviews.map((interview) => (
              <article key={interview.id} className="rounded-[1.85rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
                <div className="flex h-full flex-col gap-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${statusBadgeClassName(interview.status)}`}>
                      <FiClock size={12} />
                      {interview.status || 'Scheduled'}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      {interview.room_status || 'scheduled'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-navy">{interview.title || interview.job_title || 'Interview room'}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {interview.company_name || 'Hiring team'} • {interview.round_label || 'Interview'}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        <FiCalendar size={13} />
                        Scheduled time
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">{formatDateTime(interview.scheduled_at || interview.scheduledAt)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        <FiVideo size={13} />
                        Room features
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">Video, transcript, whiteboard, Monaco editor</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        <FiCheckCircle size={13} />
                        Consent and recording
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {interview.candidate_consent_required
                          ? (interview.candidate_recording_consent ? 'Consent already saved' : 'Consent required before recording')
                          : 'Recording is optional for this room'}
                      </p>
                    </div>
                  </div>

                  <Link to={`/portal/student/interviews/${interview.id}/room`} className={`${studentPrimaryButtonClassName} mt-auto`}>
                    <FiMonitor size={15} />
                    Join interview room
                  </Link>
                </div>
              </article>
            ))}
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
          <h2 className="mt-2 text-2xl font-extrabold text-navy">From shortlist to saved interview artifacts</h2>
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
          <h2 className="mt-2 text-2xl font-extrabold text-navy">Before you join</h2>
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
