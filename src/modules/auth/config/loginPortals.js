const baseBenefits = [
  'Cleaner access flow with role-fit guidance before sign-in.',
  'Protected redirect handling so each ID lands only on its assigned workspace.',
  'Focused recovery actions without unnecessary visual clutter.'
];

const managementPortalKeySet = new Set([
  'admin',
  'super-admin',
  'platform',
  'audit',
  'support',
  'sales',
  'dataentry',
  'accounts',
  'campus-connect'
]);

const loginPortals = {
  default: {
    key: 'default',
    title: 'Sign in to HHH Jobs',
    eyebrow: 'Account access',
    description: 'Continue to your HHH Jobs workspace with a calmer, premium sign-in experience.',
    helperText: 'Use your registered email and password to continue.',
    emailLabel: 'Email ID / Username',
    emailPlaceholder: 'Enter your registered email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: true,
    socialRole: 'student',
    allowedLoginRoles: ['student', 'hr'],
    showCreateAccount: true,
    createAccountPath: '/sign-up',
    createAccountLabel: 'Create account',
    showOtpLogin: true,
    benefits: baseBenefits
  },
  student: {
    key: 'student',
    title: 'Student / Candidate login',
    eyebrow: 'Candidate portal',
    description: 'Access jobs, ATS checks, saved roles, and your application workspace.',
    helperText: 'Student and candidate accounts can use email or Google sign-in.',
    emailLabel: 'Student email',
    emailPlaceholder: 'Enter your student email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: true,
    socialRole: 'student',
    showCreateAccount: true,
    createAccountPath: '/sign-up?role=student',
    createAccountLabel: 'Create candidate account',
    showOtpLogin: true,
    defaultRedirectPath: '/portal/student/companies',
    benefits: [
      'Track jobs, applications, and interviews from one focused dashboard.',
      'Get quicker access to ATS and profile-strength workflows.',
      'Use a lighter sign-in flow designed around candidate use cases.'
    ]
  },
  'retired-employee': {
    key: 'retired-employee',
    title: 'Retired professional login',
    eyebrow: 'Experienced talent portal',
    description: 'Return to the market with your profile, opportunities, and application flow in one place.',
    helperText: 'Retired employee accounts can use email or Google sign-in.',
    emailLabel: 'Registered email',
    emailPlaceholder: 'Enter your registered email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: true,
    socialRole: 'retired_employee',
    showCreateAccount: true,
    createAccountPath: '/sign-up?role=retired_employee',
    createAccountLabel: 'Create retired professional account',
    showOtpLogin: true,
    defaultRedirectPath: '/portal/student/companies',
    benefits: [
      'Access opportunities tailored for experienced professionals.',
      'Keep profile strength, interviews, and saved jobs in one calmer workspace.',
      'Use the same streamlined journey across desktop and mobile.'
    ]
  },
  hr: {
    key: 'hr',
    title: 'Recruiter / HR login',
    eyebrow: 'Recruiter workspace',
    description: 'Manage openings, applicants, shortlists, and hiring communication from your recruiter dashboard.',
    helperText: 'Recruiter accounts use secure work-email login.',
    emailLabel: 'Work email',
    emailPlaceholder: 'Enter your work email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    socialRole: 'student',
    showCreateAccount: true,
    createAccountPath: '/sign-up?role=hr',
    createAccountLabel: 'Create recruiter account',
    showOtpLogin: true,
    defaultRedirectPath: '/portal/hr/dashboard',
    benefits: [
      'Move from job posting to candidate review in one workspace.',
      'Keep job descriptions, interview planning, and hiring updates aligned.',
      'Use a cleaner internal-style login flow without public clutter.'
    ]
  },
  admin: {
    key: 'admin',
    title: 'Admin portal login',
    eyebrow: 'Management access',
    description: 'Enter the admin workspace for monitoring, moderation, and operational controls.',
    helperText: 'Only authorized HHH Jobs administrators should use this login page.',
    emailLabel: 'Admin email',
    emailPlaceholder: 'Enter your admin email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    showCreateAccount: false,
    showOtpLogin: true,
    defaultRedirectPath: '/portal/admin/dashboard',
    benefits: [
      'Access reporting, approvals, and operational actions from one dashboard.',
      'Role-based redirect checks help prevent cross-portal sign-in mistakes.',
      'Recovery links stay available without exposing public account actions.'
    ]
  },
  'super-admin': {
    key: 'super-admin',
    title: 'Super admin login',
    eyebrow: 'Executive access',
    description: 'Use the highest-privilege workspace for platform-wide governance and control.',
    helperText: 'Reserved for super admin accounts only.',
    emailLabel: 'Super admin email',
    emailPlaceholder: 'Enter your super admin email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    showCreateAccount: false,
    showOtpLogin: true,
    defaultRedirectPath: '/portal/super-admin/dashboard',
    benefits: [
      'Central access for top-level approvals and system visibility.',
      'Minimal, role-locked sign-in path for reduced confusion.',
      'Direct landing into the protected super admin workspace.'
    ]
  },
  platform: {
    key: 'platform',
    title: 'Platform operations login',
    eyebrow: 'Operations access',
    description: 'Enter the platform workspace for infrastructure, workflow, and process visibility.',
    helperText: 'For authorized platform operations team members only.',
    emailLabel: 'Platform team email',
    emailPlaceholder: 'Enter your platform email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    showCreateAccount: false,
    showOtpLogin: true,
    defaultRedirectPath: '/portal/platform/dashboard',
    benefits: [
      'Stay focused on platform operations without public auth noise.',
      'Cleaner access to operational dashboards and controls.',
      'Safer redirect behavior for internal-only accounts.'
    ]
  },
  audit: {
    key: 'audit',
    title: 'Audit desk login',
    eyebrow: 'Compliance access',
    description: 'Open the audit workspace for review, tracking, and compliance-led workflows.',
    helperText: 'Only authorized compliance and audit personnel should continue here.',
    emailLabel: 'Audit email',
    emailPlaceholder: 'Enter your audit email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    showCreateAccount: false,
    showOtpLogin: true,
    defaultRedirectPath: '/portal/audit/dashboard',
    benefits: [
      'Enter a dedicated compliance-first workspace.',
      'Stay on the correct portal with role-aware redirect protection.',
      'Preserve recovery options while keeping the flow clean and minimal.'
    ]
  },
  support: {
    key: 'support',
    title: 'Support desk login',
    eyebrow: 'Employee access',
    description: 'Access the support dashboard for communication, issue handling, and internal assistance workflows.',
    helperText: 'For verified support team members only.',
    emailLabel: 'Support email',
    emailPlaceholder: 'Enter your support email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    showCreateAccount: false,
    showOtpLogin: true,
    defaultRedirectPath: '/portal/support/dashboard',
    benefits: [
      'Reach support tasks faster with a dedicated employee login path.',
      'Reduce mistakes from shared or generic sign-in pages.',
      'Keep account recovery available without exposing signup prompts.'
    ]
  },
  sales: {
    key: 'sales',
    title: 'Sales dashboard login',
    eyebrow: 'Employee access',
    description: 'Continue to the sales workspace for pipeline visibility, follow-up, and internal coordination.',
    helperText: 'For verified sales team members only.',
    emailLabel: 'Sales email',
    emailPlaceholder: 'Enter your sales email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    showCreateAccount: false,
    showOtpLogin: true,
    defaultRedirectPath: '/portal/sales/overview',
    benefits: [
      'Focused access to sales follow-up and reporting workflows.',
      'Cleaner portal separation between management and employee teams.',
      'Minimal UI tuned for fast repeat sign-ins.'
    ]
  },
  dataentry: {
    key: 'dataentry',
    title: 'Data entry login',
    eyebrow: 'Employee access',
    description: 'Open the data entry workspace for verification support and structured operations tasks.',
    helperText: 'For authorized data entry team members only.',
    emailLabel: 'Data entry email',
    emailPlaceholder: 'Enter your data entry email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    showCreateAccount: false,
    showOtpLogin: true,
    defaultRedirectPath: '/portal/dataentry/dashboard',
    benefits: [
      'Dedicated access path for operational data-entry workflows.',
      'Keeps the experience lighter than a generic shared login page.',
      'Locks redirects to the correct employee workspace.'
    ]
  },
  accounts: {
    key: 'accounts',
    title: 'Accounts dashboard login',
    eyebrow: 'Employee access',
    description: 'Sign in to the accounts workspace for financial review, records, and internal operations.',
    helperText: 'For authorized accounts team members only.',
    emailLabel: 'Accounts email',
    emailPlaceholder: 'Enter your accounts email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    showCreateAccount: false,
    showOtpLogin: true,
    defaultRedirectPath: '/portal/accounts/overview',
    benefits: [
      'Dedicated access for accounts and financial operations teams.',
      'Cleaner role-specific login path with less confusion.',
      'Built to send each account only to its assigned portal.'
    ]
  },
  'campus-connect': {
    key: 'campus-connect',
    title: 'Campus Connect login',
    eyebrow: 'Institution access',
    description: 'Access the campus workspace for placement operations, student records, drives, and outreach tracking.',
    helperText: 'For authorized campus connect and placement-cell accounts only.',
    emailLabel: 'Campus email',
    emailPlaceholder: 'Enter your campus email',
    passwordPlaceholder: 'Enter your password',
    allowSocialLogin: false,
    showCreateAccount: false,
    showOtpLogin: true,
    defaultRedirectPath: '/portal/campus-connect/dashboard',
    benefits: [
      'Open student records, drives, and campus reports from one portal.',
      'Keeps campus access separate from admin and employee dashboards.',
      'Sends each login directly to the placement workspace.'
    ]
  }
};

export const getLoginPortalConfig = (portalKey = '') => {
  const normalizedKey = String(portalKey || '').trim().toLowerCase();
  return loginPortals[normalizedKey] || loginPortals.default;
};

export const isKnownLoginPortal = (portalKey = '') => {
  const normalizedKey = String(portalKey || '').trim().toLowerCase();
  return Boolean(loginPortals[normalizedKey]);
};

export const isManagementLoginPortal = (portalKey = '') => {
  const normalizedKey = String(portalKey || '').trim().toLowerCase();
  return managementPortalKeySet.has(normalizedKey);
};

export default loginPortals;
