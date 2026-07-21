import {
  FiBarChart2,
  FiBell,
  FiBriefcase,
  FiCreditCard,
  FiFileText,
  FiHelpCircle,
  FiLink,
  FiUsers
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import PortalWorkbenchLayout from '../../../shared/components/PortalWorkbenchLayout';
import usePlanAccess from '../../../shared/hooks/usePlanAccess';

const campusNavItems = [
  { to: '/portal/campus-connect/dashboard', label: 'Placement Overview', icon: FiBarChart2, section: 'Overview' },
  { to: '/portal/campus-connect/students', label: 'Student Directory', icon: FiUsers, section: 'Placements' },
  { to: '/portal/campus-connect/drives', label: 'Placement Drives', icon: FiBriefcase, section: 'Placements' },
  { to: '/portal/campus-connect/connections', label: 'Employer Connections', icon: FiLink, section: 'Relationships' },
  { to: '/portal/campus-connect/reports', label: 'Placement Reports', icon: FiFileText, section: 'Insights' },
  { to: '/portal/campus-connect/notifications', label: 'Notifications', icon: FiBell, section: 'Account' },
  { to: '/portal/campus-connect/billing', label: 'Plan & Billing', icon: FiCreditCard, section: 'Account' },
  { to: '/portal/campus-connect/help-support', label: 'Help & Support', icon: FiHelpCircle, section: 'Account' }
];

const hasUsableCampusSubscription = (subscription = null) => {
  if (!subscription?.role_plan_slug) return false;
  const status = String(subscription.status || '').toLowerCase();
  if (['cancelled', 'canceled', 'expired'].includes(status)) return false;
  if (subscription?.meta?.pendingAutopaySetup || status === 'pending') return false;
  if (!subscription?.autopay_enabled && (status === 'trialing' || subscription?.meta?.isTrial)) return false;
  if (!subscription.ends_at) return true;
  return new Date(subscription.ends_at).getTime() >= Date.now();
};

const CampusPlanStatusAction = () => {
  const {
    currentPlanConfig,
    loading,
    subscription,
    isTrialing,
    trialDaysRemaining,
    subscriptionDaysRemaining
  } = usePlanAccess();
  const isUsable = hasUsableCampusSubscription(subscription);
  const isTrial = isUsable && (isTrialing || subscription?.meta?.isTrial);
  const planName = currentPlanConfig?.name || subscription?.plan_name || 'Campus Connect';

  if (loading) {
    return (
      <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-500 md:inline-flex">
        Checking plan...
      </span>
    );
  }

  if (!isUsable) {
    return (
      <Link
        to="/portal/campus-connect/billing"
        aria-label="Open Campus Connect billing"
        className="hidden cursor-pointer items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-[13px] font-bold text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 md:inline-flex"
      >
        <FiCreditCard size={13} />
        Upgrade
      </Link>
    );
  }

  return (
    <Link
      to="/portal/campus-connect/billing"
      aria-label="Open Campus Connect billing"
      className={`hidden cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 md:inline-flex ${
        isTrial
          ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 focus-visible:ring-sky-300'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300'
      }`}
      title={subscription?.ends_at ? `Valid till ${new Date(subscription.ends_at).toLocaleDateString('en-IN')}` : planName}
    >
      <FiCreditCard size={13} />
      {isTrial
        ? `Trial: ${trialDaysRemaining || subscriptionDaysRemaining || 0} days left`
        : `Active: ${planName}`}
    </Link>
  );
};

const CampusConnectModuleLayout = () => (
  <PortalWorkbenchLayout
    portalKey="campus-connect"
    portalLabel="Campus Connect"
    subtitle="Manage students, schedule drives, connect with companies, and track placements."
    brandPath="/portal/campus-connect/profile"
    navItems={campusNavItems}
    support={{
      headerAction: <CampusPlanStatusAction />
    }}
  />
);

export default CampusConnectModuleLayout;
