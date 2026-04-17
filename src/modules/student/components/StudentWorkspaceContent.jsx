import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBriefcase, FiFileText, FiMapPin, FiTrendingUp, FiUser } from 'react-icons/fi';
import careerCompassDashboard from '../../../assets/career-compass-dashboard.jpg';
import { BLOG_BASE_URL } from '../../../shared/utils/externalLinks.js';
import { getCurrentUser } from '../../../utils/auth';
import { generateRetiredEmployeeId, generateStudentCandidateId } from '../../../utils/hrIdentity';
import { getStudentDashboardOverview, getStudentJobs, getStudentProfile } from '../services/studentApi';

const defaultOverview = {
  loading: true,
  error: '',
  profile: null,
  profileCompletion: 0,
  counters: {
    totalApplications: 0,
    unreadNotifications: 0
  }
};

const emptyProfile = {
  name: '',
  avatarUrl: '',
  headline: '',
  targetRole: '',
  location: '',
  mobile: '',
  email: ''
};

const formatMaybeDate = (value, fallback = '1d ago') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const StudentWorkspaceContent = ({ showSalaryExplorer = false, showPipeline = false }) => {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isRetiredUser = currentUser?.role === 'retired_employee';
  const [overview, setOverview] = useState(defaultOverview);
  const [profile, setProfile] = useState(emptyProfile);
  const [recommendedJobs, setRecommendedJobs] = useState({ jobs: [], loading: true });

  const profileIdentity = useMemo(() => {
    if (isRetiredUser) {
      return {
        label: 'Retired Employee ID',
        value: currentUser?.retiredEmployeeId || generateRetiredEmployeeId({ name: currentUser?.name || profile?.name || '', mobile: currentUser?.mobile || profile?.mobile || '' })
      };
    }
    return {
      label: 'Student ID',
      value: currentUser?.studentCandidateId || generateStudentCandidateId({ name: currentUser?.name || profile?.name || '', mobile: currentUser?.mobile || profile?.mobile || '' })
    };
  }, [currentUser, isRetiredUser, profile?.mobile, profile?.name]);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      const [overviewResponse, profileResponse, jobsResponse] = await Promise.all([
        getStudentDashboardOverview(),
        getStudentProfile(),
        getStudentJobs({ page: 1, limit: 3 })
      ]);
      if (!mounted) return;

      const overviewPayload = overviewResponse.data || {};
      setOverview({
        loading: false,
        error: overviewResponse.error || '',
        profile: overviewPayload.profile || null,
        profileCompletion: Number(overviewPayload.profileCompletion || 0),
        counters: {
          totalApplications: Number(overviewPayload.counters?.totalApplications || 0),
          unreadNotifications: Number(overviewPayload.counters?.unreadNotifications || 0)
        },
        pipeline: overviewPayload.pipeline || {}
      });
      setProfile({
        ...emptyProfile,
        ...(overviewPayload.profile || {}),
        ...(profileResponse.data || {})
      });
      setRecommendedJobs({
        jobs: (jobsResponse.data?.jobs || []).slice(0, 3),
        loading: false
      });
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  if (overview.loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  const userName = currentUser?.name || profile?.name || 'Student';
  const profileProgress = overview.profileCompletion || 25;
  const profileJobCount = recommendedJobs.jobs.length;
  const headline = profile?.headline || profile?.targetRole || 'Not Mentioned';
  const menuItems = [
    { label: 'My home', icon: FiUser, active: true, to: '/portal/student/home' },
    { label: 'Jobs', icon: FiBriefcase, active: false, to: '/portal/student/jobs' },
    { label: 'Applications', icon: FiFileText, active: false, to: '/portal/student/applications' },
    { label: 'Interviews', icon: FiTrendingUp, active: false, to: '/portal/student/interviews' }
  ];

  return (
    <div className="space-y-6 pb-8">
      {overview.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600">
          <span className="font-semibold">{overview.error}</span>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)_240px]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 text-center shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)]">
            <div
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(#ef4444 0 ${Math.max(profileProgress, 4)}%, #e2e8f0 ${Math.max(profileProgress, 4)}% 100%)` }}
            >
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-slate-100 text-3xl font-black text-slate-500">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                  (userName || 'U').charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <span className="mt-3 inline-flex rounded-full border border-red-100 bg-white px-2 py-1 text-[11px] font-bold text-red-500">
              {profileProgress}%
            </span>
            <h1 className="mt-4 text-3xl font-extrabold text-navy">{userName}</h1>
            <p className="mt-1 text-sm text-slate-500">{headline}</p>
            <p className="mt-3 text-xs text-slate-400">Last updated yesterday</p>
            <Link
              to="/portal/student/profile"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[#2d5bff] px-4 py-2 text-[14px] font-bold leading-none text-white shadow-[0_8px_18px_rgba(45,91,255,0.28)]"
            >
              Complete profile
            </Link>
          </div>

          <div className="rounded-[1.6rem] border border-[#d9e7ff] bg-[#edf4ff] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-navy">Profile performance</h2>
              <FiTrendingUp className="text-brand-600" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-xs text-slate-500">Search appearances</p>
                <p className="mt-2 text-2xl font-extrabold text-brand-700">{overview.counters.totalApplications}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Recruiter actions</p>
                <p className="mt-2 text-2xl font-extrabold text-brand-700">{overview.counters.unreadNotifications}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700">
              <span>Upto 3X boost to your profile performance</span>
              <FiTrendingUp />
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold ${item.active ? 'bg-slate-100 text-navy' : 'text-slate-700 hover:bg-slate-50'}`}
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-extrabold text-navy">Recommended jobs for you</h2>
                <div className="mt-4 flex items-center gap-6 border-b border-slate-200 pb-3">
                  <span className="border-b-4 border-navy pb-2 text-lg font-bold text-navy">Profile ({profileJobCount})</span>
                  <span className="pb-2 text-lg font-semibold text-slate-400">Preferences (0)</span>
                </div>
              </div>
              <Link to="/portal/student/jobs" className="text-base font-bold text-brand-700">
                View all
              </Link>
            </div>

            {recommendedJobs.loading ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-[1.5rem] bg-slate-100" />)}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {recommendedJobs.jobs.map((job) => (
                  <Link
                    key={job.id || job._id}
                    to={`/portal/student/jobs/${job.id || job._id}`}
                    className="rounded-[1.6rem] border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-brand-700">
                        <FiBriefcase />
                      </div>
                      <span className="text-xs text-slate-400">{formatMaybeDate(job.createdAt || job.postedAt || job.created_at, '1d ago')}</span>
                    </div>
                    <p className="mt-4 line-clamp-2 text-xl font-bold text-navy">{job.jobTitle || 'Untitled role'}</p>
                    <p className="mt-1 text-sm text-slate-500">{job.companyName || 'Unknown company'}</p>
                    <p className="mt-3 inline-flex items-center gap-1 text-sm text-slate-500">
                      <FiMapPin size={14} /> {job.jobLocation || 'Remote'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {showSalaryExplorer ? (
            <div className="rounded-[1.9rem] border border-emerald-100 bg-[linear-gradient(135deg,#ebfdf1_0%,#e0f7ea_100%)] p-6">
              <p className="text-2xl font-extrabold text-navy">Explore salaries of 5 Lakh+ companies</p>
              <p className="mt-2 text-sm text-slate-600">Compare salaries by designations and experience.</p>
              <div className="mt-5">
                <Link to="/portal/student/analytics" className="rounded-full bg-[#2d5bff] px-5 py-3 text-sm font-bold text-white">
                  Explore salaries
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg font-black text-slate-700">
              QR
            </div>
            <p className="mt-4 text-2xl font-extrabold text-navy">3587 users downloaded our app in last 30 mins!</p>
            <p className="mt-2 text-sm text-slate-500">Scan to download from Play Store or App Store.</p>
          </div>

          <div className="hidden overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white md:block">
            <div className="h-28 overflow-hidden bg-[linear-gradient(135deg,#dbeafe_0%,#c7d2fe_100%)]">
              <img
                src={careerCompassDashboard}
                alt="Job market insights"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-5">
              <p className="text-2xl font-extrabold leading-tight text-navy">Job market insights for your hiring world.</p>
              <p className="mt-3 text-sm text-slate-500">Track recruiter movement, white-collar hiring, and market activity.</p>
              <a href={BLOG_BASE_URL} className="mt-4 inline-flex text-base font-bold text-brand-700">
                Know more
              </a>
            </div>
          </div>
        </aside>
      </section>

      {showPipeline ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: 'Applied', count: overview.pipeline?.applied || 0 },
            { label: 'Shortlisted', count: overview.pipeline?.shortlisted || 0 },
            { label: 'Interviewed', count: overview.pipeline?.interviewed || 0 },
            { label: 'Offered', count: overview.pipeline?.offered || 0 },
            { label: 'Hired', count: overview.pipeline?.hired || 0 },
            { label: 'Rejected', count: overview.pipeline?.rejected || 0 }
          ].map((stage) => (
            <article key={stage.label} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm font-semibold text-slate-500">{stage.label}</p>
              <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{stage.count}</p>
            </article>
          ))}
        </div>
      ) : null}

      <p className="hidden text-xs">{profileIdentity.label}: {profileIdentity.value}</p>
    </div>
  );
};

export default StudentWorkspaceContent;
