import {
  FiActivity,
  FiBarChart2,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiFileText,
  FiGlobe,
  FiHome,
  FiStar,
  FiUser
} from 'react-icons/fi';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import { getCurrentUser } from '../../../utils/auth';

const studentNavItems = [
  { to: '/portal/student/dashboard', label: 'Dashboard', icon: FiHome },
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
  { to: '/portal/student/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/portal/student/company-reviews', label: 'Company Reviews', icon: FiStar }
];

const StudentModuleLayout = () => {
  const currentUser = getCurrentUser();
  const isRetiredUser = currentUser?.role === 'retired_employee';

  return (
    <PortalWorkbenchLayout
      portalKey="student"
      portalLabel={isRetiredUser ? 'Retired Professional Workspace' : 'Student Workspace'}
      subtitle={isRetiredUser
        ? 'Refresh your experience profile, track opportunities, and return to the market with a calmer, premium workspace.'
        : 'Build profile strength, discover better-fit jobs, and manage every application in one focused premium workspace.'}
      navItems={studentNavItems}
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
