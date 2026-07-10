export const USER_ROLES = [
  'super_admin',
  'admin',
  'support',
  'sales',
  'dataentry',
  'accounts',
  'platform',
  'audit',
  'finance',
  'campus_connect',
  'company_admin',
  'hr',
  'student',
  'retired_employee',
  'professional'
];

export const USER_ROLE_GROUP_FILTERS = [
  { value: 'group:public', label: 'Public Accounts' },
  { value: 'group:candidates', label: 'Students / Professionals' },
  { value: 'group:employers', label: 'Employers / HR' },
  { value: 'group:campuses', label: 'Campus Connect' },
  { value: 'group:internal', label: 'Internal Staff' },
  { value: 'group:management', label: 'Management' },
  { value: 'group:operations', label: 'Operations' }
];

export const USER_ROLE_FILTER_OPTIONS = [
  ...USER_ROLE_GROUP_FILTERS,
  ...USER_ROLES.map((role) => ({ value: role, label: null }))
];

export const ASSIGNABLE_DASHBOARD_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin Dashboard' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'hr', label: 'HR Dashboard' },
  { value: 'student', label: 'Student Dashboard' },
  { value: 'support', label: 'Support Desk' },
  { value: 'sales', label: 'Sales Dashboard' },
  { value: 'dataentry', label: 'Data Entry' },
  { value: 'accounts', label: 'Accounts Dashboard' },
  { value: 'campus_connect', label: 'Campus Connect' }
];

export const USER_ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  company_admin: 'Company Admin',
  hr: 'HR',
  support: 'Support',
  dataentry: 'Data Entry',
  accounts: 'Accounts',
  platform: 'Platform Ops',
  audit: 'Audit',
  finance: 'Finance',
  sales: 'Sales',
  campus_connect: 'Campus Connect',
  student: 'Student',
  retired_employee: 'Retired Employee',
  professional: 'Professional'
};
