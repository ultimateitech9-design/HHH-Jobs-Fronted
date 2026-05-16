const now = new Date('2026-03-11T10:30:00Z');
const dayMs = 24 * 60 * 60 * 1000;

const isoDaysAgo = (days, hour = 10) => {
  const date = new Date(now.getTime() - dayMs * days);
  date.setUTCHours(hour, 15, 0, 0);
  return date.toISOString();
};

export const adminDummyData = {
  dashboardStats: {
    totalUsers: 18426,
    activeCompanies: 428,
    liveJobs: 1296,
    totalApplications: 38214,
    monthlyRevenue: 1845000,
    openSupportTickets: 34,
    criticalLogs: 5,
    duplicateAccounts: 19,
    pendingApprovals: 43,
    activeSubscriptions: 311
  },
  users: [
    { id: 'USR-1001', name: 'Ritika Sharma', email: 'ritika.sharma@metrobuild.in', role: 'hr', company: 'Metro Build Infra', status: 'active', verified: true, lastActiveAt: isoDaysAgo(0, 8), createdAt: isoDaysAgo(18, 9) },
    { id: 'USR-1002', name: 'Kunal Arora', email: 'kunal.arora@studentmail.com', role: 'student', company: 'Independent', status: 'active', verified: true, lastActiveAt: isoDaysAgo(0, 7), createdAt: isoDaysAgo(62, 11) },
    { id: 'USR-1003', name: 'Nisha Support', email: 'nisha.support@hhh-jobs.com', role: 'support', company: 'HHH Jobs', status: 'active', verified: true, lastActiveAt: isoDaysAgo(0, 9), createdAt: isoDaysAgo(120, 10) },
    { id: 'USR-1004', name: 'Aman Verma', email: 'aman.verma@zenithcareers.com', role: 'company_admin', company: 'Zenith Careers', status: 'pending', verified: false, lastActiveAt: isoDaysAgo(2, 14), createdAt: isoDaysAgo(6, 13) },
    { id: 'USR-1005', name: 'Priya Nandan', email: 'priya.nandan@hhh-jobs.com', role: 'data_entry', company: 'HHH Jobs', status: 'suspended', verified: true, lastActiveAt: isoDaysAgo(4, 12), createdAt: isoDaysAgo(88, 10) },
    { id: 'USR-1006', name: 'Saurabh Malik', email: 'saurabh.malik@govtalent.org', role: 'hr', company: 'Gov Talent Mission', status: 'blocked', verified: true, lastActiveAt: isoDaysAgo(9, 16), createdAt: isoDaysAgo(200, 8) }
  ],
  companies: [
    { id: 'COM-101', name: 'Metro Build Infra', plan: 'Enterprise Hiring', industry: 'Infrastructure', jobs: 84, recruiters: 16, applications: 2180, status: 'active', health: 'healthy', owner: 'Ritika Sharma', renewedAt: isoDaysAgo(12, 10) },
    { id: 'COM-102', name: 'Zenith Careers', plan: 'Growth ATS', industry: 'Staffing', jobs: 31, recruiters: 6, applications: 914, status: 'pending', health: 'warning', owner: 'Aman Verma', renewedAt: isoDaysAgo(37, 9) },
    { id: 'COM-103', name: 'Prime Skill Labs', plan: 'Subscription Plus', industry: 'Education', jobs: 17, recruiters: 4, applications: 402, status: 'active', health: 'healthy', owner: 'Devika Jain', renewedAt: isoDaysAgo(21, 11) },
    { id: 'COM-104', name: 'Rural Talent Mission', plan: 'Government Program', industry: 'Public Sector', jobs: 9, recruiters: 3, applications: 126, status: 'inactive', health: 'degraded', owner: 'Sonia Dabas', renewedAt: isoDaysAgo(95, 15) }
  ],
  campuses: [
    { id: 'CAMP-101', name: 'Vikrant Institute of Technology', city: 'Indore', state: 'Madhya Pradesh', affiliation: 'RGPV', totalPool: 1240, placedStudents: 418, connectedCompanies: 28, activeDrives: 6, status: 'active', joinedAt: isoDaysAgo(120, 10) },
    { id: 'CAMP-102', name: 'Mangalmay Group of Institutions', city: 'Greater Noida', state: 'Uttar Pradesh', affiliation: 'AKTU', totalPool: 980, placedStudents: 301, connectedCompanies: 19, activeDrives: 4, status: 'active', joinedAt: isoDaysAgo(160, 11) },
    { id: 'CAMP-103', name: 'Shivani Engineering College', city: 'Jaipur', state: 'Rajasthan', affiliation: 'RTU', totalPool: 640, placedStudents: 146, connectedCompanies: 8, activeDrives: 2, status: 'pending', joinedAt: isoDaysAgo(45, 12) },
    { id: 'CAMP-104', name: 'National Commerce Campus', city: 'Lucknow', state: 'Uttar Pradesh', affiliation: 'LU', totalPool: 420, placedStudents: 88, connectedCompanies: 0, activeDrives: 0, status: 'inactive', joinedAt: isoDaysAgo(18, 9) }
  ],
  jobs: [
    { id: 'JOB-501', title: 'Civil Site Engineer', company: 'Metro Build Infra', location: 'Gurugram', category: 'Engineering', status: 'open', approvalStatus: 'approved', applications: 132, createdAt: isoDaysAgo(4, 9) },
    { id: 'JOB-502', title: 'Senior Recruiter', company: 'Zenith Careers', location: 'Noida', category: 'Recruitment', status: 'pending', approvalStatus: 'pending', applications: 22, createdAt: isoDaysAgo(2, 12) },
    { id: 'JOB-503', title: 'Accounts Executive', company: 'Prime Skill Labs', location: 'Jaipur', category: 'Finance', status: 'closed', approvalStatus: 'approved', applications: 71, createdAt: isoDaysAgo(12, 14) },
    { id: 'JOB-504', title: 'Field Coordinator', company: 'Rural Talent Mission', location: 'Lucknow', category: 'Operations', status: 'suspended', approvalStatus: 'rejected', applications: 15, createdAt: isoDaysAgo(8, 10) }
  ],
  applications: [
    { id: 'APP-9001', candidate: 'Kunal Arora', jobTitle: 'Civil Site Engineer', company: 'Metro Build Infra', stage: 'interview', score: 84, status: 'active', createdAt: isoDaysAgo(3, 9) },
    { id: 'APP-9002', candidate: 'Neha Sethi', jobTitle: 'Senior Recruiter', company: 'Zenith Careers', stage: 'shortlisted', score: 79, status: 'active', createdAt: isoDaysAgo(1, 11) },
    { id: 'APP-9003', candidate: 'Arjun Bedi', jobTitle: 'Accounts Executive', company: 'Prime Skill Labs', stage: 'selected', score: 91, status: 'closed', createdAt: isoDaysAgo(9, 14) },
    { id: 'APP-9004', candidate: 'Pooja Mehta', jobTitle: 'Field Coordinator', company: 'Rural Talent Mission', stage: 'rejected', score: 52, status: 'closed', createdAt: isoDaysAgo(6, 13) }
  ],
  payments: [
    { id: 'PAY-701', company: 'Metro Build Infra', item: 'Enterprise Hiring Renewal', amount: 420000, method: 'Bank Transfer', status: 'paid', invoiceId: 'INV-1801', createdAt: isoDaysAgo(5, 10) },
    { id: 'PAY-702', company: 'Zenith Careers', item: 'Growth ATS Monthly', amount: 85000, method: 'Card', status: 'pending', invoiceId: 'INV-1802', createdAt: isoDaysAgo(1, 15) },
    { id: 'PAY-703', company: 'Prime Skill Labs', item: 'Resume Database Credits', amount: 54000, method: 'UPI', status: 'paid', invoiceId: 'INV-1803', createdAt: isoDaysAgo(10, 12) },
    { id: 'PAY-704', company: 'Rural Talent Mission', item: 'Job Boost Package', amount: 18000, method: 'Card', status: 'refunded', invoiceId: 'INV-1804', createdAt: isoDaysAgo(16, 9) }
  ],
  subscriptions: [
    { id: 'SUB-301', company: 'Metro Build Infra', plan: 'Enterprise Hiring', seats: 25, renewalDate: isoDaysAgo(-18, 10), status: 'active', mrr: 210000 },
    { id: 'SUB-302', company: 'Zenith Careers', plan: 'Growth ATS', seats: 8, renewalDate: isoDaysAgo(7, 10), status: 'past_due', mrr: 85000 },
    { id: 'SUB-303', company: 'Prime Skill Labs', plan: 'Subscription Plus', seats: 5, renewalDate: isoDaysAgo(-9, 10), status: 'active', mrr: 64000 }
  ],
  supportTickets: [
    { id: 'SUP-5101', title: 'Invoice mismatch on renewal', company: 'Zenith Careers', priority: 'critical', status: 'escalated', assignedTo: 'Billing Escalation', updatedAt: isoDaysAgo(0, 8) },
    { id: 'SUP-5102', title: 'Job approval not reflected in HR panel', company: 'Metro Build Infra', priority: 'high', status: 'open', assignedTo: 'Ops Support', updatedAt: isoDaysAgo(0, 9) },
    { id: 'SUP-5103', title: 'Duplicate student profiles detected', company: 'Portal-wide', priority: 'medium', status: 'pending', assignedTo: 'Trust Desk', updatedAt: isoDaysAgo(1, 14) }
  ],
  systemLogs: [
    { id: 'LOG-801', module: 'payments', level: 'critical', actor: 'system', actorRole: 'system', actorId: 'SYS-CORE', action: 'gateway-webhook-failed', details: 'Payment gateway webhook retries exceeded threshold.', createdAt: isoDaysAgo(0, 7) },
    { id: 'LOG-802', module: 'jobs', level: 'warning', actor: 'admin@hhh-jobs.com', actorRole: 'admin', actorId: 'ADM-1001', action: 'job-bulk-status-update', details: '22 jobs moved to compliance review queue.', createdAt: isoDaysAgo(1, 15) },
    { id: 'LOG-803', module: 'auth', level: 'info', actor: 'security-bot', actorRole: 'system', actorId: 'BOT-SEC', action: 'suspicious-login-detected', details: 'Unusual location blocked for user USR-1006.', createdAt: isoDaysAgo(2, 13) },
    { id: 'LOG-804', module: 'support', level: 'critical', actor: 'system', actorRole: 'system', actorId: 'SYS-SLA', action: 'sla-breach', details: 'A critical billing ticket exceeded the first response threshold.', createdAt: isoDaysAgo(0, 6) },
    { id: 'LOG-805', module: 'users', level: 'info', actor: 'platform.admin@hhh-jobs.com', actorRole: 'admin', actorId: 'ADM-1002', action: 'admin-user-created', details: 'Created a new company admin account for Metro Build Infra.', createdAt: isoDaysAgo(0, 11) },
    { id: 'LOG-806', module: 'companies', level: 'warning', actor: 'ops.admin@hhh-jobs.com', actorRole: 'admin', actorId: 'ADM-1003', action: 'company-status-updated', details: 'Moved Zenith Careers into pending compliance review.', createdAt: isoDaysAgo(1, 10) },
    { id: 'LOG-807', module: 'applications', level: 'info', actor: 'review.admin@hhh-jobs.com', actorRole: 'admin', actorId: 'ADM-1004', action: 'application-stage-override', details: 'Manually restored 14 shortlisted applications after recruiter dispute.', createdAt: isoDaysAgo(2, 9) },
    { id: 'LOG-808', module: 'sales', level: 'info', actor: 'sales.lead@hhh-jobs.com', actorRole: 'sales', actorId: 'SAL-2101', action: 'lead-converted', details: 'Campus Basic lead converted into paying customer.', createdAt: isoDaysAgo(0, 14) },
    { id: 'LOG-809', module: 'accounts', level: 'warning', actor: 'accounts.team@hhh-jobs.com', actorRole: 'accounts', actorId: 'ACC-3101', action: 'invoice-marked-past-due', details: 'One enterprise invoice crossed the due date threshold.', createdAt: isoDaysAgo(1, 12) },
    { id: 'LOG-810', module: 'support', level: 'info', actor: 'nisha.support@hhh-jobs.com', actorRole: 'support', actorId: 'SUP-4101', action: 'ticket-escalated', details: 'Escalated a recruiter onboarding ticket to compliance.', createdAt: isoDaysAgo(0, 16) },
    { id: 'LOG-811', module: 'audit', level: 'critical', actor: 'audit.team@hhh-jobs.com', actorRole: 'audit', actorId: 'AUD-5101', action: 'policy-breach-flagged', details: 'Potential privilege misuse flagged for review.', createdAt: isoDaysAgo(2, 15) },
    { id: 'LOG-812', module: 'dataentry', level: 'info', actor: 'ops.dataentry@hhh-jobs.com', actorRole: 'dataentry', actorId: 'DE-6101', action: 'bulk-record-imported', details: 'Imported 120 job records from offline intake.', createdAt: isoDaysAgo(3, 10) },
    { id: 'LOG-813', module: 'hr', level: 'warning', actor: 'ritika.sharma@metrobuild.in', actorRole: 'hr', actorId: 'HR-7101', action: 'job-approval-requested', details: 'Requested approval for urgent metro hiring campaign.', createdAt: isoDaysAgo(1, 9) },
    { id: 'LOG-814', module: 'campus_connect', level: 'info', actor: 'placement.cell@vikrant.edu', actorRole: 'campus_connect', actorId: 'CC-8101', action: 'campus-drive-created', details: 'Created a new campus drive for final-year engineering students.', createdAt: isoDaysAgo(0, 13) }
  ],
  reports: {
    adoption: [
      { label: 'Users', value: 18426, helper: 'Across all roles', status: 'healthy' },
      { label: 'Companies', value: 428, helper: 'Active employer accounts', status: 'healthy' },
      { label: 'Jobs', value: 1296, helper: 'Live jobs on the portal', status: 'warning' },
      { label: 'Applications', value: 38214, helper: 'Candidate pipeline volume', status: 'healthy' }
    ],
    revenueTrend: [
      { period: 'Oct', revenue: 1420000 },
      { period: 'Nov', revenue: 1545000 },
      { period: 'Dec', revenue: 1610000 },
      { period: 'Jan', revenue: 1725000 },
      { period: 'Feb', revenue: 1790000 },
      { period: 'Mar', revenue: 1845000 }
    ],
    moduleHealth: [
      { label: 'Recruiter onboarding', value: 91, helper: 'Verification pipeline throughput', status: 'healthy' },
      { label: 'Billing collections', value: 78, helper: 'Past due accounts need work', status: 'warning' },
      { label: 'Support SLA', value: 72, helper: 'Escalation pressure is elevated', status: 'warning' },
      { label: 'Security posture', value: 96, helper: 'No unresolved admin incidents', status: 'healthy' }
    ]
  },
  rolesPermissions: [
    { role: 'super_admin', permissions: ['users.manage', 'companies.manage', 'jobs.manage', 'applications.view', 'payments.manage', 'reports.view', 'settings.manage', 'logs.view', 'support.manage'] },
    { role: 'admin', permissions: ['users.manage', 'jobs.manage', 'applications.view', 'payments.view', 'reports.view', 'logs.view'] },
    { role: 'support', permissions: ['support.manage', 'reports.view'] },
    { role: 'hr', permissions: ['jobs.manage', 'applications.view'] }
  ],
  systemSettings: {
    maintenanceMode: false,
    allowNewEmployerSignup: true,
    enableResumeSearch: true,
    requireHrApproval: true,
    paymentRetryPolicy: '3 retries / 24 hrs',
    supportSlaHours: 6,
    securityAlertEmails: ['ops@hhh-jobs.com', 'security@hhh-jobs.com']
  }
};
