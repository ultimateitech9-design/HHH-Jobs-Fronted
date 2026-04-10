export const PORTAL_ACCESS = Object.freeze({
  admin: Object.freeze(['admin']),
  superAdmin: Object.freeze(['super_admin']),
  accounts: Object.freeze(['admin', 'super_admin', 'accounts']),
  sales: Object.freeze(['admin', 'super_admin', 'sales']),
  support: Object.freeze(['admin', 'super_admin', 'support']),
  platform: Object.freeze(['admin', 'super_admin', 'platform']),
  audit: Object.freeze(['admin', 'super_admin', 'audit']),
  dataentry: Object.freeze(['admin', 'super_admin', 'dataentry'])
});
