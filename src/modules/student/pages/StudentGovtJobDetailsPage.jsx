import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiBell,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiClock,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiInfo,
  FiMapPin,
  FiSave,
  FiShield,
  FiUsers
} from 'react-icons/fi';

import { getCurrentUser } from '../../../utils/auth';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentFieldClassName,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName,
  studentTextareaClassName
} from '../components/StudentExperience';
import {
  getPublicGovtJobById,
  getStudentGovtJobById,
  markStudentGovtJobApplied,
  updateStudentGovtJobTracker
} from '../services/studentApi';
import { buildGovtJobSeoPath, extractSeoPathSegment } from '../../../shared/utils/seoRoutes';

const QUAL_LABELS = {
  '10TH': '10th',
  '12TH': '12th',
  DIPLOMA: 'Diploma',
  GRADUATION: 'Graduation',
  POST_GRADUATION: 'Post Graduation'
};

const POST_TYPE_LABELS = {
  RECRUITMENT: 'Recruitment',
  RESULT: 'Result',
  ADMIT_CARD: 'Admit Card',
  ANSWER_KEY: 'Answer Key',
  SYLLABUS: 'Syllabus'
};

const verificationConfig = {
  VERIFIED: {
    label: 'Verified',
    title: 'Verified against official source',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    text: 'This listing has an official source match attached.'
  },
  OFFICIAL_LINKED: {
    label: 'Official Link',
    title: 'Official link matched',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    text: 'Official apply or notification link is available for this listing.'
  },
  SOURCE_ONLY: {
    label: 'Source Summary',
    title: 'Source summary',
    tone: 'border-slate-200 bg-slate-50 text-slate-600',
    text: 'Please verify all dates and eligibility on the official portal.'
  }
};

const compactButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60';

const compactPrimaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60';

const formatDate = (value) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (value) => {
  if (!value) return 'Not checked';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getDaysLeft = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(date);
  deadline.setHours(23, 59, 59, 999);
  return Math.ceil((deadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
};

const getDeadlineLabel = (job) => {
  const daysLeft = getDaysLeft(job?.lastDate);
  if (daysLeft === null) return formatDate(job?.lastDate);
  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Last day';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
};

const getDeadlineTone = (job) => {
  const daysLeft = getDaysLeft(job?.lastDate);
  if (daysLeft === null) return 'border-slate-200 bg-slate-50 text-slate-600';
  if (daysLeft < 0) return 'border-slate-200 bg-slate-100 text-slate-500';
  if (daysLeft <= 3) return 'border-red-200 bg-red-50 text-red-700';
  if (daysLeft <= 7) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const getHostnameLabel = (url) => {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return '';
  }
};

const getApplyUrl = (job) => job?.officialApplyUrl || job?.applyUrl || job?.officialUrl || '';
const getNotificationUrl = (job) => job?.officialNotificationUrl || job?.notifUrl || '';
const formatApplicationFee = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/free|see|notification|not specified/i.test(text)) return text;
  if (text.startsWith('₹')) return text;
  const normalized = text
    .replace(/\b(?:rs\.?|inr)\s*/gi, '₹')
    .replace(/₹\s+/g, '₹');
  if (normalized.includes('₹')) return normalized;
  const number = Number(normalized.replace(/,/g, ''));
  return Number.isFinite(number) ? `₹${number.toLocaleString('en-IN')}` : `₹${text}`;
};

const openExternal = (url, event) => {
  event?.preventDefault();
  event?.stopPropagation();

  if (!url) {
    toast.error('Official link is not available right now.');
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
};

const buildTrackerForm = (job) => ({
  status: job?.tracker?.status || (job?.hasApplied ? 'applied' : 'interested'),
  reminderEnabled: Boolean(job?.tracker?.reminderEnabled || job?.reminderEnabled),
  reminderDaysBefore: Number(job?.tracker?.reminderDaysBefore || 1),
  notes: job?.tracker?.notes || ''
});

const InfoTile = ({ icon: Icon, symbol, label, value, tone = 'default' }) => {
  const toneClass = tone === 'urgent'
    ? 'border-red-200 bg-red-50/80 text-red-700'
    : tone === 'success'
      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
      : 'border-slate-200 bg-slate-50/80 text-slate-800';

  return (
    <div className={`rounded-[1rem] border px-3 py-3 ${toneClass}`}>
      <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] opacity-70">
        {symbol ? <span aria-hidden="true" className="inline-flex text-[13px] font-black leading-none">{symbol}</span> : Icon ? <Icon size={13} /> : null}
        {label}
      </p>
      <p className="mt-2 text-sm font-bold leading-5">{value || 'Not specified'}</p>
    </div>
  );
};

