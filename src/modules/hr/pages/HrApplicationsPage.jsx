import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiExternalLink,
  FiFileText,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiUsers
} from 'react-icons/fi';
import {
  fetchHrCampusDriveApplications,
  fetchHrCampusDrives,
  getApplicantsForJob,
  getHrJobs
} from '../services/hrApi';

const sourceTabs = [
  { key: 'all', label: 'All Sources' },
  { key: 'job', label: 'Job Posts' },
  { key: 'campus', label: 'Campus Drives' }
];

const statusTabs = [
  { key: 'all', label: 'All Status' },
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview_scheduled', label: 'Interview Scheduled' },
  { key: 'interviewed', label: 'Interviewed' },
  { key: 'offered', label: 'Offered' },
  { key: 'hired', label: 'Hired' },
  { key: 'selected', label: 'Selected' },
  { key: 'rejected', label: 'Rejected' }
];

const pageSizes = [6, 10, 20, 50];

const getTimeValue = (value) => {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const getCandidateName = (application = {}) =>
  application?.applicant?.name
  || application?.candidate?.name
  || application?.applicantName
  || application?.applicantEmail
  || application?.candidate?.email
  || 'Applicant';

const getCandidateEmail = (application = {}) =>
  application?.applicant?.email
  || application?.candidate?.email
  || application?.applicantEmail
  || '-';

const getCandidatePhone = (application = {}) =>
  application?.applicant?.mobile
  || application?.applicant?.phone
  || application?.candidate?.mobile
  || application?.candidate?.phone
  || '-';

const getApplicationTime = (application = {}) =>
  application.appliedAt
  || application.createdAt
  || application.created_at
  || application.updatedAt
  || application.statusUpdatedAt
  || '';

const getJobApplicantsRoute = (job) => {
  const jobId = job?.id || job?._id;
  return jobId ? `/portal/hr/jobs/${jobId}/applicants` : '/portal/hr/jobs';
};

const getJobApplicationRoute = (job, applicationId) => {
  const baseRoute = getJobApplicantsRoute(job);
  return applicationId ? `${baseRoute}?applicationId=${encodeURIComponent(applicationId)}` : baseRoute;
};

const getCampusDriveRoute = (drive, applicationId) => {
  const driveId = drive?.id || drive?._id || '';
  const query = new URLSearchParams();
  if (driveId) query.set('driveId', driveId);
  if (applicationId) query.set('applicationId', applicationId);
  const queryString = query.toString();
  return `/portal/hr/campus-drives${queryString ? `?${queryString}` : ''}`;
};

const formatApplicationDate = (value) => {
  if (!value) return { date: '-', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: String(value), time: '' };
  return {
    date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  };
};

const getInitials = (name = '') =>
  String(name || 'A')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const normalizeStatus = (status = '') => String(status || 'applied').toLowerCase();

const statusStyles = {
  applied: 'border-slate-200 bg-slate-50 text-slate-700',
  shortlisted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  interview_scheduled: 'border-amber-200 bg-amber-50 text-amber-700',
  interviewed: 'border-orange-200 bg-orange-50 text-orange-700',
  offered: 'border-blue-200 bg-blue-50 text-blue-700',
  hired: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  selected: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-200 bg-red-50 text-red-700'
};

const statusLabels = {
  interview_scheduled: 'Interview'
};

const formatStatusLabel = (status = '') => {
  const normalized = normalizeStatus(status);
  return statusLabels[normalized] || normalized.replaceAll('_', ' ');
};

const CompactStatusPill = ({ value }) => {
  const normalized = normalizeStatus(value);
  return (
    <span
      title={normalized.replaceAll('_', ' ')}
      className={`inline-flex max-w-full items-center justify-center truncate rounded-full border px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${statusStyles[normalized] || statusStyles.applied}`}
    >
      {formatStatusLabel(normalized)}
    </span>
  );
};

const normalizeJobApplication = (application, job, index) => ({
  id: `job-${application.id || application._id || index}`,
  rawId: application.id || application._id || '',
  sourceType: 'job',
  sourceLabel: 'Job post',
  candidateName: getCandidateName(application),
  email: getCandidateEmail(application),
  phone: getCandidatePhone(application),
  title: job?.jobTitle || application.jobTitle || 'Job post',
  organization: job?.companyName || application.companyName || 'Your company',
  status: normalizeStatus(application.status),
  round: application.currentRound || application.roundLabel || '-',
  notes: application.hrNotes || application.notes || '-',
  appliedAt: getApplicationTime(application),
  resumeUrl: application.resumeUrl || application.applicant?.resumeUrl || application.applicant?.resume_url || '',
  to: getJobApplicationRoute(job, application.id || application._id)
});

const normalizeCampusApplication = (application, drive, index) => ({
  id: `campus-${application.id || application._id || index}`,
  rawId: application.id || application._id || '',
  sourceType: 'campus',
  sourceLabel: 'Campus drive',
  candidateName: getCandidateName(application),
  email: getCandidateEmail(application),
  phone: getCandidatePhone(application),
  title: drive?.jobTitle || application.drive?.jobTitle || 'Campus drive',
  organization: drive?.college?.name || drive?.collegeName || application.drive?.collegeName || 'College',
  status: normalizeStatus(application.status),
  round: application.currentRound || '-',
  notes: application.notes || '-',
  appliedAt: getApplicationTime(application),
  resumeUrl: application.resumeUrl || application.candidate?.resumeUrl || '',
  to: getCampusDriveRoute(drive, application.id || application._id)
});

const loadJobApplications = async (jobs = []) => {
  const groups = await Promise.all(
    jobs.map((job, jobIndex) =>
      getApplicantsForJob(job.id || job._id)
        .then((response) => (response.data || []).map((application, index) =>
          normalizeJobApplication(application, job, `${jobIndex}-${index}`)
        ))
        .catch(() => [])
    )
  );

  return groups.flat();
};

const loadCampusApplications = async (drives = []) => {
  const groups = await Promise.all(
    drives.map((drive, driveIndex) =>
      fetchHrCampusDriveApplications(drive.id || drive._id, { all: true, limit: 250 })
        .then((response) => (response.applications || []).map((application, index) =>
          normalizeCampusApplication(application, response.drive || drive, `${driveIndex}-${index}`)
        ))
        .catch(() => [])
    )
  );

  return groups.flat();
};

export default function HrApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, error: '', applications: [] });
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const selectedSource = searchParams.get('source') || 'all';
  const selectedStatus = searchParams.get('status') || 'all';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const [jobsResponse, drivesResponse] = await Promise.all([
          getHrJobs(),
          fetchHrCampusDrives()
        ]);

        const jobs = jobsResponse.data || [];
        const drives = drivesResponse.data || [];
        const [jobApplications, campusApplications] = await Promise.all([
          loadJobApplications(jobs),
          loadCampusApplications(drives)
        ]);

        if (!mounted) return;

        setState({
          loading: false,
          error: jobsResponse.error || '',
          applications: [...jobApplications, ...campusApplications].sort(
            (left, right) => getTimeValue(right.appliedAt) - getTimeValue(left.appliedAt)
          )
        });
      } catch (error) {
        if (!mounted) return;
        setState({
          loading: false,
          error: error.message || 'Unable to load applications.',
          applications: []
        });
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return state.applications.filter((application) => {
      const sourceMatch = selectedSource === 'all' || application.sourceType === selectedSource;
      const statusMatch = selectedStatus === 'all'
        || application.status === selectedStatus
        || (selectedStatus === 'hired' && application.status === 'selected');
      const queryMatch = !query || [
        application.candidateName,
        application.email,
        application.phone,
        application.title,
        application.organization,
        application.sourceLabel,
        application.status,
        application.round
      ].some((value) => String(value || '').toLowerCase().includes(query));

      return sourceMatch && statusMatch && queryMatch;
    });
  }, [search, selectedSource, selectedStatus, state.applications]);

  const summary = useMemo(() => ({
    total: state.applications.length,
    job: state.applications.filter((item) => item.sourceType === 'job').length,
    campus: state.applications.filter((item) => item.sourceType === 'campus').length,
    shortlisted: state.applications.filter((item) => ['shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'selected'].includes(item.status)).length
  }), [state.applications]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const paginationStart = filteredApplications.length ? ((page - 1) * pageSize) + 1 : 0;
  const paginationEnd = Math.min(page * pageSize, filteredApplications.length);

  const paginatedApplications = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, page, pageSize]);

  const pageNumbers = useMemo(() => {
    const visiblePages = new Set([1, totalPages, page - 1, page, page + 1]);
    return [...visiblePages]
      .filter((item) => item >= 1 && item <= totalPages)
      .sort((left, right) => left - right);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedSource, selectedStatus, pageSize]);

  useEffect(() => {
    setPage((current) => Math.min(Math.max(current, 1), totalPages));
  }, [totalPages]);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/portal/hr/dashboard" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 transition hover:text-slate-800">
            <FiArrowLeft size={13} /> Back to dashboard
          </Link>
          <h1 className="mt-2 text-[24px] font-extrabold tracking-tight text-slate-950">All Applications</h1>
          <p className="mt-1 text-[13px] text-slate-500">Job-post and campus-drive applicants in one place.</p>
        </div>
        <Link to="/portal/hr/jobs?tab=post" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-slate-800">
          <FiBriefcase size={14} /> Post Job
        </Link>
      </div>

      {state.error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800">
          <FiAlertCircle size={15} />
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Applications', value: summary.total, icon: FiUsers, tone: 'bg-indigo-50 text-indigo-600' },
          { label: 'Job Post Applicants', value: summary.job, icon: FiBriefcase, tone: 'bg-blue-50 text-blue-600' },
          { label: 'Campus Applicants', value: summary.campus, icon: FiCalendar, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'In Pipeline', value: summary.shortlisted, icon: FiRefreshCw, tone: 'bg-amber-50 text-amber-600' }
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm">
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.tone}`}>
              <item.icon size={17} />
            </span>
            <div>
              <p className="text-[22px] font-extrabold leading-none text-slate-950">{state.loading ? '--' : item.value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search applicant, email, job, college, status..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[13px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {sourceTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter('source', tab.key)}
                  className={`rounded-lg border px-3 py-2 text-[12px] font-bold transition ${selectedSource === tab.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 pb-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter('status', tab.key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${selectedStatus === tab.key ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="w-full table-fixed text-left">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="w-[22%] px-2.5 py-3">Applicant</th>
                <th className="w-[8%] px-2.5 py-3">Source</th>
                <th className="w-[14%] px-2.5 py-3">Role</th>
                <th className="w-[13%] px-2.5 py-3">Org</th>
                <th className="w-[14%] px-2.5 py-3">Status</th>
                <th className="w-[8%] px-2.5 py-3">Round</th>
                <th className="w-[10%] px-2.5 py-3">Applied</th>
                <th className="w-[11%] px-2.5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.loading ? [1, 2, 3, 4, 5].map((item) => (
                <tr key={item}>
                  <td className="px-2.5 py-3"><div className="h-4 w-32 animate-pulse rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-3"><div className="h-4 w-14 animate-pulse rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-3"><div className="h-4 w-28 animate-pulse rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-3"><div className="h-4 w-24 animate-pulse rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-3"><div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" /></td>
                  <td className="px-2.5 py-3"><div className="h-4 w-16 animate-pulse rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-3"><div className="h-4 w-16 animate-pulse rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-3"><div className="ml-auto h-8 w-24 animate-pulse rounded bg-slate-100" /></td>
                </tr>
              )) : filteredApplications.length > 0 ? paginatedApplications.map((application) => {
                const appliedAt = formatApplicationDate(application.appliedAt);
                const sourceLabel = application.sourceType === 'campus' ? 'Campus' : 'Job';

                return (
                <tr key={application.id} className="transition hover:bg-slate-50/60">
                  <td className="px-2.5 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${application.sourceType === 'campus' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {getInitials(application.candidateName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold text-slate-900">{application.candidateName}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-400">
                          <FiMail size={10} /> {application.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-3">
                    <span
                      title={application.sourceLabel}
                      className={`inline-flex max-w-full justify-center truncate rounded-full px-2 py-1 text-[10px] font-bold ${application.sourceType === 'campus' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}
                    >
                      {sourceLabel}
                    </span>
                  </td>
                  <td className="px-2.5 py-3 text-[12px] font-semibold text-slate-800"><span className="line-clamp-2">{application.title}</span></td>
                  <td className="px-2.5 py-3 text-[12px] text-slate-500"><span className="line-clamp-2">{application.organization}</span></td>
                  <td className="px-2.5 py-3"><CompactStatusPill value={application.status} /></td>
                  <td className="px-2.5 py-3 text-[12px] text-slate-500"><span className="line-clamp-2">{application.round}</span></td>
                  <td className="px-2.5 py-3 text-[12px] text-slate-500">
                    <span className="block truncate font-semibold text-slate-600">{appliedAt.date}</span>
                    {appliedAt.time && <span className="mt-0.5 block truncate text-[10px] text-slate-400">{appliedAt.time}</span>}
                  </td>
                  <td className="px-2.5 py-3 text-right">
                    <div className="flex justify-end gap-1.5 whitespace-nowrap">
                      {application.resumeUrl ? (
                        <a
                          href={application.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open resume"
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <FiFileText size={12} /> CV
                        </a>
                      ) : (
                        <span
                          title="Resume not available"
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2 text-[10px] font-bold text-slate-300"
                        >
                          <FiFileText size={12} /> CV
                        </span>
                      )}
                      <Link
                        to={application.to}
                        title="Open application"
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-slate-900 px-2 text-[10px] font-bold text-white transition hover:bg-slate-800"
                      >
                        Open <FiExternalLink size={11} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
              }) : (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <FiUsers className="mx-auto text-slate-300" size={30} />
                    <p className="mt-2 text-[13px] font-semibold text-slate-500">No applications found</p>
                    <p className="mt-1 text-[12px] text-slate-400">Change filters or wait for applicants to apply.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!state.loading && filteredApplications.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-[12px] sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-slate-500">
              Showing <span className="text-slate-900">{paginationStart}-{paginationEnd}</span> of <span className="text-slate-900">{filteredApplications.length}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 font-semibold text-slate-500">
                Rows
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-bold text-slate-700 outline-none transition focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
                >
                  {pageSizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Prev
                </button>
                {pageNumbers.map((pageNumber, index) => (
                  <div key={pageNumber} className="flex items-center gap-1">
                    {index > 0 && pageNumber - pageNumbers[index - 1] > 1 && (
                      <span className="px-1 font-bold text-slate-300">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`h-8 min-w-8 rounded-lg border px-2 font-bold transition ${page === pageNumber ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      {pageNumber}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
