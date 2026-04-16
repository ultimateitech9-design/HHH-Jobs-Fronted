import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiTrash2
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentPrimaryButtonClassName,
  studentGhostButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import {
  applyToJob,
  formatDateTime,
  getFriendlyApplyErrorMessage,
  getStudentSavedJobs,
  removeSavedJobForStudent
} from '../services/studentApi';

const StudentSavedJobsPage = () => {
  const [state, setState] = useState({ loading: true, error: '', jobs: [] });
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    let mounted = true;

    const loadSaved = async () => {
      const response = await getStudentSavedJobs();
      if (!mounted) return;

      setState({
        loading: false,
        error: response.error || '',
        jobs: response.data || []
      });
    };

    loadSaved();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const roles = state.jobs.map((item) => item.job || {});
    const remoteCount = roles.filter((job) => /remote/i.test(String(job.jobLocation || ''))).length;

    return [
      {
        label: 'Saved Roles',
        value: String(state.jobs.length),
        helper: 'Opportunities you flagged for later'
      },
      {
        label: 'Remote Picks',
        value: String(remoteCount),
        helper: 'Saved roles with flexible location'
      },
      {
        label: 'Ready To Apply',
        value: String(state.jobs.length),
        helper: 'Each card stays one click away from apply'
      }
    ];
  }, [state.jobs]);

  const handleRemove = async (jobId) => {
    setNotice({ type: '', text: '' });

    try {
      await removeSavedJobForStudent(jobId);
      setState((current) => ({
        ...current,
        jobs: current.jobs.filter((item) => (item.jobId || item.job_id) !== jobId)
      }));
      setNotice({ type: 'success', text: 'Removed from saved jobs.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to remove saved job.' });
    }
  };

  const handleApply = async (jobId) => {
    setNotice({ type: '', text: '' });

    try {
      await applyToJob({ jobId, coverLetter: '' });
      setNotice({ type: 'success', text: 'Application submitted successfully.' });
    } catch (error) {
      setNotice({ type: 'error', text: getFriendlyApplyErrorMessage(error) });
    }
  };

  return (
    <StudentPageShell
      eyebrow="Saved Jobs"
      badge="Curated shortlist"
      title="Your saved opportunities, cleaned up and ready to act on"
      subtitle="Review the roles you bookmarked, revisit fit quickly, and convert promising matches into applications without losing momentum."
      heroSize="mini"
      stats={stats}
      actions={
        <>
          <Link to="/portal/student/jobs" className={`${studentPrimaryButtonClassName} px-4 py-2 text-[13px]`}>
            <FiBriefcase size={14} />
            Browse More Jobs
          </Link>
          <Link to="/portal/student/applications" className={`${studentSecondaryButtonClassName} px-4 py-2 text-[13px]`}>
            Open Applications
          </Link>
        </>
      }
    >
        {state.error ? <StudentNotice type="error" text={state.error} /> : null}
        {notice.text ? <StudentNotice type={notice.type} text={notice.text} /> : null}

        <StudentSurfaceCard
          eyebrow="Saved Pipeline"
          title="Roles worth revisiting"
          subtitle="Keep only the roles that still match your salary, location, and timing goals."
        >
          {state.loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-52 animate-pulse rounded-[1.8rem] bg-slate-100" />
              ))}
            </div>
          ) : state.jobs.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {state.jobs.map((item) => {
                const job = item.job || {};
                const jobId = item.jobId || item.job_id || job.id || job._id;

                return (
                  <article
                    key={item.id || jobId}
                    className="group relative overflow-hidden rounded-[1.9rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_26px_48px_rgba(15,23,42,0.12)]"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,155,23,0.12),transparent_35%),linear-gradient(135deg,rgba(47,83,143,0.05),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                          <FiBookmark size={20} />
                        </div>
                        <div>
                          <h3 className="font-heading text-xl font-bold text-navy">
                            {job.jobTitle || 'Saved role'}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-slate-500">{job.companyName || 'Unknown company'}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-700">
                        Saved
                      </span>
                    </div>

                    <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600">
                        <p className="flex items-center gap-2 font-semibold text-slate-500">
                          <FiMapPin size={14} />
                          Location
                        </p>
                        <p className="mt-2 font-semibold text-slate-800">{job.jobLocation || 'Not specified'}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600">
                        <p className="flex items-center gap-2 font-semibold text-slate-500">
                          <FiBriefcase size={14} />
                          Experience
                        </p>
                        <p className="mt-2 font-semibold text-slate-800">{job.experienceLevel || 'Flexible'}</p>
                      </div>
                    </div>

                    <div className="relative z-10 mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      <FiClock size={13} />
                      Saved on {formatDateTime(item.createdAt || item.created_at)}
                    </div>

                    <div className="relative z-10 mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                      <Link to={`/portal/student/jobs/${jobId}`} className={studentSecondaryButtonClassName}>
                        View Details
                        <FiArrowRight size={14} />
                      </Link>
                      <button type="button" className={studentGhostButtonClassName} onClick={() => handleRemove(jobId)}>
                        <FiTrash2 size={14} />
                        Remove
                      </button>
                      <button type="button" className={studentPrimaryButtonClassName} onClick={() => handleApply(jobId)}>
                        <FiCheckCircle size={15} />
                        Apply Now
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <StudentEmptyState
              icon={FiBookmark}
              title="No saved jobs yet"
              description="When a role looks promising but you are not ready to apply immediately, save it here and build your shortlist."
              action={
                <Link to="/portal/student/jobs" className={studentPrimaryButtonClassName}>
                  Browse Jobs
                </Link>
              }
            />
          )}
        </StudentSurfaceCard>
    </StudentPageShell>
  );
};

export default StudentSavedJobsPage;
