export const PERMISSIONS = [
  'users.manage',
  'command_search.use',
  'companies.manage',
  'campuses.manage',
  'jobs.manage',
  'applications.view',
  'payments.manage',
  'payments.view',
  'reports.view',
  'reports.health.view',
  'settings.manage',
  'logs.view',
  'student_logs.view',
  'hr_logs.view',
  'campus_logs.view',
  'roles.manage',
  'support.manage'
];

export const PERMISSION_GROUPS = [
  {
    label: 'People & Access',
    permissions: ['users.manage', 'command_search.use', 'roles.manage']
  },
  {
    label: 'Marketplace',
    permissions: ['companies.manage', 'campuses.manage', 'jobs.manage', 'applications.view']
  },
  {
    label: 'Finance',
    permissions: ['payments.view', 'payments.manage']
  },
  {
    label: 'Operations & Reporting',
    permissions: ['reports.view', 'reports.health.view', 'logs.view', 'student_logs.view', 'hr_logs.view', 'campus_logs.view', 'support.manage', 'settings.manage']
  }
];
