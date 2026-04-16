import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLink,
  FiMapPin,
  FiTrendingUp,
  FiUser,
  FiVideo,
  FiXCircle
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentSurfaceCard,
  studentPrimaryButtonClassName
} from '../components/StudentExperience';
import { formatDateTime, getStudentInterviews } from '../services/studentApi';
import { getCurrentUser } from '../../../utils/auth';

const QUICK_LINKS = [
  { label: 'My home', icon: FiUser, to: '/portal/student/home' },
  { label: 'Jobs', icon: FiBriefcase, to: '/portal/student/jobs' },
  { label: 'Applications', icon: FiFileText, to: '/portal/student/applications' },
  { label: 'Interviews', icon: FiCalendar, to: '/portal/student/interviews' }
];

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
    const cancelled = state.interviews.filter((item) => String(item.status || '').toLowerCase() === 'cancelled').length;

    return { completed, scheduled, virtual, cancelled };
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

  const userName = currentUser?.name || 'Student';

  return (
    <div className="space-y-6 pb-8">
      {state.isDemo ? <StudentNotice type="info" text="Demo mode is active, so sample interview data is being shown." /> : null}
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}

      <section className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)_250px]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 text-center shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)]">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[conic-gradient(#2d5bff_0_74%,#e2e8f0_74%_100%)]">
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-slate-100 text-3xl font-black text-slate-500">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="mt-3 inline-flex rounded-full border border-brand-100 bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700">
              {stats.scheduled} upcoming
            </span>
            <h1 className="mt-4 text-3xl font-extrabold text-navy">{userName}</h1>
            <p className="mt-1 text-sm text-slate-500">Interview workspace</p>
            <Link
              to="/portal/student/applications"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[#2d5bff] px-4 py-2 text-[14px] font-bold leading-none text-white shadow-[0_8px_18px_rgba(45,91,255,0.28)]"
            >
              Open applications
            </Link>
          </div>

          <div className="rounded-[1.6rem] border border-[#d9e7ff] bg-[#edf4ff] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-navy">Prep snapshot</h2>
              <FiTrendingUp className="text-brand-600" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-xs text-slate-500">Completed</p>
                <p className="mt-2 text-2xl font-extrabold text-brand-700">{stats.completed}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Virtual</p>
                <p className="mt-2 text-2xl font-extrabold text-brand-700">{stats.virtual}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700">
              <span>Keep links, notes, and timing ready in one view</span>
              <FiBell />
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
            <div className="space-y-1">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold ${
                    item.label === 'Interviews' ? 'bg-slate-100 text-navy' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-700">
                    Interviews
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Preparation board
                  </span>
                </div>
                <h2 className="mt-4 text-3xl font-extrabold text-navy">Keep every interview slot organized in a dashboard-style flow</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Review timing, mode, links, and notes in compact cards that feel closer to the student workspace instead of the older oversized hero layout.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { label: 'Scheduled', value: stats.scheduled, helper: 'Interviews currently lined up' },
                { label: 'Completed', value: stats.completed, helper: 'Sessions already finished' },
                { label: 'Virtual rounds', value: stats.virtual, helper: 'Online meetings with shared links' }
              ].map((stat) => (
                <article key={stat.label} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-extrabold text-navy">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{stat.helper}</p>
                </article>
              ))}
            </div>
          </div>

          <StudentSurfaceCard
            eyebrow="Interview list"
            title="Upcoming and completed rounds"
            subtitle="Each card keeps timing, location or video mode, notes, and meeting access ready."
          >
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
                    <article
                      key={interview.id || `${interview.company_name}-${interview.scheduled_at}`}
                      className="rounded-[1.85rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex h-full flex-col gap-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${statusConfig.badge}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                            <FiCalendar size={12} />
                            {formatDateTime(interview.scheduled_at || interview.scheduledAt)}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-2xl font-extrabold text-navy">
                            {interview.company_name || interview.companyName || 'Hiring Team'}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {isVirtual ? 'Virtual interview' : (interview.mode || 'Interview details')}
                          </p>
                        </div>

                        <div className="grid gap-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                              <FiClock size={13} />
                              Scheduled time
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
                            Join meeting
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <StudentEmptyState
                icon={FiCalendar}
                title="No interviews scheduled"
                description="Once recruiters move your applications forward, interview rounds will appear here with timing, mode, and meeting details."
                className="border-none bg-slate-50/80"
                action={(
                  <Link to="/portal/student/applications" className={studentPrimaryButtonClassName}>
                    Review applications
                  </Link>
                )}
              />
            )}
          </StudentSurfaceCard>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Status mix</p>
            <h2 className="mt-3 text-2xl font-extrabold text-navy">Interview round breakdown</h2>
            <div className="mt-5 space-y-3">
              {[
                { label: 'Scheduled', value: stats.scheduled },
                { label: 'Completed', value: stats.completed },
                { label: 'Cancelled', value: stats.cancelled },
                { label: 'Virtual', value: stats.virtual }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                  <span className="text-lg font-extrabold text-navy">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Prep checklist</p>
            <h2 className="mt-3 text-2xl font-extrabold text-navy">Before the round starts</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                Re-read the JD and match your experience to the role story.
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                Keep resume, portfolio, and meeting link ready before the call.
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                Note down company questions so the round feels more confident.
              </div>
            </div>

            <Link to="/portal/student/jobs" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
              Explore more roles
              <FiArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default StudentInterviewsPage;
