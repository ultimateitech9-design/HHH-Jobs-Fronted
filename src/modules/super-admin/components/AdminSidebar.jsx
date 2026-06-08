import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiLock,
  FiSearch,
  FiSettings,
  FiShield,
  FiUsers
} from 'react-icons/fi';

export const superAdminNavItems = [
  { to: '/portal/super-admin/dashboard', label: 'Dashboard', icon: FiBarChart2 },
  {
    key: 'people-access',
    label: 'People & Access',
    icon: FiUsers,
    children: [
      { to: '/portal/super-admin/users', label: 'Users', icon: FiUsers },
      { to: '/portal/super-admin/360-search', label: '360 Search', icon: FiSearch },
      { to: '/portal/super-admin/roles-permissions', label: 'Roles & Permissions', icon: FiLock }
    ]
  },
  {
    key: 'marketplace',
    label: 'Marketplace',
    icon: FiBriefcase,
    children: [
      { to: '/portal/super-admin/companies', label: 'Companies', icon: FiHome },
      { to: '/portal/super-admin/campuses', label: 'Campuses', icon: FiBookOpen },
      { to: '/portal/super-admin/jobs', label: 'Jobs', icon: FiBriefcase },
      { to: '/portal/super-admin/applications', label: 'Applications', icon: FiFileText }
    ]
  },
  {
    key: 'activity',
    label: 'Activity Logs',
    icon: FiActivity,
    children: [
      { to: '/portal/super-admin/student-activity-log', label: 'Student Activity Log', icon: FiActivity },
      { to: '/portal/super-admin/hr-activity-log', label: 'HR Activity Log', icon: FiActivity },
      { to: '/portal/super-admin/campus-activity-log', label: 'Campus Activity Log', icon: FiActivity },
      { to: '/portal/super-admin/system-logs', label: 'System Logs', icon: FiShield }
    ]
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: FiCreditCard,
    children: [
      { to: '/portal/super-admin/payments', label: 'Payments', icon: FiCreditCard },
      { to: '/portal/super-admin/subscriptions', label: 'Subscriptions', icon: FiActivity }
    ]
  },
  {
    key: 'operations',
    label: 'Operations',
    icon: FiShield,
    children: [
      { to: '/portal/super-admin/reports', label: 'Website Reports', icon: FiBarChart2 },
      { to: '/portal/super-admin/support-tickets', label: 'Support Tickets', icon: FiShield },
      { to: '/portal/super-admin/system-settings', label: 'System Settings', icon: FiSettings }
    ]
  }
];

const AdminSidebar = () => {
  return (
    <section className="panel-card">
      <h3>Command Priorities</h3>
      <ul className="dash-check-list">
        <li><h4>Protect marketplace trust</h4><p>Review blocked accounts, duplicate signals, and critical support escalations first.</p></li>
        <li><h4>Keep revenue healthy</h4><p>Monitor past due subscriptions, refund pressure, and failed payment retries.</p></li>
        <li><h4>Maintain publishing flow</h4><p>Approve legitimate companies and clear job moderation delays before peak hours.</p></li>
      </ul>
    </section>
  );
};

export default AdminSidebar;
