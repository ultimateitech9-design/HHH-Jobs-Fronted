export const USER_ROLES = ['super_admin', 'admin', 'platform', 'audit', 'support', 'sales', 'dataentry', 'accounts', 'campus_connect', 'company_admin', 'hr', 'student'];

export const ASSIGNABLE_DASHBOARD_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin Dashboard' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'platform', label: 'Platform Ops' },
  { value: 'audit', label: 'Audit Desk' },
  { value: 'support', label: 'Support Desk' },
  { value: 'sales', label: 'Sales Dashboard' },
  { value: 'dataentry', label: 'Data Entry' },
  { value: 'accounts', label: 'Accounts Dashboard' },
  { value: 'campus_connect', label: 'Campus Connect' }
];

export const USER_ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  platform: 'Platform Ops',
  audit: 'Audit Desk',
  company_admin: 'Company Admin',
  hr: 'HR',
  support: 'Support',
  dataentry: 'Data Entry',
  accounts: 'Accounts',
  sales: 'Sales',
  campus_connect: 'Campus Connect',
  student: 'Student'
};
