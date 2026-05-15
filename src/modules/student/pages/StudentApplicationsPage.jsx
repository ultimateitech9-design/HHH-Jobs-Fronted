import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiFilter,
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
  { id: 'interviewed', label: 'Interviewed' },
  { id: 'offered', label: 'Offered' },
  { id: 'hired', label: 'Hired' }
];

const STATUS_FILTERS = ['all', ...STATUS_STAGES.map((stage) => stage.id), 'selected', 'withdrawn', 'rejected'];

const getProgressStatus = (status = '') => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'selected') return 'hired';
  return normalized;
};

const getStatusLabel = (status = '') => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return 'Unknown';
  if (normalized === 'selected') return 'Selected';
  if (normalized === 'withdrawn') return 'Withdrawn';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const QUICK_LINKS = [
  { label: 'My home', icon: FiUser, to: '/portal/student/home' },
  { label: 'Jobs', icon: FiBriefcase, to: '/portal/student/jobs' },
  { label: 'Applications', icon: FiFileText, to: '/portal/student/applications' },
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
    return state.applications.filter((item) => String(item.status || '').toLowerCase() === statusFilter);
  }, [state.applications, statusFilter]);

  const counts = useMemo(() => {
    const total = state.applications.length;
    const shortlisted = state.applications.filter((item) => String(item.status || '').toLowerCase() === 'shortlisted').length;
    const interviews = state.applications.filter((item) => String(item.status || '').toLowerCase() === 'interviewed').length;
    const rejected = state.applications.filter((item) => String(item.status || '').toLowerCase() === 'rejected').length;
    const offers = state.applications.filter((item) => ['offered', 'selected', 'hired'].includes(String(item.status || '').toLowerCase())).length;

    return { total, shortlisted, interviews, rejected, offers };
  }, [state.applications]);

  const getStatusColor = (status) => {
    const normalized = String(status || '').toLowerCase();
    switch (normalized) {
      case 'applied': return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'shortlisted': return 'border-indigo-200 bg-indigo-50 text-indigo-700';
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
    <div className="space-y-6 pb-8">
      {state.isDemo ? <StudentNotice type="info" text="Demo mode is active, so sample application records are being shown." /> : null}
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}
      {offerActionState.message ? <StudentNotice type="success" text={offerActionState.message} /> : null}
      {offerActionState.error ? <StudentNotice type="error" text={offerActionState.error} /> : null}

      <section className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)_250px]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 text-center shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)]">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[conic-gradient(#2d5bff_0_78%,#e2e8f0_78%_100%)]">
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-slate-100 text-3xl font-black text-slate-500">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="mt-3 inline-flex rounded-full border border-brand-100 bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700">
              {counts.total} tracked
            </span>
            <h1 className="mt-4 text-3xl font-bold text-navy">{userName}</h1>
            <p className="mt-1 text-sm text-slate-500">Application workspace</p>
            <Link
              to="/portal/student/jobs"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[#2d5bff] px-4 py-2 text-[14px] font-bold leading-none text-white shadow-[0_8px_18px_rgba(45,91,255,0.28)]"
            >
              Browse jobs
            </Link>
          </div>

          <div className="rounded-[1.6rem] border border-[#d9e7ff] bg-[#edf4ff] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy">Pipeline snapshot</h2>
              <FiTrendingUp className="text-brand-600" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-xs text-slate-500">Shortlisted</p>
                <p className="mt-2 text-2xl font-bold text-brand-700">{counts.shortlisted}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Offers</p>
                <p className="mt-2 text-2xl font-bold text-brand-700">{counts.offers}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700">
              <span>Keep your strongest roles moving this week</span>
              <FiTarget />
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
            <div className="space-y-1">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold ${
                    item.label === 'Applications' ? 'bg-slate-100 text-navy' : 'text-slate-700 hover:bg-slate-50'
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
                    Applications
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Pipeline board
                  </span>
                </div>
                <h2 className="mt-4 text-3xl font-bold text-navy">Track every application with a cleaner dashboard flow</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Filter the pipeline fast, see which roles are moving, and keep each application readable without the oversized old dashboard wrapper.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { label: 'Tracked', value: counts.total, helper: 'Everything currently in your pipeline' },
                { label: 'Shortlisted', value: counts.shortlisted, helper: 'Moved beyond first review' },
                { label: 'Interview stage', value: counts.interviews, helper: 'Close to recruiter conversations' }
              ].map((stat) => (
                <article key={stat.label} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-bold text-navy">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{stat.helper}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <FiFilter size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Filter by status</p>
                  <p className="text-sm text-slate-500">Review only the stage you want to act on today.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      statusFilter === status
                        ? 'bg-navy text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
                    }`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <StudentSurfaceCard
            eyebrow="Live pipeline"
            title={statusFilter === 'all' ? 'All applications' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} applications`}
            subtitle="Every card shows movement, current stage, and the next best context in one place."
          >
            {state.loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-60 animate-pulse rounded-[2rem] bg-slate-100" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-6">
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

                  return (
                    <article
                      key={app.id || app._id}
                      className="rounded-[1.9rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${getStatusColor(currentStatus)}`}>
                              {getStatusLabel(currentStatus)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                              {sourceType === 'campus' ? 'Campus Connect' : 'Platform'}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                              <FiClock size={12} />
                              Updated {formatDateTime(app.statusUpdatedAt)}
                            </span>
                            {sourceType === 'campus' && app.currentRound ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                                Round {app.currentRound}
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-4 text-2xl font-bold text-navy">
                            {app.jobTitle || app.job?.jobTitle || 'Untitled Role'}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {app.companyName || app.job?.companyName || 'Unknown company'}
                          </p>
                          {sourceType === 'campus' && app.collegeName ? (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              {app.collegeName}
                            </p>
                          ) : null}
                        </div>

                        {targetId ? (
                          <Link to={`/portal/student/jobs/${targetId}`} className={studentSecondaryButtonClassName}>
                            View job
                            <FiChevronRight size={14} />
                          </Link>
                        ) : null}
                      </div>

                      <div className="mt-6 rounded-[1.8rem] border border-slate-200 bg-slate-50/80 px-4 py-6">
                        <div className="relative">
                          <div className="absolute left-5 right-5 top-4 h-1 rounded-full bg-white" />
                          <div
                            className={`absolute left-5 top-4 h-1 rounded-full transition-all duration-700 ${
                              isRejected ? 'bg-red-500' : isWithdrawn ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-500 to-secondary-500'
                            }`}
                            style={{ width: isRejected || isWithdrawn ? 'calc(100% - 2.5rem)' : `calc(${(progressIndex / (STATUS_STAGES.length - 1)) * 100}% - 0.25rem)` }}
                          />

                          <div className="relative z-10 grid gap-5 md:grid-cols-5">
                            {STATUS_STAGES.map((stage, index) => {
                              const isActive = !isRejected && !isWithdrawn && progressIndex >= index;
                              const isCurrent = !isRejected && !isWithdrawn && progressIndex === index;

                              return (
                                <div key={stage.id} className="flex flex-col items-center text-center">
                                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                                    isActive
                                      ? 'border-brand-500 bg-brand-500 text-white'
                                      : 'border-slate-200 bg-white text-slate-300'
                                  }`}>
                                    {isActive ? <FiTrendingUp size={15} /> : <div className="h-2.5 w-2.5 rounded-full bg-current opacity-60" />}
                                  </div>
                                  <span className={`mt-3 text-xs font-bold uppercase tracking-[0.16em] ${isCurrent ? 'text-brand-700' : 'text-slate-500'}`}>
                                    {stage.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {canRespondToOffer ? (
                          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-bold text-emerald-800">You have received an offer for this role.</p>
                              <p className="mt-1 text-sm text-emerald-700">Choose whether to accept it and move this application forward, or reject it to close the offer.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleOfferResponse(app, 'accept')}
                                disabled={isUpdatingOffer}
                                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdatingOffer && offerActionState.decision === 'accept' ? 'Accepting...' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOfferResponse(app, 'reject')}
                                disabled={isUpdatingOffer}
                                className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdatingOffer && offerActionState.decision === 'reject' ? 'Rejecting...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {isRejected || isWithdrawn ? (
                          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <FiXCircle className="mt-0.5 shrink-0" size={16} />
                            <div>
                              <p className="font-bold">{isWithdrawn ? 'Application withdrawn' : 'Application closed out'}</p>
                              <p className="mt-1 text-red-600">
                                {isWithdrawn
                                  ? 'This application is no longer active in your pipeline.'
                                  : 'Use this result to tighten resume language and improve the next application.'}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {app.hrNotes ? (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Notes</p>
                            <p className="mt-2 leading-6">{app.hrNotes}</p>
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

        <aside className="space-y-5">
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Status mix</p>
            <h2 className="mt-3 text-2xl font-bold text-navy">How your pipeline is distributed</h2>
            <div className="mt-5 space-y-3">
              {[
                { label: 'Applied', value: state.applications.filter((item) => String(item.status || '').toLowerCase() === 'applied').length },
                { label: 'Shortlisted', value: counts.shortlisted },
                { label: 'Interviewed', value: counts.interviews },
                { label: 'Rejected', value: counts.rejected }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                  <span className="text-lg font-bold text-navy">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Next move</p>
            <h2 className="mt-3 text-2xl font-bold text-navy">Keep momentum high</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                Follow up on shortlisted roles before they go cold.
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                Use rejected roles to refine resume keywords and ATS fit.
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                Move interviewed roles into prep mode from the interviews page.
              </div>
            </div>

            <Link to="/portal/student/interviews" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
              Open interviews board
              <FiArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default StudentApplicationsPage;
