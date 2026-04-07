import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiMapPin,
  FiRefreshCw,
  FiUploadCloud
} from 'react-icons/fi';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import PortalDashboardHero from '../../../shared/components/dashboard/PortalDashboardHero';
import StatusPill from '../../../shared/components/StatusPill';
import useNotificationStore from '../../../core/notifications/notificationStore';
import { getCurrentUser } from '../../../utils/auth';
import { generateRetiredEmployeeId, generateStudentCandidateId } from '../../../utils/hrIdentity';
import {
  getStudentDashboardOverview,
  getStudentJobs,
  importStudentResume,
  updateStudentProfile,
  uploadStudentResume
} from '../services/studentApi';
import {
  applyImportedResumeToProfile,
  readResumeImportPayload,
  STUDENT_RESUME_ACCEPT,
  summarizeImportedProfileDraft,
  validateStudentResumeFile
} from '../utils/resumeImport';

const defaultOverview = {
  loading: true,
  error: '',
  profile: null,
  profileCompletion: 0,
  counters: {
    totalApplications: 0,
    savedJobs: 0,
    upcomingInterviews: 0,
    unreadNotifications: 0,
    atsChecks: 0
  },
  pipeline: {
    applied: 0,
    shortlisted: 0,
    interviewed: 0,
    offered: 0,
    rejected: 0,
    hired: 0,
    moved: 0
  },
  interviews: [],
  notifications: []
};

