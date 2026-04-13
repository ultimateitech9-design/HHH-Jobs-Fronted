import {
  FiActivity,
  FiBarChart2,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiFileText,
  FiGlobe,
  FiHome,
  FiUser
} from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import { getCurrentUser } from '../../../utils/auth';

const studentDashboardNavItems = [
  { to: '/portal/student/home', label: 'Dashboard', icon: FiHome },
  { to: '/portal/student/profile', label: 'Profile', icon: FiUser },
  { to: '/portal/student/ats', label: 'ATS', icon: FiActivity },
  {
    key: 'student-jobs-group',
    label: 'Jobs',
    icon: FiBriefcase,
    children: [
      { to: '/portal/student/jobs', label: 'Jobs', icon: FiBriefcase },
      { to: '/portal/student/global-jobs', label: 'Global Jobs', icon: FiGlobe }
    ]
  },
  { to: '/portal/student/applications', label: 'Applications', icon: FiFileText },
  { to: '/portal/student/saved-jobs', label: 'Saved Jobs', icon: FiBookmark },
  { to: '/portal/student/interviews', label: 'Interviews', icon: FiCalendar },
  { to: '/portal/student/analytics', label: 'Analytics', icon: FiBarChart2 }
];

const studentHomeNavItems = [
  { to: '/portal/student/home', label: 'Dashboard', icon: FiHome }
];

const studentHeaderNavItems = [
  { label: 'Jobs', to: '/portal/student/home?jobsView=jobs' },
  { label: 'Companies', to: '/portal/student/home' },
  { label: 'ATS', to: '/portal/student/ats' },
  { label: 'Services', to: '/portal/student/services' }
];

const StudentModuleLayout = () => {
  const currentUser = getCurrentUser();
  const location = useLocation();
  const isRetiredUser = currentUser?.role === 'retired_employee';
  const isStudentHomeRoute = location.pathname === '/portal/student/home';
  const isStudentProfileRoute = location.pathname === '/portal/student/profile';
  const isStudentAtsRoute = location.pathname === '/portal/student/ats';
  const isStudentServicesRoute = location.pathname === '/portal/student/services';
  const isStudentSavedJobsRoute = location.pathname === '/portal/student/saved-jobs';
  const shouldHideSidebar =
    isStudentHomeRoute ||
    isStudentProfileRoute ||
    isStudentAtsRoute ||
    isStudentServicesRoute ||
    isStudentSavedJobsRoute;

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
      hideSidebar={shouldHideSidebar}
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
