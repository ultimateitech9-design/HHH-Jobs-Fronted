import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
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
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import {
  getStudentGovtJobs,
  markStudentGovtJobApplied,
  setStudentGovtJobReminder,
  updateStudentGovtJobTracker
} from '../services/studentApi';

const makeDefaultFilters = () => ({
  search: '',
  category: '',
  state: '',
  qualLevel: '',
  postType: '',
  status: 'open',
  tracked: false,
  page: 1,
  limit: 18
});

const POST_TYPE_OPTIONS = [
  { value: '', label: 'All updates' },
  { value: 'RECRUITMENT', label: 'Recruitment' },
  { value: 'RESULT', label: 'Results' },
  { value: 'ADMIT_CARD', label: 'Admit Card' },
  { value: 'ANSWER_KEY', label: 'Answer Key' },
  { value: 'SYLLABUS', label: 'Syllabus' }
];

const QUAL_LABELS = {
  '10TH': '10th',
  '12TH': '12th',
  DIPLOMA: 'Diploma',
  GRADUATION: 'Graduation',
  POST_GRADUATION: 'Post Graduation'
};

const compactButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60';

const compactPrimaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full bg-navy px-3.5 py-2 text-xs font-black text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60';

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
  const daysLeft = getDaysLeft(job.lastDate);
  if (daysLeft === null) return 'border-slate-200 bg-slate-50 text-slate-600';
  if (daysLeft < 0) return 'border-slate-200 bg-slate-100 text-slate-500';
  if (daysLeft <= 3) return 'border-red-200 bg-red-50 text-red-700';
  if (daysLeft <= 7) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const normalizeFacetName = (item) => String(item?.name || '').trim();

const openExternal = (url) => {
  if (!url) {
    toast.error('Official link is not available right now.');
    return;
  }

  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) window.location.assign(url);
};

