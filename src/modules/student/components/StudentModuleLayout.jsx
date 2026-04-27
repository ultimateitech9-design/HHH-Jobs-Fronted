import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiFileText,
  FiGlobe,
  FiLayers,
  FiSend,
  FiUser,
  FiZap
} from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import { getCurrentUser } from '../../../utils/auth';

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
  { to: '/portal/student/applications', label: 'Applications', icon: FiFileText },
  { to: '/portal/student/saved-jobs', label: 'Saved Jobs', icon: FiBookmark },
  { to: '/portal/student/auto-apply', label: 'Auto Apply', icon: FiZap },
  { to: '/portal/student/interviews', label: 'Interviews', icon: FiCalendar },
  { to: '/portal/student/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/portal/student/hr-interests', label: 'HR Interests', icon: FiSend }
];

const studentHomeNavItems = [
  { to: '/portal/student/companies', label: 'Companies', icon: FiLayers }
];

const studentHeaderNavItems = [
  { label: 'Jobs', to: '/portal/student/jobs' },
  { label: 'Companies', to: '/portal/student/companies' },
  { label: 'Campus Connect', to: '/portal/student/campus-connect' },
  { label: 'ATS', to: '/portal/student/ats' },
  { label: 'Auto Apply', to: '/portal/student/auto-apply' },
  { label: 'Services', to: '/portal/student/services' }
];

const StudentModuleLayout = () => {
  const currentUser = getCurrentUser();
  const location = useLocation();
  const isRetiredUser = currentUser?.role === 'retired_employee';
  const isStudentHomeRoute = location.pathname === '/portal/student/home';

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
