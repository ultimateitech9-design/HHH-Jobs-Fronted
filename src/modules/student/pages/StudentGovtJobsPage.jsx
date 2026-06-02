import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiBell,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiFilter,
  FiMapPin,
  FiSearch,
  FiShield,
  FiX
} from 'react-icons/fi';

import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentPrimaryButtonClassName
} from '../components/StudentExperience';
import {
  getPublicGovtJobs,
  getStudentGovtJobs,
  markStudentGovtJobApplied,
  setStudentGovtJobReminder,
  updateStudentGovtJobTracker
} from '../services/studentApi';
import { getCurrentUser } from '../../../utils/auth';

const makeDefaultFilters = () => ({
  search: '',
  category: '',
  state: '',
  qualLevel: '',
  postType: '',
  status: 'open',
  tracked: false,
  page: 1,
  limit: 24
});

const POST_TYPE_OPTIONS = [
  { value: '', label: 'All', fullLabel: 'All updates' },
  { value: 'RECRUITMENT', label: 'Jobs', fullLabel: 'Recruitment' },
  { value: 'RESULT', label: 'Results', fullLabel: 'Results' },
  { value: 'ADMIT_CARD', label: 'Admit', fullLabel: 'Admit Card' },
  { value: 'ANSWER_KEY', label: 'Keys', fullLabel: 'Answer Key' },
  { value: 'SYLLABUS', label: 'Syllabus', fullLabel: 'Syllabus' }
];

const QUAL_LABELS = {
  '8TH': '8th',
  '10TH': '10th',
  '12TH': '12th',
  DIPLOMA: 'Diploma',
  GRADUATION: 'Graduation',
  POST_GRADUATION: 'Post Graduation',
  PHD: 'PhD'
};

const compactButtonClassName =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60';

const compactPrimaryButtonClassName =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-navy px-2.5 py-1.5 text-[11px] font-black text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60';

const govtJobGridClassName = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5';

const buildFiltersFromSearchParams = (searchParams) => {
  const page = parseInt(searchParams.get('page') || '', 10);
  const tracked = ['1', 'true', 'yes'].includes(String(searchParams.get('tracked') || '').toLowerCase());

  return {
    ...makeDefaultFilters(),
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    state: searchParams.get('state') || '',
    qualLevel: searchParams.get('qualLevel') || '',
    postType: searchParams.get('postType') || '',
    status: searchParams.get('status') || 'open',
    tracked,
    page: Number.isNaN(page) || page < 1 ? 1 : page
  };
};

const formatDate = (value) => {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
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
  const daysLeft = getDaysLeft(job.lastDate);
  if (daysLeft === null) return formatDate(job.lastDate);
  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Last day';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
};