const GovtJobCard = ({ job, onMarkApplied, onToggleReminder, actionBusy }) => {
  const hasApplied = Boolean(job.hasApplied || job.tracker?.status === 'applied');
  const reminderEnabled = Boolean(job.tracker?.reminderEnabled || job.reminderEnabled);
  const isExpired = Boolean(job.isExpired);
  const applyUrl = job.officialApplyUrl || job.applyUrl || job.officialUrl;
  const notificationUrl = job.officialNotificationUrl || job.notifUrl;

  return (
    <article className="group flex min-h-[286px] flex-col justify-between rounded-[1.45rem] border border-slate-200/70 bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_44px_rgba(15,23,42,0.08)]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                {job.category || 'Govt'}
              </span>
              {job.verificationStatus === 'VERIFIED' || job.verificationStatus === 'OFFICIAL_LINKED' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  <FiShield size={11} />
                  Official
                </span>
              ) : null}
              {job.seededDemo ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Reference
                </span>
              ) : null}
              {hasApplied ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  <FiCheckCircle size={11} />
                  Filled
                </span>
              ) : null}
            </div>

            <h2 className="mt-3 line-clamp-2 font-heading text-lg font-black leading-snug text-navy">
              {job.title || 'Government job'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{job.organization || 'Official portal'}</p>
          </div>

          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${getDeadlineTone(job)}`}>
            {getDeadlineLabel(job)}
          </span>
        </div>

        <div className="mt-4 grid gap-2 text-[12px] font-semibold text-slate-600">
          <p className="flex items-center gap-2">
            <FiCalendar className="shrink-0 text-slate-400" />
            <span>Last date: {formatDate(job.lastDate)}</span>
          </p>
          <p className="flex items-center gap-2">
            <FiBriefcase className="shrink-0 text-slate-400" />
            <span className="line-clamp-1">{job.qualification || 'As per notification'}</span>
          </p>
          <p className="flex items-center gap-2">
            <FiMapPin className="shrink-0 text-slate-400" />
            <span>{job.state || 'All India'}{job.vacancies ? `, ${Number(job.vacancies).toLocaleString('en-IN')} posts` : ''}</span>
          </p>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
          {job.description || 'Check the official notification before submitting the form.'}
        </p>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        {reminderEnabled ? (
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[12px] font-bold text-amber-700">
            <FiBell size={13} />
            Reminder {job.tracker?.reminderAt ? formatDate(job.tracker.reminderAt) : 'active'}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openExternal(applyUrl)}
            className={compactPrimaryButtonClassName}
          >
            <FiExternalLink size={13} />
            Official Apply
          </button>

          {notificationUrl ? (
            <button
              type="button"
              onClick={() => openExternal(notificationUrl)}
              className={compactButtonClassName}
            >
              Notification
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onMarkApplied(job)}
            disabled={actionBusy || hasApplied}
            className={hasApplied ? compactButtonClassName : compactPrimaryButtonClassName}
          >
            <FiCheckCircle size={13} />
            {hasApplied ? 'Filled' : 'Mark Filled'}
          </button>

          {!isExpired ? (
            <button
              type="button"
              onClick={() => onToggleReminder(job)}
              disabled={actionBusy}
              className={compactButtonClassName}
            >
              {reminderEnabled ? <FiX size={13} /> : <FiBell size={13} />}
              {reminderEnabled ? 'Remove Reminder' : 'Reminder'}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const StudentGovtJobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [filters, setFilters] = useState(() => buildFiltersFromSearchParams(searchParams));
  const [state, setState] = useState({
    jobs: [],
    pagination: { page: 1, limit: 18, total: 0, totalPages: 1 },
    counts: { open: 0, expired: 0 },
    facets: { categories: [], states: [], qualifications: [] },
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

  const loadJobs = useCallback(async (currentFilters) => {
    setState((current) => ({
      ...current,
      loading: current.jobs.length === 0,
      error: ''
    }));

    const response = await getStudentGovtJobs(currentFilters);
    setState({
      jobs: response.data?.jobs || [],
      pagination: response.data?.pagination || { page: currentFilters.page, limit: currentFilters.limit, total: 0, totalPages: 1 },
      counts: response.data?.counts || { open: 0, expired: 0 },
      facets: response.data?.facets || { categories: [], states: [], qualifications: [] },
      summary: response.data?.summary || { tracked: 0, applied: 0, reminders: 0, expiringSoon: 0, recent: [] },
      loading: false,
      error: response.error || ''
    });
  }, []);

  useEffect(() => {
    loadJobs(filters);
  }, [filters, loadJobs]);

  const updateFilter = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value, page: 1 };
      pushFiltersToUrl(next);
      return next;
    });
  };

  const resetFilters = () => {
    const next = makeDefaultFilters();
    setFilters(next);
    pushFiltersToUrl(next);
  };

  const setPage = (page) => {
    setFilters((current) => {
      const next = { ...current, page };
      pushFiltersToUrl(next);
      return next;
    });
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

  const stats = useMemo(() => ([
    {
      label: 'Open Jobs',
      value: Number(state.counts.open || 0).toLocaleString('en-IN'),
      helper: 'Current government listings.',
      icon: FiBriefcase
    },
    {
      label: 'Filled Forms',
      value: Number(state.summary.applied || 0).toLocaleString('en-IN'),
      helper: 'Marked by you.',
      icon: FiCheckCircle,
      tone: 'success'
    },
    {
      label: 'Reminders',
      value: Number(state.summary.reminders || 0).toLocaleString('en-IN'),
      helper: 'Email and dashboard alerts.',
      icon: FiBell,
      tone: 'warning'
    }
  ]), [state.counts.open, state.summary.applied, state.summary.reminders]);

  return (
    <StudentPageShell
      eyebrow="Govt Jobs"
      badge="Student tracker"
      title="Government jobs and form tracker"
      subtitle="Browse government updates, apply on the official portal, then keep your filled forms and reminders inside HHH Jobs."
      stats={stats}
      actions={(
        <>
          <button
            type="button"
            onClick={() => updateFilter('tracked', true)}
            className={studentPrimaryButtonClassName}
          >
            <FiBookmark size={16} />
            My Tracked Forms
          </button>
          <Link to="/portal/student/notifications" className={studentSecondaryButtonClassName}>
            <FiBell size={16} />
            Notifications
          </Link>
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
              <option key={item.value || 'all'} value={item.value}>{item.label}</option>
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

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: `Open (${Number(state.counts.open || 0).toLocaleString('en-IN')})`, status: 'open', tracked: false },
            { label: `Expired (${Number(state.counts.expired || 0).toLocaleString('en-IN')})`, status: 'expired', tracked: false },
            { label: `Tracked (${Number(state.summary.tracked || 0).toLocaleString('en-IN')})`, status: 'all', tracked: true }
          ].map((item) => {
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
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black transition ${
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
      </StudentSurfaceCard>

      {state.loading ? (
        <div className="student-job-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-[286px] animate-pulse rounded-[1.45rem] border border-slate-200 bg-white/70" />
          ))}
        </div>
      ) : state.jobs.length > 0 ? (
        <>
          <div className="student-job-grid">
            {state.jobs.map((job) => (
              <GovtJobCard
                key={job.id}
                job={job}
                actionBusy={actionBusyId === job.id}
                onMarkApplied={handleMarkApplied}
                onToggleReminder={handleToggleReminder}
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
