import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiXCircle
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentSurfaceCard,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import { formatDateTime, getStudentApplications, respondToApplicationOffer } from '../services/studentApi';
import { getCurrentUser } from '../../../utils/auth';

const STATUS_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview_scheduled', label: 'Interview Scheduled' },
  { id: 'interviewed', label: 'Interviewed' },
  { id: 'offered', label: 'Offered' },
  { id: 'hired', label: 'Hired' }
];

const STATUS_FILTERS = ['all', ...STATUS_STAGES.map((stage) => stage.id), 'selected', 'withdrawn', 'rejected'];

const SECTION_FILTERS = [
  { key: 'all', label: 'All', helper: 'Every card' },
  { key: 'applied', label: 'Applied', helper: 'New submissions' },
  { key: 'shortlisted', label: 'Shortlisted', helper: 'Moved ahead' },
  { key: 'interviews', label: 'Interviews', helper: 'Active rounds' },
  { key: 'offers', label: 'Offers', helper: 'Final stage' },
  { key: 'rejected', label: 'Rejected', helper: 'Closed out' }
];

const getProgressStatus = (status = '') => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'selected') return 'hired';
  return normalized;
};

const getStatusLabel = (status = '') => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return 'Unknown';
  if (normalized === 'all') return 'All';
  if (normalized === 'interviews') return 'Interviews';
  if (normalized === 'offers') return 'Offers';
  if (normalized === 'selected') return 'Selected';
  if (normalized === 'withdrawn') return 'Withdrawn';
  if (normalized === 'interview_scheduled') return 'Interview Scheduled';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const QUICK_LINKS = [
  { label: 'My home', icon: FiUser, to: '/portal/student/home' },
  { label: 'Jobs', icon: FiBriefcase, to: '/portal/student/jobs' },
  { label: 'My Applications', icon: FiFileText, to: '/portal/student/applications' },
  { label: 'Interviews', icon: FiCalendar, to: '/portal/student/interviews' }
];

