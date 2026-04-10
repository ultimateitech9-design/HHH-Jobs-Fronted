import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiHome,
  FiMapPin,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';
import careerCompassDashboard from '../../../assets/career-compass-dashboard.jpg';
import { BLOG_BASE_URL } from '../../../shared/utils/externalLinks.js';
import { getCurrentUser } from '../../../utils/auth';
import { generateRetiredEmployeeId, generateStudentCandidateId } from '../../../utils/hrIdentity';
import { getStudentDashboardOverview, getStudentJobs, getStudentProfile } from '../services/studentApi';

const defaultOverview = {
  loading: true,
  error: '',
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
  mobile: ''
};

const formatMaybeDate = (value, fallback = '1d ago') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const StudentHomePage = () => {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const navigate = useNavigate();
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

    const loadHome = async () => {
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
        profileCompletion: Number(overviewPayload.profileCompletion || 0),
        counters: {
          totalApplications: Number(overviewPayload.counters?.totalApplications || 0),
          unreadNotifications: Number(overviewPayload.counters?.unreadNotifications || 0)
        }
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

    loadHome();
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
    { label: 'My home', icon: FiHome, to: '/portal/student/home' },
    { label: 'Jobs', icon: FiBriefcase, to: '/portal/student/jobs' },
    { label: 'Companies', icon: FiUsers, to: '/portal/student/company-reviews' }
  ];

  return (
    <div className="space-y-3 px-[30px] pb-5">
      {overview.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600">
          <span className="font-semibold">{overview.error}</span>
        </div>
      ) : null}

      <section className="grid gap-3 xl:grid-cols-[240px_minmax(0,1fr)_205px]">
        <aside>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3.5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.4)]">
            <Link to="/portal/student/profile" className="block text-center">
              <div
                className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full"
                style={{ background: `conic-gradient(#ef4444 0 ${Math.max(profileProgress, 4)}%, #e2e8f0 ${Math.max(profileProgress, 4)}% 100%)` }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-[1.35rem] font-black text-slate-500">
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
              <h2 className="mt-2.5 text-[1.5rem] font-extrabold leading-none text-navy">{userName}</h2>
              <p className="mt-1 text-sm text-slate-500">{headline}</p>
              <p className="mt-2.5 text-[13px] text-slate-400">Last updated yesterday</p>
              <span className="mt-4 inline-flex items-center justify-center rounded-full bg-[#2d5bff] px-4 py-2 text-[14px] font-bold leading-none text-white shadow-[0_8px_18px_rgba(45,91,255,0.28)]">
                Complete profile
              </span>
            </Link>

            <Link to="/portal/student/dashboard" className="mt-3.5 block rounded-[1.35rem] border border-[#d9e7ff] bg-[#eef4ff] p-3 transition hover:border-brand-200 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-navy">HHH Jobs profile</h2>
                <FiTrendingUp className="text-brand-600" />
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5 border-b border-[#cadcff] pb-2.5 text-left">
                <div>
                  <p className="text-xs text-slate-500">Search appearances</p>
                  <p className="mt-1 text-xl font-extrabold text-brand-700">{overview.counters.totalApplications}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Recruiter actions</p>
                  <p className="mt-1 text-xl font-extrabold text-brand-700">{overview.counters.unreadNotifications}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-left text-[11px] font-semibold text-slate-700">
                <span>Boost your HHH Jobs profile reach</span>
                <FiTrendingUp />
              </div>
            </Link>

            <div className="mt-3.5 space-y-1">
              {menuItems.map((item, index) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-[15px] font-semibold ${index === 0 ? 'bg-slate-100 text-navy' : 'text-slate-800 hover:bg-slate-50'}`}
                >
                  <item.icon className="text-slate-600" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.3)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[1.55rem] font-extrabold leading-tight text-navy">HHH Jobs picks for you</h2>
                <div className="mt-3 flex items-center gap-4 border-b border-slate-200 pb-2.5">
                  <Link to="/portal/student/dashboard" className="border-b-4 border-navy pb-1.5 text-[15px] font-bold text-navy">Profile ({profileJobCount})</Link>
                  <Link to="/portal/student/profile" className="pb-1.5 text-[15px] font-semibold text-slate-400 hover:text-slate-600">Preferences (0)</Link>
                </div>
              </div>
              <Link to="/portal/student/dashboard" className="pt-1 text-sm font-bold text-brand-700">
                View all
              </Link>
            </div>

            {recommendedJobs.loading ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-[1.5rem] bg-slate-100" />)}
              </div>
            ) : (
              <div className="mt-4 grid gap-2.5 md:grid-cols-3">
                {recommendedJobs.jobs.map((job) => (
                  <Link
                    key={job.id || job._id}
                    to={`/portal/student/jobs/${job.id || job._id}`}
                    className="rounded-[1.2rem] border border-slate-200 bg-white p-3 transition hover:border-brand-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-brand-700">
                        <FiBriefcase />
                      </div>
                      <span className="text-xs text-slate-400">{formatMaybeDate(job.createdAt || job.postedAt || job.created_at, '7d ago')}</span>
                    </div>
                    <p className="mt-2.5 line-clamp-2 text-[15px] font-bold text-navy">{job.jobTitle || 'Untitled role'}</p>
                    <p className="mt-1 text-xs text-slate-500">{job.companyName || 'Unknown company'}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                      <FiMapPin size={14} /> {job.jobLocation || 'Remote'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/portal/student/jobs')}
            className="block w-full rounded-[1.5rem] border border-slate-200 bg-white p-3.5 text-left transition hover:border-brand-200 hover:shadow-sm"
          >
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[1.2rem] border border-slate-200 bg-slate-50 text-lg font-black text-navy">
              QR
            </div>
            <p className="mt-3 text-[15px] font-medium leading-snug text-slate-900">
              <span className="text-[1.45rem] font-extrabold text-navy">3587</span> users explored HHH Jobs in the last 30 mins!
            </p>
            <p className="mt-2.5 text-xs leading-5 text-slate-500">Scan to open HHH Jobs on Play Store or App Store.</p>
          </button>

          <a
            href={BLOG_BASE_URL}
            className="block w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-left transition hover:border-brand-200 hover:shadow-sm"
          >
            <div className="h-20 overflow-hidden bg-[linear-gradient(135deg,#dbeafe_0%,#bfdbfe_40%,#e2e8f0_100%)]">
              <img
                src={careerCompassDashboard}
                alt="HHH Jobs Career Pulse"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-3.5">
              <p className="text-[15px] font-extrabold leading-6 text-navy">
                HHH Jobs Career Pulse: March&apos;26 shows stronger white-collar hiring as FY&apos;26 opens.
              </p>
              <span className="mt-3 inline-flex text-sm font-bold text-brand-700">
                Know more
              </span>
            </div>
          </a>
        </aside>
      </section>

      <p className="hidden text-xs">{profileIdentity.label}: {profileIdentity.value}</p>
    </div>
  );
};

export default StudentHomePage;