const DetailBlock = ({ title, children, icon: Icon, tone = 'default' }) => {
  const toneClass = tone === 'success'
    ? 'border-emerald-100 bg-emerald-50/70'
    : tone === 'warning'
      ? 'border-amber-100 bg-amber-50/70'
      : 'border-slate-200 bg-white';

  return (
    <section className={`rounded-[1.2rem] border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="text-brand-600" size={17} /> : null}
        <h3 className="font-heading text-base font-bold text-navy">{title}</h3>
      </div>
      <div className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
        {children}
      </div>
    </section>
  );
};

const StudentGovtJobDetailsPage = ({ publicMode = false } = {}) => {
  const { jobId: jobParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const jobId = extractSeoPathSegment(jobParam);
  const currentUser = getCurrentUser();
  const canTrackGovtJobs = currentUser?.role === 'student';
  const isLoggedIn = Boolean(currentUser?.id);
  const listPath = publicMode && !canTrackGovtJobs ? '/govt-jobs' : '/portal/student/govt-jobs';
  const [state, setState] = useState({
    loading: true,
    error: '',
    job: null,
    viewer: { canTrackGovtJobs: false }
  });
  const [trackerForm, setTrackerForm] = useState(buildTrackerForm(null));
  const [actionBusy, setActionBusy] = useState('');
  const [notice, setNotice] = useState({ type: '', text: '' });

  const loadJob = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));

    const response = await (publicMode ? getPublicGovtJobById(jobId) : getStudentGovtJobById(jobId));
    const job = response.data?.job || null;

    setState({
      loading: false,
      error: response.error || (job ? '' : 'Government job not found.'),
      job,
      viewer: response.data?.viewer || { canTrackGovtJobs: false }
    });
    setTrackerForm(buildTrackerForm(job));
  }, [jobId, publicMode]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const job = state.job;
  const applyUrl = getApplyUrl(job);
  const notificationUrl = getNotificationUrl(job);
  const officialHost = getHostnameLabel(job?.officialUrl || applyUrl);
  const sourceHost = getHostnameLabel(job?.sourceUrl);
  const verification = verificationConfig[job?.verificationStatus] || verificationConfig.SOURCE_ONLY;
  const hasApplied = Boolean(job?.hasApplied || job?.tracker?.status === 'applied');
  const reminderEnabled = Boolean(job?.tracker?.reminderEnabled || job?.reminderEnabled);
  const isExpired = Boolean(job?.isExpired);

  useEffect(() => {
    if (!job) return;

    const cleanPath = buildGovtJobSeoPath(publicMode && !canTrackGovtJobs ? '/govt-jobs' : '/portal/student/govt-jobs', job);
    if (cleanPath && cleanPath !== location.pathname) {
      navigate(`${cleanPath}${location.search || ''}${location.hash || ''}`, { replace: true });
    }
  }, [canTrackGovtJobs, job, location.hash, location.pathname, location.search, navigate, publicMode]);

  const metricTiles = useMemo(() => {
    if (!job) return [];

    return [
      { icon: FiUsers, label: 'Vacancies', value: job.vacancies ? `${Number(job.vacancies).toLocaleString('en-IN')} posts` : 'See notification' },
      { icon: FiCalendar, label: 'Last Date', value: formatDate(job.lastDate), tone: getDaysLeft(job.lastDate) !== null && getDaysLeft(job.lastDate) >= 0 && getDaysLeft(job.lastDate) <= 7 ? 'urgent' : 'default' },
      { icon: FiClock, label: 'Start Date', value: job.startDate ? formatDate(job.startDate) : 'Available now' },
      { icon: FiBriefcase, label: 'Qualification', value: job.qualification || QUAL_LABELS[job.qualLevel] || 'As per notification' },
      { icon: FiUsers, label: 'Age Limit', value: job.ageMin && job.ageMax ? `${job.ageMin}-${job.ageMax} years` : 'See notification' },
      { symbol: '₹', label: 'Application Fee', value: formatApplicationFee(job.appFee) || 'See notification' },
      { icon: FiMapPin, label: 'State', value: job.state || 'All India' },
      { icon: FiFileText, label: 'Update Type', value: POST_TYPE_LABELS[job.postType] || job.postType || 'Recruitment' }
    ];
  }, [job]);

  const applyJobUpdate = (nextJob) => {
    if (!nextJob) return;
    setState((current) => ({ ...current, job: nextJob }));
    setTrackerForm(buildTrackerForm(nextJob));
  };

  const ensureTrackerAccess = () => {
    if (canTrackGovtJobs) return true;
    toast.error('Login with a registered student account to track government forms.');
    return false;
  };

  const handleSaveTracker = async (event) => {
    event?.preventDefault();
    if (!job || !ensureTrackerAccess()) return;

    const reminderFlag = trackerForm.status === 'applied' || isExpired ? false : Boolean(trackerForm.reminderEnabled);
    setActionBusy('tracker');
    setNotice({ type: '', text: '' });

    try {
      const result = await updateStudentGovtJobTracker(job.id, {
        status: trackerForm.status,
        reminderEnabled: reminderFlag,
        reminderDaysBefore: reminderFlag ? trackerForm.reminderDaysBefore : 1,
        notes: trackerForm.notes
      });
      applyJobUpdate(result.job);
      setNotice({ type: 'success', text: 'Govt job tracker saved.' });
      toast.success('Govt job tracker saved.');
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to save tracker.' });
      toast.error(error.message || 'Unable to save tracker.');
    } finally {
      setActionBusy('');
    }
  };

  const handleMarkApplied = async () => {
    if (!job || !ensureTrackerAccess()) return;
    setActionBusy('applied');
    setNotice({ type: '', text: '' });

    try {
      const result = await markStudentGovtJobApplied(job.id, {
        reminderEnabled: false,
        notes: trackerForm.notes
      });
      applyJobUpdate(result.job);
      setNotice({ type: 'success', text: 'Government form marked as filled.' });
      toast.success('Government form marked as filled.');
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to mark this form.' });
      toast.error(error.message || 'Unable to mark this form.');
    } finally {
      setActionBusy('');
    }
  };

  if (state.loading) {
    return (
      <div className={publicMode ? 'vw-shell flex min-h-[420px] items-center justify-center py-16' : 'flex min-h-[420px] items-center justify-center py-16'}>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className={publicMode ? 'vw-shell py-16' : 'py-12'}>
        <StudentEmptyState
          icon={FiAlertCircle}
          title="Government job not found"
          description={state.error || 'This listing is unavailable right now.'}
          action={(
            <Link to={listPath} className={studentPrimaryButtonClassName}>
              <FiChevronLeft size={15} />
              Back to Govt Jobs
            </Link>
          )}
        />
      </div>
    );
  }

  return (
    <StudentPageShell showHero={false} bodyClassName={publicMode ? 'vw-shell py-8 sm:py-10' : ''}>
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}
      {notice.text ? <StudentNotice type={notice.type} text={notice.text} /> : null}

      <StudentSurfaceCard className="!p-4 sm:!p-5 xl:!p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Link to={listPath} className={`${studentSecondaryButtonClassName} px-4 py-2 text-[13px]`}>
                <FiChevronLeft size={15} />
                Back
              </Link>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                {job.category || 'Govt'}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] ${verification.tone}`}>
                <FiShield size={12} />
                {verification.label}
              </span>
              <span className={`rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] ${getDeadlineTone(job)}`}>
                {getDeadlineLabel(job)}
              </span>
              {hasApplied ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  <FiCheckCircle size={12} />
                  Filled
                </span>
              ) : null}
              {reminderEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">
                  <FiBell size={12} />
                  Reminder
                </span>
              ) : null}
            </div>

            <h1 className="font-heading text-2xl font-black leading-tight text-navy sm:text-3xl">
              {job.title || 'Government job'}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
              <FiBriefcase size={15} />
              {job.organization || 'Official portal'}
              {job.department ? <span className="text-slate-300">/</span> : null}
              {job.department ? <span>{job.department}</span> : null}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              {job.description || 'Check the official notification before submitting the form.'}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-[340px] lg:grid-cols-1">
            <button
              type="button"
              onClick={(event) => openExternal(applyUrl, event)}
              disabled={!applyUrl}
              className={`${studentPrimaryButtonClassName} w-full px-4 py-3 text-[13px]`}
            >
              <FiExternalLink size={16} />
              Apply on Official Portal
            </button>
            {notificationUrl ? (
              <button
                type="button"
                onClick={(event) => openExternal(notificationUrl, event)}
                className={`${studentSecondaryButtonClassName} w-full px-4 py-3 text-[13px]`}
              >
                <FiFileText size={16} />
                Official Notification
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricTiles.map((item) => (
            <InfoTile key={item.label} {...item} />
          ))}
        </div>
      </StudentSurfaceCard>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-5">
          <StudentSurfaceCard
            eyebrow="Details"
            title="Eligibility and application information"
            className="!p-4 sm:!p-5 xl:!p-6"
          >
            <div className="grid gap-4">
              {job.whoCanApply ? (
                <DetailBlock title="Who can apply" icon={FiCheckCircle} tone="success">
                  {job.whoCanApply}
                </DetailBlock>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <DetailBlock title="Selection process" icon={FiFileText}>
                  {job.selectionProcess || 'Selection details are available in the official notification.'}
                </DetailBlock>
                <DetailBlock title="How to apply" icon={FiEdit2}>
                  {job.howToApply || 'Open the official portal, verify the notification, and submit the form there.'}
                </DetailBlock>
              </div>

              <DetailBlock title="About this update" icon={FiInfo}>
                {job.description || 'This government job update is available for review through the official source links.'}
              </DetailBlock>
            </div>
          </StudentSurfaceCard>

          <StudentSurfaceCard
            eyebrow="Official Source"
            title={verification.title}
            subtitle={verification.text}
            className="!p-4 sm:!p-5 xl:!p-6"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InfoTile icon={FiShield} label="Official Domain" value={officialHost || 'Pending match'} tone={officialHost ? 'success' : 'default'} />
              <InfoTile icon={FiFileText} label="Source" value={job.sourceName || sourceHost || 'Unknown source'} />
              <InfoTile icon={FiClock} label="Checked" value={formatDateTime(job.officialLastCheckedAt || job.verifiedAt)} />
              <InfoTile icon={FiCalendar} label="Posted / Updated" value={formatDate(job.updatedAt || job.createdAt)} />
            </div>
            {job.verificationNotes ? (
              <p className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                {job.verificationNotes}
              </p>
            ) : null}
          </StudentSurfaceCard>
        </div>

        <aside className="space-y-5">
          <StudentSurfaceCard
            eyebrow="Student Tracker"
            title={canTrackGovtJobs ? 'Save and edit tracker' : 'Track this form'}
            subtitle={canTrackGovtJobs ? 'Keep your form status, reminders, and notes attached to this vacancy.' : 'Registered student accounts can save form status and reminders.'}
            className="!p-4 sm:!p-5 xl:!p-6"
          >
            {canTrackGovtJobs ? (
              <form className="space-y-4" onSubmit={handleSaveTracker}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Form status</span>
                  <select
                    value={trackerForm.status}
                    onChange={(event) => {
                      const status = event.target.value;
                      setTrackerForm((current) => ({
                        ...current,
                        status,
                        reminderEnabled: status === 'applied' ? false : current.reminderEnabled
                      }));
                    }}
                    className={studentFieldClassName}
                  >
                    <option value="interested">Interested / saved</option>
                    <option value="applied">Form filled</option>
                    <option value="dismissed">Not applying</option>
                  </select>
                </label>

                <label className={`flex items-start gap-3 rounded-[1rem] border px-4 py-3 ${trackerForm.reminderEnabled ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                  <input
                    type="checkbox"
                    checked={trackerForm.reminderEnabled}
                    disabled={isExpired || trackerForm.status === 'applied'}
                    onChange={(event) => setTrackerForm((current) => ({ ...current, reminderEnabled: event.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-700">Deadline reminder</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {isExpired ? 'Deadline has already passed.' : trackerForm.status === 'applied' ? 'Filled forms do not need reminders.' : 'Email and dashboard notification before expiry.'}
                    </span>
                  </span>
                </label>

                {trackerForm.reminderEnabled ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">Remind before deadline</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={trackerForm.reminderDaysBefore}
                      onChange={(event) => setTrackerForm((current) => ({ ...current, reminderDaysBefore: event.target.value }))}
                      className={studentFieldClassName}
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Notes</span>
                  <textarea
                    rows={4}
                    value={trackerForm.notes}
                    onChange={(event) => setTrackerForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Roll number, payment reference, or form note"
                    className={studentTextareaClassName}
                  />
                </label>

                <div className="grid gap-2">
                  <button
                    type="submit"
                    disabled={Boolean(actionBusy)}
                    className={`${studentPrimaryButtonClassName} w-full px-4 py-2.5 text-[13px]`}
                  >
                    <FiSave size={15} />
                    {job.tracker ? 'Update Tracker' : 'Save to Tracker'}
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkApplied}
                    disabled={Boolean(actionBusy) || hasApplied}
                    className={`${hasApplied ? studentSecondaryButtonClassName : compactPrimaryButtonClassName} w-full px-4 py-2.5 text-[13px]`}
                  >
                    <FiCheckCircle size={15} />
                    {hasApplied ? 'Already Filled' : 'Mark Form Filled'}
                  </button>
                </div>
              </form>
            ) : isLoggedIn ? (
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
                <FiBookmark className="mb-2 text-slate-400" size={20} />
                Student account can track govt forms.
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login/student"
                  state={{ from: buildGovtJobSeoPath('/portal/student/govt-jobs', job), portalLabel: 'Login to Track Govt Jobs' }}
                  className={`${studentPrimaryButtonClassName} w-full px-4 py-2.5 text-[13px]`}
                >
                  <FiBookmark size={15} />
                  Student Login to Track
                </Link>
                <p className="text-xs leading-5 text-slate-500">
                  Login as a student to save this vacancy, mark filled forms, and set reminders.
                </p>
              </div>
            )}
          </StudentSurfaceCard>

          <StudentSurfaceCard
            eyebrow="Quick Summary"
            title="Vacancy snapshot"
            className="!p-4 sm:!p-5 xl:!p-6"
          >
            <dl className="space-y-3 text-sm">
              {[
                ['Organization', job.organization],
                ['Category', job.category],
                ['State', job.state || 'All India'],
                ['Last Date', formatDate(job.lastDate)],
                ['Status', getDeadlineLabel(job)],
                ['Qualification', QUAL_LABELS[job.qualLevel] || job.qualification],
                ['Source', job.sourceName || sourceHost || 'Official portal']
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="max-w-[60%] text-right font-bold text-slate-800">{value || 'Not specified'}</dd>
                </div>
              ))}
            </dl>
          </StudentSurfaceCard>

          <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
            <div className="mb-2 flex items-center gap-2 font-black">
              <FiAlertCircle size={17} />
              Important
            </div>
            <ul className="space-y-1 text-xs font-semibold leading-5">
              <li>- Verify every date from the official notification.</li>
              <li>- Apply only on the official government portal.</li>
              <li>- Do not pay fees through unofficial links.</li>
            </ul>
          </div>

          {job.sourceUrl ? (
            <button
              type="button"
              onClick={(event) => openExternal(job.sourceUrl, event)}
              className={`${compactButtonClassName} w-full`}
            >
              <FiExternalLink size={14} />
              View Source
            </button>
          ) : null}

          {reminderEnabled && job.tracker?.reminderAt ? (
            <div className="rounded-[1.2rem] border border-amber-200 bg-white px-4 py-4 text-sm font-semibold text-amber-800">
              <div className="flex items-center gap-2">
                <FiBell size={16} />
                Reminder set for {formatDate(job.tracker.reminderAt)}
              </div>
            </div>
          ) : null}

          {hasApplied && job.tracker?.appliedAt ? (
            <div className="rounded-[1.2rem] border border-emerald-200 bg-white px-4 py-4 text-sm font-semibold text-emerald-800">
              <div className="flex items-center gap-2">
                <FiCheckCircle size={16} />
                Filled on {formatDate(job.tracker.appliedAt)}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </StudentPageShell>
  );
};

export default StudentGovtJobDetailsPage;
