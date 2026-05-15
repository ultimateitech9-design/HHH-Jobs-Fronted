export const PORTAL_ACCESS = Object.freeze({
  student: Object.freeze(['student', 'retired_employee', 'admin', 'super_admin']),
  hr: Object.freeze(['hr', 'admin', 'super_admin']),
  admin: Object.freeze(['admin', 'super_admin']),
  superAdmin: Object.freeze(['super_admin', 'admin']),
  accounts: Object.freeze(['admin', 'super_admin', 'accounts']),
  sales: Object.freeze(['admin', 'super_admin', 'sales']),
  support: Object.freeze(['admin', 'super_admin', 'support']),
  platform: Object.freeze(['admin', 'super_admin', 'platform']),
  audit: Object.freeze(['admin', 'super_admin', 'audit']),
  dataentry: Object.freeze(['admin', 'super_admin', 'dataentry']),
  campusConnect: Object.freeze(['admin', 'super_admin', 'campus_connect'])
});
