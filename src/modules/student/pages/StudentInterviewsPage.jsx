import { useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLink,
  FiMapPin,
  FiVideo,
  FiXCircle
} from 'react-icons/fi';
import {
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentPrimaryButtonClassName
} from '../components/StudentExperience';
import { formatDateTime, getStudentInterviews } from '../services/studentApi';

const StudentInterviewsPage = () => {
  const [state, setState] = useState({ loading: true, error: '', isDemo: false, interviews: [] });

  useEffect(() => {
    let mounted = true;

    const loadInterviews = async () => {
      const response = await getStudentInterviews();
      if (!mounted) return;

      setState({
        loading: false,
        error: response.error && !response.isDemo ? response.error : '',
        isDemo: response.isDemo,
        interviews: response.data || []
      });
    };

    loadInterviews();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const completed = state.interviews.filter((item) => String(item.status || '').toLowerCase() === 'completed').length;
    const scheduled = state.interviews.filter((item) => String(item.status || '').toLowerCase() === 'scheduled').length;
    const virtual = state.interviews.filter((item) => /virtual|video/i.test(String(item.mode || ''))).length;

    return [
      {
        label: 'Scheduled',
        value: String(scheduled),
        helper: 'Interviews currently lined up'
      },
      {
        label: 'Completed',
        value: String(completed),
        helper: 'Sessions already done and awaiting outcome'
      },
      {
        label: 'Virtual Rounds',
        value: String(virtual),
        helper: 'Interviews that include an online meeting link'
      }
    ];
  }, [state.interviews]);

  const getStatusConfig = (status) => {
    const normalized = String(status || 'scheduled').toLowerCase();
    switch (normalized) {
      case 'scheduled':
        return { badge: 'border-blue-200 bg-blue-50 text-blue-700', icon: FiClock, label: 'Scheduled' };
      case 'completed':
        return { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: FiCheckCircle, label: 'Completed' };
      case 'cancelled':
        return { badge: 'border-red-200 bg-red-50 text-red-700', icon: FiXCircle, label: 'Cancelled' };
      default:
        return { badge: 'border-slate-200 bg-slate-50 text-slate-600', icon: FiClock, label: normalized };
    }
  };

  return (
    <StudentPageShell
      eyebrow="Interviews"
      badge="Preparation board"
      title="Keep every interview slot organized and easier to prep for"
      subtitle="Review timing, meeting mode, company context, and notes in one focused schedule so no conversation feels rushed."
      stats={stats}
    >
      {state.isDemo ? <StudentNotice type="info" text="Demo mode is active, so sample interview data is being shown." /> : null}
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}

      {state.loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-[2rem] bg-slate-100" />
          ))}
        </div>
      ) : state.interviews.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {state.interviews.map((interview) => {
            const statusConfig = getStatusConfig(interview.status);
            const isVirtual = /virtual|video/i.test(String(interview.mode || ''));
            const link = interview.meeting_link || interview.meetingLink;
            const StatusIcon = statusConfig.icon;

            return (
              <StudentSurfaceCard
                key={interview.id || `${interview.company_name}-${interview.scheduled_at}`}
                eyebrow="Interview Card"
                title={interview.company_name || interview.companyName || 'Hiring Team'}
                subtitle={isVirtual ? 'Virtual interview' : (interview.mode || 'Interview details')}
                className="h-full"
              >
                <div className="flex h-full flex-col gap-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${statusConfig.badge}`}>
                      <StatusIcon size={12} />
                      {statusConfig.label}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                      <FiCalendar size={12} />
                      {formatDateTime(interview.scheduled_at || interview.scheduledAt)}
                    </span>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        <FiClock size={13} />
                        Scheduled Time
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">{formatDateTime(interview.scheduled_at || interview.scheduledAt)}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        {isVirtual ? <FiVideo size={13} /> : <FiMapPin size={13} />}
                        Mode / Location
                      </p>
                      <p className="mt-2 font-semibold text-slate-800 capitalize">{interview.mode || 'Not specified'}</p>
                    </div>

                    {(interview.note || interview.notes || interview.description) ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          <FiFileText size={13} />
                          Notes
                        </p>
                        <p className="mt-2 leading-6 text-slate-700">
                          {interview.note || interview.notes || interview.description}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${studentPrimaryButtonClassName} mt-auto`}
                    >
                      <FiLink size={15} />
                      Join Meeting
                    </a>
                  ) : null}
                </div>
              </StudentSurfaceCard>
            );
          })}
        </div>
      ) : null}
    </StudentPageShell>
  );
};

export default StudentInterviewsPage;
