import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FiBriefcase,
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiFilter,
  FiTarget,
  FiTrendingUp,
  FiXCircle
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentPrimaryButtonClassName
} from '../components/StudentExperience';
import { formatDateTime, getStudentApplications } from '../services/studentApi';

const STATUS_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interviewed', label: 'Interviewed' },
  { id: 'offered', label: 'Offered' },
  { id: 'hired', label: 'Hired' }
];

const StudentApplicationsPage = () => {
  const [state, setState] = useState({ loading: true, error: '', isDemo: false, applications: [] });
  const [statusFilter, setStatusFilter] = useState('all');

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

  const topStats = useMemo(() => {
    const total = state.applications.length;
    const shortlisted = state.applications.filter((item) => String(item.status || '').toLowerCase() === 'shortlisted').length;
    const interviews = state.applications.filter((item) => String(item.status || '').toLowerCase() === 'interviewed').length;

    return [
      {
        label: 'Tracked Applications',
        value: String(total),
        helper: 'Everything currently in your pipeline'
      },
      {
        label: 'Shortlisted',
        value: String(shortlisted),
        helper: 'Applications that moved beyond first review'
      },
      {
        label: 'Interview Stage',
        value: String(interviews),
        helper: 'Roles already close to recruiter conversations'
      }
    ];
  }, [state.applications]);

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
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

  const getTimelineProgress = (currentStatus) => {
    if (currentStatus === 'rejected') return -1;
    const index = STATUS_STAGES.findIndex((stage) => stage.id === currentStatus);
    return index >= 0 ? index : 0;
  };

  return (
    <StudentPageShell
      eyebrow="Applications"
      badge="Pipeline"
      title="Track every application with clearer movement and less guesswork"
      subtitle="See which roles are still at apply stage, where shortlists are building, and which opportunities are ready for interview preparation."
      stats={topStats}
    >
      {state.isDemo ? <StudentNotice type="info" text="Demo mode is active, so sample application records are being shown." /> : null}
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}

      <StudentSurfaceCard
        eyebrow="Filters"
        title="Focus the pipeline"
        subtitle="Switch between statuses to instantly isolate where your applications are getting stuck or improving."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            {['all', ...STATUS_STAGES.map((stage) => stage.id), 'rejected'].map((status) => (
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
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </StudentSurfaceCard>

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
            const progressIndex = getTimelineProgress(currentStatus);
            const isRejected = currentStatus === 'rejected';

            return (
              <StudentSurfaceCard
                key={app.id || app._id}
                eyebrow="Application Card"
                title={app.jobTitle || app.job?.jobTitle || 'Untitled Role'}
                subtitle={app.companyName || app.job?.companyName || 'Unknown company'}
                action={targetId ? (
                  <Link to={`/portal/student/jobs/${targetId}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
                    View Job
                    <FiChevronRight size={14} />
                  </Link>
                ) : null}
              >
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${getStatusColor(currentStatus)}`}>
                      {currentStatus}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                      <FiClock size={12} />
                      Updated {formatDateTime(app.statusUpdatedAt)}
                    </span>
                  </div>

                  <div className="relative rounded-[1.8rem] border border-slate-200 bg-slate-50/80 px-4 py-6">
                    <div className="absolute left-8 right-8 top-10 h-1 rounded-full bg-white" />
                    <div
                      className={`absolute left-8 top-10 h-1 rounded-full transition-all duration-700 ${isRejected ? 'bg-red-500' : 'bg-gradient-to-r from-brand-500 to-secondary-500'}`}
                      style={{ width: isRejected ? 'calc(100% - 4rem)' : `calc(${(progressIndex / (STATUS_STAGES.length - 1)) * 100}% - 0.5rem)` }}
                    />

                    <div className="relative z-10 grid gap-5 md:grid-cols-5">
                      {STATUS_STAGES.map((stage, index) => {
                        const isActive = !isRejected && progressIndex >= index;
                        const isCurrent = !isRejected && progressIndex === index;

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

                    {isRejected ? (
                      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <FiXCircle className="mt-0.5 shrink-0" size={16} />
                        <div>
                          <p className="font-bold">Application closed out</p>
                          <p className="mt-1 text-red-600">Use the same role to refine resume language and improve the next application.</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </StudentSurfaceCard>
            );
          })}
        </div>
      ) : (
        <StudentEmptyState
          icon={FiBriefcase}
          title="No applications found"
          description="You have not applied to any roles under this filter yet. Start applying to build your live pipeline."
          action={
            <Link to="/portal/student/jobs" className={studentPrimaryButtonClassName}>
              Browse Jobs
            </Link>
          }
        />
      )}
    </StudentPageShell>
  );
};

export default StudentApplicationsPage;
