import {
  FiBarChart2,
  FiBell,
  FiBook,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiHome,
  FiLink,
  FiSend,
  FiStar,
  FiUser,
  FiUsers,
  FiFileText
} from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import usePlanAccess from '../../../shared/hooks/usePlanAccess';

const hrNavItems = [
  { to: '/portal/hr/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/portal/hr/jobs', label: 'Job Postings', icon: FiBriefcase },
  { to: '/portal/hr/candidates', label: 'Candidate DB', icon: FiUsers },
  { to: '/portal/hr/shortlisted', label: 'Shortlisted', icon: FiStar },
  { to: '/portal/hr/interests', label: 'Sent Interests', icon: FiSend },
  { to: '/portal/hr/interviews', label: 'Interviews', icon: FiCalendar },
  { to: '/portal/hr/campus-connections', label: 'Campus Connections', icon: FiLink },
  { to: '/portal/hr/campus-drives', label: 'Campus Drives', icon: FiBook },
  { to: '/portal/hr/notifications', label: 'Notifications', icon: FiBell },
  { to: '/portal/hr/analytics', label: 'Reports', icon: FiFileText },
  { to: '/portal/hr/employee-verification', label: 'Employee Verification', icon: FiCheckSquare },
  { to: '/portal/hr/profile', label: 'Company Profile', icon: FaBuilding }
];

const HrModuleLayout = () => {
  const { currentPlanConfig, isActive, loading, planName } = usePlanAccess();
  const currentPlanName = loading
    ? 'Loading...'
    : (isActive ? (currentPlanConfig?.name || planName || 'Active plan') : 'No active plan');

  return (
    <PortalWorkbenchLayout
      portalKey="hr"
      portalLabel="HR Dashboard"
      subtitle="Hiring"
      navItems={hrNavItems}
      support={{
        showCard: false,
        title: 'Hiring',
        text: 'Track roles, applicants, and interviews in one place.',
        searchPlaceholder: 'Search candidates or jobs',
        headerAction: (
          <div className="hidden items-center gap-2 xl:inline-flex">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
              Current plan: {currentPlanName}
            </span>
            <Link
              to="/portal/hr/jobs?tab=billing"
              className="rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-[13px] font-semibold text-brand-700 transition-colors hover:bg-brand-100"
            >
              Upgrade plan
            </Link>
          </div>
        )
      }}
    />
  );
};

export default HrModuleLayout;