const StudentApplicationsPage = () => {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [state, setState] = useState({ loading: true, error: '', isDemo: false, applications: [] });
  const [statusFilter, setStatusFilter] = useState('all');
  const [offerActionState, setOfferActionState] = useState({ applicationId: '', decision: '', message: '', error: '' });

  useEffect(() => {
    let mounted = true;

    const loadApplications = async () => {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await getStudentApplications();
      if (!mounted) return;

      setState({
        loading: false,
        error: response.error && !response.isDemo ? response.error : '',
        isDemo: response.isDemo,
        applications: response.data || []
      });
    };

    loadApplications();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return state.applications;
    if (statusFilter === 'interviews') {
      return state.applications.filter((item) => ['interview_scheduled', 'interviewed'].includes(String(item.status || '').toLowerCase()));
    }
    if (statusFilter === 'offers') {
      return state.applications.filter((item) => ['offered', 'selected', 'hired'].includes(String(item.status || '').toLowerCase()));
    }
    return state.applications.filter((item) => String(item.status || '').toLowerCase() === statusFilter);
  }, [state.applications, statusFilter]);

  const counts = useMemo(() => {
    const total = state.applications.length;
    const applied = state.applications.filter((item) => String(item.status || '').toLowerCase() === 'applied').length;
    const shortlisted = state.applications.filter((item) => String(item.status || '').toLowerCase() === 'shortlisted').length;
    const interviews = state.applications.filter((item) => ['interview_scheduled', 'interviewed'].includes(String(item.status || '').toLowerCase())).length;
    const rejected = state.applications.filter((item) => String(item.status || '').toLowerCase() === 'rejected').length;
    const offers = state.applications.filter((item) => ['offered', 'selected', 'hired'].includes(String(item.status || '').toLowerCase())).length;

    return { total, applied, shortlisted, interviews, rejected, offers };
  }, [state.applications]);

  const getStatusColor = (status) => {
    const normalized = String(status || '').toLowerCase();
    switch (normalized) {
      case 'applied': return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'shortlisted': return 'border-indigo-200 bg-indigo-50 text-indigo-700';
      case 'interview_scheduled': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'interviewed': return 'border-violet-200 bg-violet-50 text-violet-700';
      case 'offered': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'hired': return 'border-teal-200 bg-teal-50 text-teal-700';
      case 'selected': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'withdrawn': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'rejected': return 'border-red-200 bg-red-50 text-red-700';
      default: return 'border-slate-200 bg-slate-50 text-slate-600';
    }
  };

  const getTimelineProgress = (currentStatus) => {
    if (currentStatus === 'rejected') return -1;
    const index = STATUS_STAGES.findIndex((stage) => stage.id === currentStatus);
    return index >= 0 ? index : 0;
  };

  const userName = currentUser?.name || 'Student';

  const handleOfferResponse = async (application, decision) => {
    const applicationId = application?.id || application?._id;
    if (!applicationId) return;

    setOfferActionState({ applicationId, decision, message: '', error: '' });

    try {
      const updatedApplication = await respondToApplicationOffer({ applicationId, decision });
      setState((prev) => ({
        ...prev,
        applications: prev.applications.map((item) => (
          (item.id || item._id) === applicationId
            ? { ...item, ...updatedApplication, job: item.job, sourceType: item.sourceType, currentRound: item.currentRound, collegeName: item.collegeName }
            : item
        ))
      }));
      setOfferActionState({
        applicationId: '',
        decision: '',
        message: decision === 'accept' ? 'Offer accepted successfully.' : 'Offer rejected successfully.',
        error: ''
      });
    } catch (error) {
      setOfferActionState({
        applicationId: '',
        decision: '',
        message: '',
        error: error.message || 'Unable to update the offer right now.'
      });
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {state.isDemo ? <StudentNotice type="info" text="Demo mode is active, so sample application records are being shown." /> : null}
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}
      {offerActionState.message ? <StudentNotice type="success" text={offerActionState.message} /> : null}
      {offerActionState.error ? <StudentNotice type="error" text={offerActionState.error} /> : null}

      <section className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_250px]">
        <aside className="space-y-4">
          <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 text-center shadow-[0_14px_34px_-30px_rgba(15,23,42,0.45)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[conic-gradient(#2d5bff_0_78%,#e2e8f0_78%_100%)] p-1">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-2xl font-black text-slate-500">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="mt-2.5 inline-flex rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
              {counts.total} tracked
            </span>
            <h1 className="mt-3 text-xl font-black leading-tight text-navy">{userName}</h1>
            <p className="mt-0.5 text-xs text-slate-500">Application workspace</p>
            <Link
              to="/portal/student/jobs"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[#2d5bff] px-3.5 py-1.5 text-xs font-bold leading-none text-white shadow-[0_8px_18px_rgba(45,91,255,0.22)]"
            >
              Browse jobs
            </Link>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3">
            <div className="space-y-1">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-xs font-bold ${
                    item.to === '/portal/student/applications' ? 'bg-slate-100 text-navy' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <item.icon size={14} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[#d9e7ff] bg-[#edf4ff] p-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-navy">Pipeline snapshot</h2>
              <FiTrendingUp className="text-brand-600" size={14} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Shortlisted</p>
                <p className="mt-1 text-xl font-black text-brand-700">{counts.shortlisted}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Offers</p>
                <p className="mt-1 text-xl font-black text-brand-700">{counts.offers}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-[1rem] bg-white px-3 py-2.5 text-left text-xs font-semibold leading-4 text-slate-700">
              <span>Keep your strongest roles moving this week</span>
              <FiTarget className="shrink-0" size={13} />
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <StudentSurfaceCard
            eyebrow="Live pipeline"
            title={statusFilter === 'all' ? 'All applications' : `${getStatusLabel(statusFilter)} applications`}
            subtitle="Every card shows movement, current stage, and the next best context in one place."
            className="!rounded-[1.35rem] !border-slate-200/80 !bg-white !p-4 !shadow-[0_16px_42px_rgba(15,23,42,0.06)] [&>div:first-of-type]:!mb-4 [&_h2]:!text-xl [&_h2]:!font-black [&_p]:!text-xs"
          >
            <div className="mb-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {SECTION_FILTERS.map((section) => {
                const value = section.key === 'all'
                  ? counts.total
                  : section.key === 'offers'
                    ? counts.offers
                    : section.key === 'interviews'
                      ? counts.interviews
                      : counts[section.key] || 0;
                const isActive = statusFilter === section.key;

                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setStatusFilter(section.key)}
                    className={`group/section min-w-0 rounded-full border px-2.5 py-2 text-left transition ${
                      isActive
                        ? 'border-brand-300 bg-brand-50 shadow-[0_10px_24px_rgba(45,91,255,0.12)]'
                        : 'border-slate-200 bg-slate-50/70 hover:border-brand-200 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className={`min-w-0 truncate text-[10px] font-black uppercase tracking-[0.12em] ${
                          isActive ? 'text-brand-700' : 'text-slate-500'
                        }`}>
                        {section.label}
                      </p>
                      <span className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-black ${
                        isActive ? 'bg-brand-600 text-white' : 'bg-white text-navy ring-1 ring-slate-200'
                      }`}>
                        {value}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {state.loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-3.5">
                {filtered.map((app) => {
                  const targetId = app.jobId || app.job_id || app.job?.id;
                  const currentStatus = String(app.status || 'applied').toLowerCase();
                  const progressStatus = getProgressStatus(currentStatus);
                  const progressIndex = getTimelineProgress(progressStatus);
                  const isRejected = currentStatus === 'rejected';
                  const isWithdrawn = currentStatus === 'withdrawn';
                  const sourceType = String(app.sourceType || 'platform').toLowerCase();
                  const canRespondToOffer = sourceType === 'platform' && currentStatus === 'offered';
                  const isUpdatingOffer = offerActionState.applicationId === (app.id || app._id);
                  const cardAccentClassName = isRejected
                    ? 'border-l-red-400'
                    : isWithdrawn
                      ? 'border-l-amber-400'
                      : ['offered', 'selected', 'hired'].includes(currentStatus)
                        ? 'border-l-emerald-400'
                        : ['shortlisted', 'interview_scheduled', 'interviewed'].includes(currentStatus)
                          ? 'border-l-brand-400'
                          : 'border-l-slate-300';

                  return (
                    <article
                      key={app.id || app._id}
                      className={`group overflow-hidden rounded-[1.1rem] border border-l-4 border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] ${cardAccentClassName}`}
                    >
                      <div className="flex flex-col gap-3 border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-4 py-3.5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${getStatusColor(currentStatus)}`}>
                              {getStatusLabel(currentStatus)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                              {sourceType === 'campus' ? 'Campus Connect' : 'Platform'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                              <FiClock size={11} />
                              Updated {formatDateTime(app.statusUpdatedAt)}
                            </span>
                            {sourceType === 'campus' && app.currentRound ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                                Round {app.currentRound}
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-2 text-lg font-black leading-tight text-navy sm:text-xl">
                            {app.jobTitle || app.job?.jobTitle || 'Untitled Role'}
                          </h3>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            {app.companyName || app.job?.companyName || 'Unknown company'}
                          </p>
                          {sourceType === 'campus' && app.collegeName ? (
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              {app.collegeName}
                            </p>
                          ) : null}
                        </div>

                        {targetId ? (
                          <Link to={`/portal/student/jobs/${targetId}`} className={`${studentSecondaryButtonClassName} min-h-8 shrink-0 px-3 py-1.5 text-xs`}>
                            View job
                            <FiChevronRight size={13} />
                          </Link>
                        ) : null}
                      </div>

                      <div className="bg-white px-4 py-3.5">
                        <div className="relative overflow-hidden rounded-[0.95rem] border border-slate-200 bg-[linear-gradient(180deg,#f9fbff_0%,#f3f7fb_100%)] px-3 py-4 shadow-inner sm:px-4">
                          <div className="absolute left-7 right-7 top-[1.9rem] h-0.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isRejected ? 'bg-red-500' : isWithdrawn ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-500 to-secondary-500'
                              }`}
                              style={{ width: isRejected || isWithdrawn ? '100%' : `${(progressIndex / (STATUS_STAGES.length - 1)) * 100}%` }}
                            />
                          </div>

                          <div className="relative z-10 grid grid-cols-3 gap-3 md:grid-cols-6">
                            {STATUS_STAGES.map((stage, index) => {
                              const isActive = !isRejected && !isWithdrawn && progressIndex >= index;
                              const isCurrent = !isRejected && !isWithdrawn && progressIndex === index;

                              return (
                                <div key={stage.id} className="flex flex-col items-center text-center">
                                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-black shadow-sm ring-4 ring-white/80 ${
                                    isActive
                                      ? 'border-brand-500 bg-brand-500 text-white'
                                      : 'border-slate-200 bg-white text-slate-300'
                                  }`}>
                                    {isActive ? <FiCheckCircle size={12} /> : index + 1}
                                  </div>
                                  <span className={`mt-2 text-[9px] font-black uppercase leading-3 tracking-[0.08em] ${isCurrent ? 'text-brand-700' : 'text-slate-500'}`}>
                                    {stage.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {canRespondToOffer ? (
                          <div className="mt-3 flex flex-col gap-3 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-3.5 py-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-xs font-bold text-emerald-800">You have received an offer for this role.</p>
                              <p className="mt-1 text-xs text-emerald-700">Choose whether to accept it and move this application forward.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleOfferResponse(app, 'accept')}
                                disabled={isUpdatingOffer}
                                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdatingOffer && offerActionState.decision === 'accept' ? 'Accepting...' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOfferResponse(app, 'reject')}
                                disabled={isUpdatingOffer}
                                className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdatingOffer && offerActionState.decision === 'reject' ? 'Rejecting...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {isRejected || isWithdrawn ? (
                          <div className={`mt-3 flex items-start gap-2.5 rounded-[1rem] border px-3.5 py-2.5 text-xs ${
                            isWithdrawn ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-700'
                          }`}>
                            <FiXCircle className="mt-0.5 shrink-0" size={14} />
                            <div>
                              <p className="font-bold">{isWithdrawn ? 'Application withdrawn' : 'Application closed out'}</p>
                              <p className={isWithdrawn ? 'mt-1 text-amber-700' : 'mt-1 text-red-600'}>
                                {isWithdrawn
                                  ? 'This application is no longer active in your pipeline.'
                                  : 'Use this result to tighten resume language and improve the next application.'}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {app.hrNotes ? (
                          <div className="mt-3 rounded-[0.95rem] border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-600">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Notes</p>
                            <p className="mt-1.5 leading-5">{app.hrNotes}</p>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <StudentEmptyState
                icon={FiBriefcase}
                title="No applications found"
                description="You have not applied to any roles under this filter yet. Start applying to build your live pipeline."
                className="border-none bg-slate-50/80"
                action={(
                  <Link to="/portal/student/jobs" className={studentPrimaryButtonClassName}>
                    Browse jobs
                  </Link>
                )}
              />
            )}
          </StudentSurfaceCard>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status mix</p>
            <h2 className="mt-2 text-lg font-black leading-tight text-navy">How your pipeline is distributed</h2>
            <div className="mt-4 space-y-2.5">
              {[
                { label: 'Applied', value: state.applications.filter((item) => String(item.status || '').toLowerCase() === 'applied').length },
                { label: 'Shortlisted', value: counts.shortlisted },
                { label: 'Interview Stage', value: counts.interviews },
                { label: 'Rejected', value: counts.rejected }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[0.95rem] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                  <span className="text-base font-black text-navy">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Next move</p>
            <h2 className="mt-2 text-lg font-black leading-tight text-navy">Keep momentum high</h2>
            <div className="mt-4 space-y-2.5 text-xs leading-4 text-slate-600">
              <div className="rounded-[0.95rem] border border-slate-200 bg-slate-50 px-3 py-2.5">
                Follow up on shortlisted roles before they go cold.
              </div>
              <div className="rounded-[0.95rem] border border-slate-200 bg-slate-50 px-3 py-2.5">
                Use rejected roles to refine resume keywords and ATS fit.
              </div>
              <div className="rounded-[0.95rem] border border-slate-200 bg-slate-50 px-3 py-2.5">
                Move scheduled interviews into prep mode from the interviews page.
              </div>
            </div>

            <Link to="/portal/student/interviews" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-brand-700">
              Open interviews board
              <FiArrowRight size={13} />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default StudentApplicationsPage;