const StudentDashboardPage = () => {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isRetiredUser = currentUser?.role === 'retired_employee';
  const liveNotifications = useNotificationStore((store) => store.notifications);
  const notificationsHydrated = useNotificationStore((store) => store.hydrated);
  const resumeInputRef = useRef(null);
  const [overview, setOverview] = useState(defaultOverview);
  const [recommendedJobs, setRecommendedJobs] = useState({ jobs: [], loading: true });
  const [resumeCard, setResumeCard] = useState({ loading: false, type: '', text: '', summary: '' });

  const profileIdentity = useMemo(() => {
    if (isRetiredUser) {
      const id = currentUser?.retiredEmployeeId || generateRetiredEmployeeId({
        name: currentUser?.name || overview?.profile?.name || '',
        mobile: currentUser?.mobile || overview?.profile?.mobile || ''
      });
      return { label: 'Retired Employee ID', value: id };
    }
    const id = currentUser?.studentCandidateId || generateStudentCandidateId({
      name: currentUser?.name || overview?.profile?.name || '',
      mobile: currentUser?.mobile || overview?.profile?.mobile || ''
    });
    return { label: 'Student ID', value: id };
  }, [currentUser, isRetiredUser, overview?.profile?.mobile, overview?.profile?.name]);

  useEffect(() => {
    let mounted = true;
    const loadOverview = async () => {
      setOverview((current) => ({ ...current, loading: true, error: '' }));
      const response = await getStudentDashboardOverview();
      if (!mounted) return;
      const payload = response.data || {};
      setOverview({
        loading: false,
        error: response.error || '',
        isDemo: response.isDemo,
        profile: payload.profile || null,
        profileCompletion: Number(payload.profileCompletion || 0),
        counters: payload.counters || defaultOverview.counters,
        pipeline: payload.pipeline || defaultOverview.pipeline,
        interviews: payload.upcomingInterviews || [],
        notifications: payload.recentNotifications || []
      });
    };
    loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadJobs = async () => {
      setRecommendedJobs({ jobs: [], loading: true });
      const response = await getStudentJobs({ page: 1, limit: 3 });
      if (!mounted) return;
      setRecommendedJobs({
        jobs: (response.data?.jobs || []).slice(0, 3),
        loading: false
      });
    };
    loadJobs();
    return () => {
      mounted = false;
    };
  }, []);

  const userName = currentUser?.name || overview?.profile?.name || 'Explorer';
  const profileProgress = overview.profileCompletion || 45;
  const hasStoredResume = Boolean(overview.profile?.resumeUrl || overview.profile?.resumeText);
  const dashboardNotifications = notificationsHydrated ? liveNotifications : overview.notifications;
  const unreadNotifications = notificationsHydrated
    ? liveNotifications.filter((notification) => !notification.is_read).length
    : Number(overview.counters.unreadNotifications || 0);

  const statCards = [
    { label: 'Total Applications', value: overview.counters.totalApplications, icon: FiFileText, tone: 'info', helper: 'Applications tracked in your pipeline' },
    { label: 'Saved Jobs', value: overview.counters.savedJobs, icon: FiBookmark, tone: 'warning', helper: 'Roles you want to revisit' },
    { label: 'Upcoming Interviews', value: overview.counters.upcomingInterviews, icon: FiCalendar, tone: 'success', helper: 'Scheduled recruiter conversations' },
    { label: 'ATS Checks', value: overview.counters.atsChecks, icon: FiCheckCircle, tone: 'accent', helper: 'Resume scans against job fit' }
  ];

  const pipelineStages = [
    { label: 'Applied', count: overview.pipeline.applied },
    { label: 'Shortlisted', count: overview.pipeline.shortlisted },
    { label: 'Interviewed', count: overview.pipeline.interviewed },
    { label: 'Offered', count: overview.pipeline.offered },
    { label: 'Hired', count: overview.pipeline.hired },
    { label: 'Rejected', count: overview.pipeline.rejected }
  ];

  const actionItems = useMemo(() => {
    return [
      {
        title: profileProgress < 100 ? 'Complete your profile' : 'Keep profile fresh',
        description:
          profileProgress < 100
            ? `Your profile is ${profileProgress}% complete. Filling missing sections improves recruiter discovery.`
            : 'Your profile is recruiter-ready. Update it whenever skills or experience change.',
        to: '/portal/student/profile',
        status: profileProgress < 100 ? 'pending' : 'approved'
      },
      {
        title: overview.interviews.length > 0 ? 'Prepare for upcoming interviews' : 'Build more interview momentum',
        description:
          overview.interviews.length > 0
            ? `${overview.interviews.length} interview slots are already lined up.`
            : 'Apply consistently and tailor your resume to improve interview conversion.',
        to: '/portal/student/interviews',
        status: overview.interviews.length > 0 ? 'scheduled' : 'active'
      },
      {
        title: unreadNotifications > 0 ? 'Review recruiter updates' : 'Notifications are under control',
        description:
          unreadNotifications > 0
            ? `${unreadNotifications} unread alerts or recruiter messages are waiting.`
            : 'No unread alerts right now.'
        ,
        to: '/portal/student/notifications',
        status: unreadNotifications > 0 ? 'unread' : 'read'
      }
    ];
  }, [overview.interviews.length, profileProgress, unreadNotifications]);

  const handleDashboardResumeImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const validationMessage = validateStudentResumeFile(file);
    if (validationMessage) {
      setResumeCard({ loading: false, type: 'error', text: validationMessage, summary: '' });
      return;
    }

    setResumeCard({ loading: true, type: '', text: '', summary: '' });

    try {
      const payload = await readResumeImportPayload(file);
      const imported = await importStudentResume(payload);
      let uploadSummary = { resumeUrl: '', resumeText: '', warnings: [] };

      try {
        uploadSummary = await uploadStudentResume(file);
      } catch (error) {
        uploadSummary = {
          resumeUrl: '',
          resumeText: '',
          warnings: [error.message || 'Resume file upload failed.']
        };
      }

      const warnings = [...(imported.warnings || []), ...(uploadSummary.warnings || [])].filter(Boolean);
      const nextProfile = applyImportedResumeToProfile({
        currentProfile: overview.profile || {},
        importedDraft: imported.profileDraft || {},
        uploadSummary,
        fallbackResumeText: payload.resumeText
      });
      const savedProfile = await updateStudentProfile(nextProfile);
      const importSummary = summarizeImportedProfileDraft(savedProfile);

      setOverview((current) => ({
        ...current,
        profile: { ...(current.profile || {}), ...savedProfile }
      }));
      setResumeCard({
        loading: false,
        type: 'success',
        text: warnings.length ? `Resume imported and profile updated. ${warnings.join(' ')}` : 'Resume imported and profile updated.',
        summary: `Updated ${importSummary}.`
      });
    } catch (error) {
      setResumeCard({
        loading: false,
        type: 'error',
        text: error.message || 'Unable to import resume right now.',
        summary: ''
      });
    }
  };

  if (overview.loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {overview.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600">
          <span className="font-semibold">{overview.error}</span>
        </div>
      ) : null}

      <PortalDashboardHero
        tone="student"
        eyebrow={isRetiredUser ? 'Retired Professional Workspace' : 'Student Dashboard'}
        badge={profileIdentity.label}
        title={`Welcome back, ${userName}`}
        description={
          isRetiredUser
            ? 'Bring your experience back into the market with a profile, pipeline, and opportunity flow built for retired professionals.'
            : 'Track applications, improve profile strength, and stay close to the jobs, interviews, and alerts that move your search forward.'
        }
        chips={[profileIdentity.value, `${profileProgress}% profile strength`, `${unreadNotifications} unread alerts`]}
        primaryAction={{ to: '/portal/student/profile', label: 'Open Profile' }}
        secondaryAction={{ to: '/portal/student/jobs', label: 'Browse Jobs' }}
        metrics={[
          {
            label: 'Profile strength',
            value: `${profileProgress}%`,
            helper: profileProgress < 100 ? 'Complete more details to improve matching' : 'Profile is in strong shape'
          },
          {
            label: 'Applications',
            value: String(overview.counters.totalApplications || 0),
            helper: 'Active job search volume'
          },
          {
            label: 'Upcoming interviews',
            value: String(overview.counters.upcomingInterviews || 0),
            helper: 'Scheduled recruiter conversations'
          },
          {
            label: 'ATS checks',
            value: String(overview.counters.atsChecks || 0),
            helper: 'Resume fit checks completed'
          }
        ]}
      />

      <DashboardMetricCards cards={statCards} />

      <DashboardSectionCard
        eyebrow="Application Pipeline"
        title="Where your applications stand"
        subtitle="Track your current movement from application through offer stage."
        action={
          <Link to="/portal/student/applications" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            Open Applications
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {pipelineStages.map((stage) => (
            <article key={stage.label} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm font-semibold text-slate-500">{stage.label}</p>
              <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{stage.count}</p>
            </article>
          ))}
        </div>
      </DashboardSectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardSectionCard
          eyebrow="Top Picks"
          title="Recommended jobs for you"
          subtitle="Fresh opportunities pulled from the marketplace based on your current profile."
          action={
            <Link to="/portal/student/jobs" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              Browse Marketplace
            </Link>
          }
        >
          {recommendedJobs.loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-[1.4rem] bg-slate-100" />
              ))}
            </div>
          ) : recommendedJobs.jobs.length > 0 ? (
            <div className="space-y-3">
              {recommendedJobs.jobs.map((job) => (
                <div
                  key={job.id || job._id}
                  className="flex flex-col justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                      <FiBriefcase size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{job.jobTitle || 'Untitled Role'}</p>
                      <p className="mt-1 text-sm text-slate-500">{job.companyName || 'Unknown Company'}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          <FiMapPin className="mr-1" size={12} /> {job.jobLocation || 'Remote'}
                        </span>
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          INR {job.minPrice || '-'} - {job.maxPrice || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/portal/student/jobs/${job.id || job._id}`}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                  >
                    View details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              No matching jobs are available right now. Update your profile to improve recommendations.
            </div>
          )}
        </DashboardSectionCard>

        <div className="space-y-6">
          <DashboardSectionCard
            eyebrow="Resume Import"
            title="Turn resume into profile data"
            subtitle="Upload once to extract headline, skills, education, and keep one-click apply ready."
          >
            <div className="space-y-4">
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">{hasStoredResume ? 'Profile resume is already stored.' : 'No profile resume is stored yet.'}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Upload PDF, DOC, DOCX, or TXT and we will pull structured profile data from it automatically.
                </p>
              </div>

              <input
                ref={resumeInputRef}
                type="file"
                accept={STUDENT_RESUME_ACCEPT}
                className="hidden"
                data-testid="student-dashboard-resume-input"
                onChange={handleDashboardResumeImport}
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={resumeCard.loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {resumeCard.loading ? <FiRefreshCw className="animate-spin" /> : <FiUploadCloud />}
                  {resumeCard.loading ? 'Importing Resume...' : (hasStoredResume ? 'Replace Resume' : 'Upload Resume')}
                </button>
                <Link
                  to="/portal/student/profile?section=resume"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-700"
                >
                  Open Full Resume Section <FiArrowRight size={14} />
                </Link>
              </div>

              {resumeCard.text ? (
                <div className={`rounded-[1.4rem] border px-4 py-4 text-sm ${resumeCard.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                  <p className="font-semibold">{resumeCard.text}</p>
                  {resumeCard.summary ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em]">{resumeCard.summary}</p> : null}
                </div>
              ) : null}
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            eyebrow="Next Moves"
            title="Career signals that need attention"
            subtitle="Quick actions that keep your search active and recruiter-ready."
          >
            <div className="space-y-3">
              {actionItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.to}
                  className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </div>
                  <StatusPill value={item.status} />
                </Link>
              ))}

              <Link
                to="/portal/student/ats"
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Run Resume ATS Check
              </Link>
            </div>
          </DashboardSectionCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSectionCard
          eyebrow="Interviews"
          title="Upcoming interview schedule"
          action={
            <Link to="/portal/student/interviews" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              Open Interviews
            </Link>
          }
        >
          <ul className="space-y-3">
            {overview.interviews.length > 0 ? (
              overview.interviews.map((interview, index) => (
                <li key={interview.id || `interview-${index}`} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{interview.companyName || 'Interview scheduled'}</p>
                    <p className="mt-1 text-sm text-slate-500">{interview.type || 'Virtual'} interview</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {interview.date || interview.scheduledAt || 'Soon'}
                    </p>
                  </div>
                  <StatusPill value={interview.status || 'scheduled'} />
                </li>
              ))
            ) : (
              <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No interviews scheduled yet. Keep applications moving to build more recruiter conversations.
              </li>
            )}
          </ul>
        </DashboardSectionCard>

        <DashboardSectionCard
          eyebrow="Notifications"
          title="Recent recruiter updates"
          action={
            <Link to="/portal/student/notifications" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              Open Notifications
            </Link>
          }
        >
          <ul className="space-y-3">
            {dashboardNotifications.length > 0 ? (
              dashboardNotifications.slice(0, 6).map((notification, index) => (
                <li key={notification.id || `notification-${index}`} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{notification.title || notification.subject || notification.type || 'Portal update'}</p>
                    <p className="mt-1 text-sm text-slate-500">{notification.message || notification.description || 'A new update is available in your dashboard.'}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {notification.created_at || notification.createdAt || notification.updated_at || notification.updatedAt || notification.time || 'Recently'}
                    </p>
                  </div>
                  <StatusPill value={notification.is_read ? 'read' : 'unread'} />
                </li>
              ))
            ) : (
              <li className="rounded-[1.4rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No recent notifications are waiting for you.
              </li>
            )}
          </ul>
        </DashboardSectionCard>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
