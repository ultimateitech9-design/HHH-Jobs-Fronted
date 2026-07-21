import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiFlag,
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
  { to: '/portal/student/jobs', label: 'Recommended Jobs', icon: FiBriefcase, section: 'Discover' },
  { to: '/portal/student/companies', label: 'Companies', icon: FiLayers, section: 'Discover' },
  { to: '/portal/student/govt-jobs', label: 'Government Jobs', icon: FiFlag, section: 'Discover' },
  { to: '/portal/student/campus-connect', label: 'Campus Opportunities', icon: FiBookOpen, section: 'Discover' },
  { to: '/portal/student/global-jobs', label: 'Global Jobs', icon: FiGlobe, section: 'Discover' },
  { to: '/portal/student/profile', label: 'Career Profile', icon: FiUser, section: 'Career Toolkit' },
  { to: '/portal/student/ats', label: 'Resume ATS', icon: FiActivity, section: 'Career Toolkit' },
  { to: '/portal/student/applications', label: 'Applications', icon: FiFileText, section: 'My Activity' },
  { to: '/portal/student/saved-jobs', label: 'Saved Jobs', icon: FiBookmark, section: 'My Activity' },
  { to: '/portal/student/interviews', label: 'Interviews', icon: FiCalendar, section: 'My Activity' },
  { to: '/portal/student/hr-interests', label: 'Recruiter Interest', icon: FiSend, section: 'My Activity' },
  { to: '/portal/student/analytics', label: 'Career Analytics', icon: FiBarChart2, section: 'Insights' },
  { to: '/portal/student/help-support', label: 'Help & Support', icon: FiHelpCircle, section: 'Support' }
];

const studentHomeNavItems = [
  { to: '/portal/student/companies', label: 'Companies', icon: FiLayers }
];

const studentHeaderNavItems = [
  { label: 'Jobs', to: '/portal/student/jobs' },
  { label: 'Govt Jobs', to: '/portal/student/govt-jobs' },
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