const getDeadlineTone = (job) => {
  if ((job.postType || 'RECRUITMENT') !== 'RECRUITMENT') return 'border-slate-200 bg-slate-50 text-slate-600';
  const daysLeft = getDaysLeft(job.lastDate);
  if (daysLeft === null) return 'border-slate-200 bg-slate-50 text-slate-600';
  if (daysLeft < 0) return 'border-slate-200 bg-slate-100 text-slate-500';
  if (daysLeft <= 3) return 'border-red-200 bg-red-50 text-red-700';
  if (daysLeft <= 7) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const getPostTypeMeta = (value = 'RECRUITMENT') =>
  POST_TYPE_OPTIONS.find((item) => item.value === value) || POST_TYPE_OPTIONS[1];

const getPrimaryDateLabel = (job = {}) => {
  const postType = job.postType || 'RECRUITMENT';
  if (postType === 'RESULT') return `Result: ${formatDate(job.resultDate || job.updatedAt || job.lastDate)}`;
  if (postType === 'ADMIT_CARD') return `Exam: ${formatDate(job.examDate || job.lastDate)}`;
  if (postType === 'ANSWER_KEY') return `Key: ${formatDate(job.examDate || job.updatedAt || job.lastDate)}`;
  if (postType === 'SYLLABUS') return `Updated: ${formatDate(job.updatedAt || job.lastDate)}`;
  return `Last date: ${formatDate(job.lastDate)}`;
};

const getTopDateLabel = (job = {}) => {
  if ((job.postType || 'RECRUITMENT') === 'RECRUITMENT') return getDeadlineLabel(job);
  return formatDate(job.resultDate || job.examDate || job.updatedAt || job.lastDate);
};

const normalizeFacetName = (item) => String(item?.name || '').trim();

const getFacetCount = (items = [], name = '') => {
  const normalized = String(name || '').trim().toUpperCase();
  const match = (items || []).find((item) => String(item?.name || '').trim().toUpperCase() === normalized);
  return Number(match?.count || 0);
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

const isInteractiveTarget = (target) =>
  typeof Element !== 'undefined' && target instanceof Element && Boolean(target.closest('a,button,input,select,textarea,label'));

const GovtJobCard = ({ job, detailPath, canTrackGovtJobs, isLoggedIn, onOpenDetails, onMarkApplied, onToggleReminder, actionBusy }) => {
  const hasApplied = Boolean(job.hasApplied || job.tracker?.status === 'applied');
  const reminderEnabled = Boolean(job.tracker?.reminderEnabled || job.reminderEnabled);
  const isExpired = Boolean(job.isExpired);
  const applyUrl = job.officialApplyUrl || job.applyUrl || job.officialUrl;
  const notificationUrl = job.officialNotificationUrl || job.notifUrl;
  const postTypeMeta = getPostTypeMeta(job.postType || 'RECRUITMENT');

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={(event) => {
        if (isInteractiveTarget(event.target)) return;
        onOpenDetails?.();
      }}
      onKeyDown={(event) => {
        if (isInteractiveTarget(event.target)) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpenDetails?.();
      }}
      className="group flex min-h-[220px] cursor-pointer flex-col justify-between rounded-[1rem] border border-slate-200/80 bg-white p-3 shadow-[0_10px_22px_rgba(15,23,42,0.04)] outline-none transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_16px_32px_rgba(15,23,42,0.075)] focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
                {postTypeMeta.label}
              </span>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-blue-700">
                {job.category || 'Govt'}
              </span>
              {job.verificationStatus === 'VERIFIED' || job.verificationStatus === 'OFFICIAL_LINKED' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
                  <FiShield size={10} />
                  Official
                </span>
              ) : null}
              {hasApplied ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
                  <FiCheckCircle size={10} />
                  Filled
                </span>
              ) : null}
            </div>

            <Link to={detailPath} className="mt-2.5 block">
              <h2 className="line-clamp-2 font-heading text-[15px] font-black leading-snug text-navy transition group-hover:text-brand-700">
                {job.title || 'Government job'}
              </h2>
            </Link>
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{job.organization || 'Official portal'}</p>
          </div>

          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${getDeadlineTone(job)}`}>
            {getTopDateLabel(job)}
          </span>
        </div>

        <div className="mt-3 grid gap-1.5 text-[11px] font-semibold text-slate-600">
          <p className="flex items-center gap-2">
            <FiCalendar className="shrink-0 text-slate-400" size={12} />
            <span>{getPrimaryDateLabel(job)}</span>
          </p>
          <p className="flex items-center gap-2">
            <FiBriefcase className="shrink-0 text-slate-400" size={12} />
            <span className="line-clamp-1">{job.qualification || 'As per notification'}</span>
          </p>
          <p className="flex items-center gap-2">
            <FiMapPin className="shrink-0 text-slate-400" size={12} />
            <span className="line-clamp-1">{job.state || 'All India'}{job.vacancies ? `, ${Number(job.vacancies).toLocaleString('en-IN')} posts` : ''}</span>
          </p>
        </div>

        <p className="mt-3 line-clamp-1 text-xs leading-5 text-slate-500">
          {job.description || 'Check the official notification before submitting the form.'}
        </p>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {reminderEnabled ? (
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            <FiBell size={12} />
            Reminder {job.tracker?.reminderAt ? formatDate(job.tracker.reminderAt) : 'active'}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          <Link
            to={detailPath}
            className={compactButtonClassName}
          >
            Details
            <FiChevronRight size={12} />
          </Link>

          <button
            type="button"
            onClick={(event) => openExternal(applyUrl, event)}
            className={compactPrimaryButtonClassName}
          >
            <FiExternalLink size={12} />
            Apply
          </button>

          {notificationUrl ? (
            <button
              type="button"
              onClick={(event) => openExternal(notificationUrl, event)}
              className={compactButtonClassName}
            >
              Notice
            </button>
          ) : null}

          {canTrackGovtJobs ? (
            <>
              <button
                type="button"
                onClick={() => onMarkApplied(job)}
                disabled={actionBusy || hasApplied}
                className={hasApplied ? compactButtonClassName : compactPrimaryButtonClassName}
              >
                <FiCheckCircle size={12} />
                {hasApplied ? 'Filled' : 'Mark Filled'}
              </button>

              {!isExpired ? (
                <button
                  type="button"
                  onClick={() => onToggleReminder(job)}
                  disabled={actionBusy}
                  className={compactButtonClassName}
                >
                  {reminderEnabled ? <FiX size={12} /> : <FiBell size={12} />}
                  {reminderEnabled ? 'Remove Reminder' : 'Reminder'}
                </button>
              ) : null}
            </>
          ) : isLoggedIn ? (
            <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-500">
              Student account can track
            </span>
          ) : (
            <Link
              to="/login/student"
              state={{ from: '/portal/student/govt-jobs', portalLabel: 'Login to Track Govt Jobs' }}
              className={compactButtonClassName}
            >
              <FiBookmark size={12} />
              Login to Track
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

const StudentGovtJobsPage = ({ publicMode = false } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchParamsKey = searchParams.toString();
  const currentUser = getCurrentUser();
  const canTrackGovtJobs = currentUser?.role === 'student';
  const isLoggedIn = Boolean(currentUser?.id);
  const [filters, setFilters] = useState(() => buildFiltersFromSearchParams(searchParams));
  const [state, setState] = useState({
    jobs: [],
    pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
    counts: { open: 0, expired: 0, byPostType: {} },
    facets: { categories: [], states: [], qualifications: [], postTypes: [] },
    summary: { tracked: 0, applied: 0, reminders: 0, expiringSoon: 0, recent: [] },
    loading: true,
    error: ''
  });
  const [actionBusyId, setActionBusyId] = useState('');

  useEffect(() => {
    setFilters(buildFiltersFromSearchParams(searchParams));
  }, [searchParams, searchParamsKey]);

  const pushFiltersToUrl = useCallback((nextFilters) => {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === false) return;
      if (key === 'status' && value === 'open') return;
      if (key === 'page' && Number(value) === 1) return;
      if (key === 'limit') return;
      params.set(key, String(value));
    });
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (canTrackGovtJobs || !filters.tracked) return;

    const next = {
      ...filters,
      status: filters.status === 'all' ? 'open' : filters.status,
      tracked: false,
      page: 1
    };
    setFilters(next);
    pushFiltersToUrl(next);
  }, [canTrackGovtJobs, filters, pushFiltersToUrl]);

  const loadJobs = useCallback(async (currentFilters) => {
    const requestFilters = canTrackGovtJobs
      ? currentFilters
      : { ...currentFilters, tracked: false };

    setState((current) => ({
      ...current,
      loading: current.jobs.length === 0,
      error: ''
    }));

    const response = await (publicMode ? getPublicGovtJobs(requestFilters) : getStudentGovtJobs(requestFilters));
    setState({
      jobs: response.data?.jobs || [],
      pagination: response.data?.pagination || { page: requestFilters.page, limit: requestFilters.limit, total: 0, totalPages: 1 },
      counts: response.data?.counts || { open: 0, expired: 0, byPostType: {} },
      facets: response.data?.facets || { categories: [], states: [], qualifications: [], postTypes: [] },
      summary: response.data?.summary || { tracked: 0, applied: 0, reminders: 0, expiringSoon: 0, recent: [] },
      loading: false,
      error: response.error || ''
    });
  }, [canTrackGovtJobs, publicMode]);

  useEffect(() => {
    loadJobs(filters);
  }, [filters, loadJobs]);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value, page: 1 };
    setFilters(next);
    pushFiltersToUrl(next);
  };

  const resetFilters = () => {
    const next = makeDefaultFilters();
    setFilters(next);
    pushFiltersToUrl(next);
  };

  const setPage = (page) => {
    const next = { ...filters, page };
    setFilters(next);
    pushFiltersToUrl(next);
  };

  const refreshAfterAction = async (nextJob) => {
    if (nextJob?.id) {
      setState((current) => ({
        ...current,
        jobs: current.jobs.map((job) => (job.id === nextJob.id ? nextJob : job))
      }));
    }
    await loadJobs(filters);
  };

  const handleMarkApplied = async (job) => {
    if (!canTrackGovtJobs) {
      toast.error('Login with a registered student account to track government forms.');
      return;
    }

    setActionBusyId(job.id);
    try {
      const result = await markStudentGovtJobApplied(job.id, {
        reminderEnabled: false,
        notes: job.tracker?.notes || ''
      });
      toast.success('Government form marked as filled.');
      await refreshAfterAction(result.job);
    } catch (error) {
      toast.error(error.message || 'Unable to mark this form.');
    } finally {
      setActionBusyId('');
    }
  };

  const handleToggleReminder = async (job) => {
    if (!canTrackGovtJobs) {
      toast.error('Login with a registered student account to set reminders.');
      return;
    }

    const reminderEnabled = Boolean(job.tracker?.reminderEnabled || job.reminderEnabled);
    const status = job.tracker?.status || (job.hasApplied ? 'applied' : 'interested');

    setActionBusyId(job.id);
    try {
      const result = reminderEnabled
        ? await updateStudentGovtJobTracker(job.id, {
          status,
          reminderEnabled: false,
          reminderDaysBefore: job.tracker?.reminderDaysBefore || 1,
          notes: job.tracker?.notes || ''
        })
        : await setStudentGovtJobReminder(job.id, {
          status,
          reminderDaysBefore: 1,
          notes: job.tracker?.notes || ''
        });

      toast.success(reminderEnabled ? 'Reminder removed.' : 'Reminder set for this govt job.');
      await refreshAfterAction(result.job);
    } catch (error) {
      toast.error(error.message || 'Unable to update reminder.');
    } finally {
      setActionBusyId('');
    }
  };

  const hasFilters = useMemo(
    () => Boolean(filters.search || filters.category || filters.state || filters.qualLevel || filters.postType || filters.tracked || filters.status !== 'open'),
    [filters]
  );

  const getPostTypeBadgeCount = (postType) => {
    const bucket = filters.status === 'expired' ? 'expired' : filters.status === 'all' ? 'total' : 'open';
    if (!postType) {
      if (bucket === 'expired') return Number(state.counts.expired || 0);
      if (bucket === 'open') return Number(state.counts.open || 0);
      return Object.values(state.counts.byPostType || {}).reduce((total, item) => total + Number(item?.total || 0), 0);
    }

    const summary = state.counts.byPostType?.[postType];
    if (summary) return Number(summary[bucket] || 0);
    return getFacetCount(state.facets.postTypes, postType);
  };

  const stats = useMemo(() => ([
    {
      label: 'Open',
      value: Number(state.counts.open || 0).toLocaleString('en-IN'),
      icon: FiBriefcase
    },
    canTrackGovtJobs
      ? {
        label: 'Filled Forms',
        value: Number(state.summary.applied || 0).toLocaleString('en-IN'),
        icon: FiCheckCircle,
        tone: 'success'
      }
      : {
        label: 'Results',
        value: Number(state.counts.byPostType?.RESULT?.open || 0).toLocaleString('en-IN'),
        icon: FiFilter,
        tone: 'info'
      },
    canTrackGovtJobs
      ? {
        label: 'Reminders',
        value: Number(state.summary.reminders || 0).toLocaleString('en-IN'),
        icon: FiBell,
        tone: 'warning'
      }
      : {
        label: 'Admit',
        value: Number(state.counts.byPostType?.ADMIT_CARD?.open || 0).toLocaleString('en-IN'),
        icon: FiCalendar,
        tone: 'warning'
      }
  ]), [canTrackGovtJobs, state.counts.byPostType, state.counts.open, state.summary.applied, state.summary.reminders]);

  return (
    <StudentPageShell
      eyebrow="Govt Jobs"
      badge={canTrackGovtJobs ? 'Student tracker' : 'Public vacancies'}
      title={canTrackGovtJobs ? 'Govt jobs and form tracker' : 'Govt jobs, results and admit cards'}
      subtitle={canTrackGovtJobs
        ? 'Browse official updates, apply on the govt portal, then track filled forms and reminders inside HHH Jobs.'
        : 'Browse govt vacancies, results, admit cards, answer keys, syllabus updates, official links, eligibility, states, and deadlines.'}
      stats={stats}
      heroSize="mini"
      statsLayout="inline"
      heroClassName="!rounded-[1.45rem] sm:!rounded-[1.75rem]"
      bodyClassName={publicMode ? 'vw-shell py-5 sm:py-6' : ''}
      actions={(
        <>
          {canTrackGovtJobs ? (
            <>
              <button
                type="button"
                onClick={() => updateFilter('tracked', true)}
                className={compactPrimaryButtonClassName}
              >
                <FiBookmark size={13} />
                My Tracked Forms
              </button>
              <Link to="/portal/student/notifications" className={compactButtonClassName}>
                <FiBell size={13} />
                Notifications
              </Link>
            </>
          ) : !isLoggedIn ? (
            <Link
              to="/login/student"
              state={{ from: '/portal/student/govt-jobs', portalLabel: 'Login to Track Govt Jobs' }}
              className={compactPrimaryButtonClassName}
            >
              <FiBookmark size={13} />
              Student Login to Track
            </Link>
          ) : (
            <span className={compactButtonClassName}>
              <FiBookmark size={13} />
              Student account required to track
            </span>
          )}
        </>
      )}
    >
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}

      <StudentSurfaceCard className="!p-3.5 sm:!p-4 xl:!p-4">
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1.8fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(140px,0.75fr)_auto] xl:items-center">
          <div className="relative min-w-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Search title or organization"
              className="h-10 w-full rounded-[14px] border border-slate-200 bg-white px-3 pl-9 text-[13px] font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <select
            value={filters.category}
            onChange={(event) => updateFilter('category', event.target.value)}
            className="h-10 rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">All Categories</option>
            {(state.facets.categories || []).map((item) => {
              const name = normalizeFacetName(item);
              return name ? <option key={name} value={name}>{name}</option> : null;
            })}
          </select>

          <select
            value={filters.state}
            onChange={(event) => updateFilter('state', event.target.value)}
            className="h-10 rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">All States</option>
            {(state.facets.states || []).map((item) => {
              const name = normalizeFacetName(item);
              return name ? <option key={name} value={name}>{name}</option> : null;
            })}
          </select>

          <select
            value={filters.qualLevel}
            onChange={(event) => updateFilter('qualLevel', event.target.value)}
            className="h-10 rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">All Qualifications</option>
            {(state.facets.qualifications || []).map((item) => {
              const name = normalizeFacetName(item);
              return name ? <option key={name} value={name}>{QUAL_LABELS[name] || name}</option> : null;
            })}
          </select>

          <select
            value={filters.postType}
            onChange={(event) => updateFilter('postType', event.target.value)}
            className="h-10 rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            {POST_TYPE_OPTIONS.map((item) => (
              <option key={item.value || 'all'} value={item.value}>{item.fullLabel}</option>
            ))}
          </select>

          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3 text-[13px] font-bold text-red-600 transition hover:bg-red-100"
            >
              <FiX size={14} />
              Clear
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { label: `Open (${Number(state.counts.open || 0).toLocaleString('en-IN')})`, status: 'open', tracked: false },
            { label: `Expired (${Number(state.counts.expired || 0).toLocaleString('en-IN')})`, status: 'expired', tracked: false },
            canTrackGovtJobs ? { label: `Tracked (${Number(state.summary.tracked || 0).toLocaleString('en-IN')})`, status: 'all', tracked: true } : null
          ].filter(Boolean).map((item) => {
            const isActive = filters.status === item.status && filters.tracked === item.tracked;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  const next = { ...filters, status: item.status, tracked: item.tracked, page: 1 };
                  setFilters(next);
                  pushFiltersToUrl(next);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                  isActive
                    ? 'bg-navy text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50'
                }`}
              >
                <FiFilter size={13} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <span className="mr-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Type</span>
          {POST_TYPE_OPTIONS.map((item) => {
            const isActive = filters.postType === item.value;
            const count = getPostTypeBadgeCount(item.value);
            return (
              <button
                key={item.value || 'all-updates'}
                type="button"
                onClick={() => updateFilter('postType', item.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-[0_12px_24px_rgba(229,155,23,0.18)]'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                {item.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/18 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {Number(count || 0).toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>
      </StudentSurfaceCard>

      {state.loading ? (
        <div className={govtJobGridClassName}>
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="h-[220px] animate-pulse rounded-[1rem] border border-slate-200 bg-white/70" />
          ))}
        </div>
      ) : state.jobs.length > 0 ? (
        <>
          <div className={govtJobGridClassName}>
            {state.jobs.map((job) => (
              <GovtJobCard
                key={job.id}
                job={job}
                detailPath={canTrackGovtJobs ? `/portal/student/govt-jobs/${job.id}` : `/govt-jobs/${job.id}`}
                actionBusy={actionBusyId === job.id}
                onOpenDetails={() => navigate(canTrackGovtJobs ? `/portal/student/govt-jobs/${job.id}` : `/govt-jobs/${job.id}`)}
                onMarkApplied={handleMarkApplied}
                onToggleReminder={handleToggleReminder}
                canTrackGovtJobs={canTrackGovtJobs}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>

          {state.pagination.totalPages > 1 ? (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-5 py-3 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, filters.page - 1))}
                  disabled={filters.page <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiChevronLeft size={17} />
                </button>
                <span className="min-w-28 text-center text-sm font-bold text-slate-600">
                  Page {filters.page} / {state.pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(state.pagination.totalPages, filters.page + 1))}
                  disabled={filters.page >= state.pagination.totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiChevronRight size={17} />
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <StudentEmptyState
          icon={FiSearch}
          title={filters.tracked ? 'No tracked government forms' : 'No government jobs found'}
          description={filters.tracked ? 'Set a reminder or mark a form filled to build your tracker.' : 'Try a broader search or clear filters.'}
          action={(
            <button type="button" onClick={resetFilters} className={studentPrimaryButtonClassName}>
              Reset Filters
            </button>
          )}
        />
      )}
    </StudentPageShell>
  );
};

export default StudentGovtJobsPage;
