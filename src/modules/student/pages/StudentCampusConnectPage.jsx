import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTrendingUp
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
  applyToCampusDrive,
  getFriendlyApplyErrorMessage,
  getStudentCampusConnect
} from '../services/studentApi';

const emptyCampusState = {
  loading: true,
  error: '',
  data: {
    connected: false,
    student: null,
    college: null,
    upcomingDrives: [],
    counts: { eligibleUpcomingDrives: 0 }
  }
};

const accountStatusLabel = {
  pending_activation: 'OTP invite sent',
  linked_existing: 'Linked existing account',
  active: 'Active account',
  needs_review: 'Needs review'
};

const formatDriveDate = (value) => {
  if (!value) return 'Date to be announced';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const formatPackage = (minValue, maxValue) => {
  const min = Number(minValue || 0);
  const max = Number(maxValue || 0);
  if (min > 0 && max > 0) return `Rs ${(min / 100000).toFixed(1)}L - ${(max / 100000).toFixed(1)}L`;
  if (max > 0) return `Up to Rs ${(max / 100000).toFixed(1)}L`;
  if (min > 0) return `From Rs ${(min / 100000).toFixed(1)}L`;
  return 'Package not disclosed';
};

const StudentCampusConnectPage = () => {
  const [state, setState] = useState(emptyCampusState);
  const [applyingDriveId, setApplyingDriveId] = useState('');
  const [actionNotice, setActionNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    let mounted = true;

    const loadCampusConnect = async () => {
      const response = await getStudentCampusConnect();
      if (!mounted) return;

      setState({
        loading: false,
        error: response.error || '',
        data: response.data || emptyCampusState.data
      });
    };

    loadCampusConnect();

    return () => {
      mounted = false;
    };
  }, []);

  const campusData = state.data || emptyCampusState.data;
  const college = campusData.college || null;
  const student = campusData.student || null;
  const drives = Array.isArray(campusData.upcomingDrives) ? campusData.upcomingDrives : [];

  const handleApply = async (driveId) => {
    setActionNotice({ type: '', text: '' });
    setApplyingDriveId(driveId);

    try {
      const application = await applyToCampusDrive(driveId);

      setState((current) => ({
        ...current,
        data: {
          ...current.data,
          upcomingDrives: (current.data?.upcomingDrives || []).map((drive) => (
            drive.id === driveId
              ? {
                  ...drive,
                  hasApplied: true,
                  canApply: false,
                  applicationId: application?.id || drive.applicationId || null,
                  applicationStatus: application?.status || 'applied',
                  appliedAt: application?.appliedAt || new Date().toISOString()
                }
              : drive
          ))
        }
      }));

      setActionNotice({
        type: 'success',
        text: 'Campus drive application submitted successfully.'
      });
    } catch (error) {
      setActionNotice({
        type: 'error',
        text: getFriendlyApplyErrorMessage(error, 'Unable to apply to this campus drive right now.')
      });
    } finally {
      setApplyingDriveId('');
    }
  };

  const stats = useMemo(() => {
    if (!campusData.connected || !student || !college) {
      return [
        { label: 'Campus Linked', value: 'No', helper: 'This student profile is not attached to a campus yet' },
        { label: 'Eligible Drives', value: '0', helper: 'Upcoming campus drives will appear here once linked' },
        { label: 'Placement Status', value: 'Open', helper: 'Student profile is still open for placement activity' }
      ];
    }

    return [
      { label: 'Campus Linked', value: 'Yes', helper: college.name || 'Campus attached', icon: FiBookOpen, tone: 'success' },
      { label: 'Eligible Drives', value: String(campusData.counts?.eligibleUpcomingDrives || 0), helper: 'Filtered by your branch and CGPA', icon: FiCalendar, tone: 'accent' },
      { label: 'Placement Status', value: student.isPlaced ? 'Placed' : 'Seeking', helper: student.isPlaced ? 'Campus record already marked placed' : 'Visible for ongoing campus placements', icon: FiTrendingUp, tone: 'info' }
    ];
  }, [campusData, college, student]);

  return (
    <StudentPageShell
      eyebrow="Campus Connect"
      badge="Student access"
      title="See your attached campus and every eligible drive in one place"
      subtitle="This view makes your campus linkage visible inside the student dashboard, so you can confirm which college profile you belong to and track the drives opened for your batch."
      heroSize="mini"
      stats={stats}
      actions={
        <>
          <Link to="/portal/student/companies" className={studentSecondaryButtonClassName}>
            Explore Companies
          </Link>
          <Link to="/portal/student/notifications" className={studentPrimaryButtonClassName}>
            Open Notifications
          </Link>
        </>
      }
    >
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}
      {actionNotice.text ? <StudentNotice type={actionNotice.type || 'success'} text={actionNotice.text} /> : null}

      {state.loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-[1.8rem] bg-slate-100" />
          ))}
        </div>
      ) : !campusData.connected || !college || !student ? (
        <StudentEmptyState
          icon={FiBookOpen}
          title="No campus is attached to this student yet"
          description="Once a college links this student through Campus Connect, the attached campus name, activation status, and eligible drive list will start appearing here."
          action={<Link to="/portal/student/companies" className={studentPrimaryButtonClassName}>Browse Jobs Instead</Link>}
        />
      ) : (
        <div className="space-y-5">
          <StudentSurfaceCard
            eyebrow="Attached Campus"
            title={college.name || 'Campus linked'}
            subtitle="These details come from the Campus Connect profile that imported or linked this student."
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Campus</p>
                  <p className="mt-2 text-lg font-extrabold text-navy">{college.name || 'Not available'}</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                    <FiMapPin size={14} />
                    {[college.city, college.state].filter(Boolean).join(', ') || 'Location not added'}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Account Status</p>
                  <p className="mt-2 text-lg font-extrabold text-emerald-700">
                    {accountStatusLabel[student.accountStatus] || 'Linked'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {student.isPlaced ? 'Placement recorded by campus' : 'Open for campus placement drives'}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Academic Profile</p>
                  <p className="mt-2 text-lg font-extrabold text-navy">
                    {[student.branch, student.degree].filter(Boolean).join(' · ') || 'Not provided'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Batch {student.graduationYear || 'N/A'} · CGPA {student.cgpa ?? 'N/A'}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Campus Contacts</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-500">
                    <p className="inline-flex items-center gap-2">
                      <FiMail size={14} />
                      {college.contactEmail || 'Contact email not added'}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <FiPhone size={14} />
                      {college.contactPhone || 'Contact phone not added'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-brand-100 bg-[linear-gradient(135deg,#fff7ed_0%,#fffdf7_100%)] p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700">Placement Snapshot</p>
                <p className="mt-3 text-3xl font-extrabold text-navy">
                  {campusData.counts?.eligibleUpcomingDrives || 0}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Eligible upcoming drives</p>
                <div className="mt-5 rounded-[1.25rem] bg-white/90 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">
                    {student.isPlaced ? 'Placed through campus record' : 'Currently marked placement-seeking'}
                  </p>
                  <p className="mt-2">
                    {college.placementOfficerName
                      ? `Placement officer: ${college.placementOfficerName}`
                      : 'Placement officer details have not been added yet.'}
                  </p>
                  {college.website ? (
                    <a
                      href={college.website}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 font-semibold text-brand-700"
                    >
                      <FiGlobe size={14} />
                      Visit campus website
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </StudentSurfaceCard>

          <StudentSurfaceCard
            eyebrow="Eligible Drives"
            title="Campus drives opened for your profile"
            subtitle="Only the drives that match your current branch, CGPA, and placement status are shown here."
          >
            {drives.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {drives.map((drive) => (
                  <article
                    key={drive.id}
                    className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-extrabold text-navy">{drive.companyName || 'Campus drive'}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{drive.jobTitle || 'Role details pending'}</p>
                      </div>
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                        Eligible
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          <FiCalendar size={13} />
                          Drive Date
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">{formatDriveDate(drive.driveDate)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          <FiTrendingUp size={13} />
                          Package
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">{formatPackage(drive.packageMin, drive.packageMax)}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      <p className="inline-flex items-center gap-2">
                        <FiMapPin size={14} />
                        {drive.location || 'Location will be shared by campus'}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <FiClock size={14} />
                        {drive.driveMode || 'Mode not specified'}
                      </p>
                    </div>

                    {drive.description ? (
                      <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        {drive.description}
                      </p>
                    ) : null}

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {drive.hasApplied
                          ? `Applied ${formatDriveDate(drive.appliedAt)}`
                          : 'Apply before the drive expires'}
                      </p>

                      {drive.hasApplied ? (
                        <span className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                          Applied
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApply(drive.id)}
                          disabled={applyingDriveId === drive.id}
                          className={`${studentPrimaryButtonClassName} min-w-[170px] justify-center px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                          {applyingDriveId === drive.id ? 'Applying...' : 'Apply for Drive'}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <StudentEmptyState
                icon={FiCalendar}
                title="No eligible drives are live right now"
                description="Your campus is attached successfully, but there are no active drives matching your current branch or CGPA at the moment."
                action={<Link to="/portal/student/notifications" className={studentSecondaryButtonClassName}>Check Notifications</Link>}
                className="bg-white"
              />
            )}
          </StudentSurfaceCard>

          {student.isPlaced ? (
            <StudentNotice
              type="success"
              text={`This student profile is marked placed${student.placedCompany ? ` at ${student.placedCompany}` : ''}.`}
              action={student.placedRole ? <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700"><FiCheckCircle size={13} /> {student.placedRole}</span> : null}
            />
          ) : null}
        </div>
      )}
    </StudentPageShell>
  );
};

export default StudentCampusConnectPage;
