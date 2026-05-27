import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiFileText,
  FiGlobe,
  FiHelpCircle,
  FiLayers,
  FiSend,
  FiUser
} from 'react-icons/fi';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import { getCurrentUser, getToken, setAuthSession } from '../../../utils/auth';
import { getStudentProfile } from '../services/studentApi';

const studentDashboardNavItems = [
  { to: '/portal/student/companies', label: 'Companies', icon: FiLayers },
  { to: '/portal/student/jobs', label: 'Jobs', icon: FiBriefcase },
  { to: '/portal/student/campus-connect', label: 'Campus Connect', icon: FiBookOpen },
  { to: '/portal/student/profile', label: 'Profile', icon: FiUser },
  { to: '/portal/student/ats', label: 'ATS', icon: FiActivity },
  {
    key: 'student-jobs-group',
    label: 'More Jobs',
    icon: FiGlobe,
    children: [
      { to: '/portal/student/jobs', label: 'Jobs', icon: FiBriefcase },
      { to: '/portal/student/global-jobs', label: 'Global Jobs', icon: FiGlobe }
    ]
  },
  { to: '/portal/student/applications', label: 'My Applications', icon: FiFileText },
  { to: '/portal/student/saved-jobs', label: 'Saved Jobs', icon: FiBookmark },
  { to: '/portal/student/interviews', label: 'Interviews', icon: FiCalendar },
  { to: '/portal/student/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/portal/student/hr-interests', label: 'HR Interests', icon: FiSend },
  { to: '/portal/student/help-support', label: 'Help & Support', icon: FiHelpCircle }
];

const studentHomeNavItems = [
  { to: '/portal/student/companies', label: 'Companies', icon: FiLayers }
];

const studentHeaderNavItems = [
  { label: 'Jobs', to: '/portal/student/jobs' },
  { label: 'My Applications', to: '/portal/student/applications' },
  { label: 'Companies', to: '/portal/student/companies' },
  { label: 'Campus Connect', to: '/portal/student/campus-connect' },
  { label: 'ATS', to: '/portal/student/ats' },
  { label: 'Services', to: '/portal/student/services' },
  { label: 'Help', to: '/portal/student/help-support' }
];

const StudentModuleLayout = () => {
  const currentUser = getCurrentUser();
  const location = useLocation();
  const isRetiredUser = currentUser?.role === 'retired_employee';
  const isStudentHomeRoute = location.pathname === '/portal/student/home';

  useEffect(() => {
    let active = true;

    const refreshStudentAvatar = async () => {
      const user = getCurrentUser();
      if (!['student', 'retired_employee'].includes(String(user?.role || '').trim().toLowerCase())) return;

      const response = await getStudentProfile();
      const profile = response.data || {};
      const profileAvatar = profile.avatarUrl || '';
      const storedAvatar = user.avatarUrl || user.avatar_url || '';

      if (!active || response.error || !profileAvatar || profileAvatar === storedAvatar) return;

      const token = getToken();
      if (!token) return;

      setAuthSession(token, {
        ...user,
        name: profile.name || user.name,
        avatarUrl: profileAvatar,
        avatar_url: profileAvatar
      });
    };

    refreshStudentAvatar();

    return () => {
      active = false;
    };
  }, []);

  return (
    <PortalWorkbenchLayout
      portalKey="student"
      portalLabel={isRetiredUser ? 'Retired Professional Workspace' : 'Student Workspace'}
      subtitle={isRetiredUser
        ? 'Refresh your experience profile, track opportunities, and return to the market with a calmer, premium workspace.'
        : 'Build profile strength, discover better-fit jobs, and manage every application in one focused premium workspace.'}
      fullWidthHeader
      headerVariant="student-marketplace"
      headerNavItems={studentHeaderNavItems}
      headerSearchPlaceholder="Search jobs here"
      hideSidebarBrand
      sidebarBelowHeader
      navItems={isStudentHomeRoute ? studentHomeNavItems : studentDashboardNavItems}
      hideSidebar
      support={{
        showCard: false,
        title: isRetiredUser ? 'Profile Priority' : 'Career Priority',
        text: isRetiredUser
          ? 'Highlight recent achievements, preferred role type, and relocation flexibility to improve retired-professional matches.'
          : 'Keep your profile, saved jobs, and resume score updated so recruiter replies stay warm and relevant.',
        to: '/portal/student/profile',
        cta: isRetiredUser ? 'Refine profile' : 'Polish profile',
        searchPlaceholder: 'Search jobs, applications, interviews, ATS checks'
      }}
    />
  );
};

export default StudentModuleLayout;
