import { PERMISSIONS } from '../constants/permissions';
import { getManagementDisplayId } from '../../../utils/managedUsers';

const firstRelation = (value) => {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
};

const normalizeUserStatus = (user = {}) => {
  const rawStatus = String(user.status || '').toLowerCase();

  if (rawStatus === 'blocked' || rawStatus === 'banned') return rawStatus;
  if (user.role === 'hr' && user.is_hr_approved === false) return 'pending';

  return rawStatus || 'active';
};

const mapJobStage = (value) => {
  const status = String(value || '').toLowerCase();
  if (status === 'interviewed') return 'interview';
  if (status === 'offered' || status === 'hired') return 'selected';
  return status || 'applied';
};

export const mapApiUserToUi = (user = {}) => ({
  id: user.id,
  displayId: getManagementDisplayId(user.id, user.role),
  name: user.name || '-',
  email: user.email || '-',
  role: user.role || 'student',
  company: user.company || user.department || (user.role === 'hr' ? 'Employer' : 'HHH Jobs'),
  status: normalizeUserStatus(user),
  verified: Boolean(user.verified ?? user.is_email_verified ?? user.is_hr_approved),
  lastActiveAt: user.lastActiveAt || user.last_login_at || null,
  createdAt: user.createdAt || user.created_at || null
});

export const mapApiCompanyToUi = (company = {}) => {
  const owner = firstRelation(company.users);
  const status = owner?.status !== 'active'
    ? 'inactive'
    : owner?.is_hr_approved === false
      ? 'pending'
      : 'active';

  return {
    id: company.id,
    name: company.company_name || owner?.name || 'Unnamed company',
    plan: company.plan || (company.is_verified ? 'Verified employer' : 'Review required'),
    industry: company.industry_type || 'General',
    owner: owner?.name || owner?.email || '-',
    jobs: Number(company.job_count || company.jobs || 0),
    applications: Number(company.application_count || company.applications || 0),
    status,
    health: status !== 'active' ? 'degraded' : (company.is_verified ? 'healthy' : 'warning'),
    renewedAt: company.updated_at || company.created_at || null
  };
};

export const mapApiCampusToUi = (campus = {}) => {
  const owner = firstRelation(campus.users);
  const acceptedConnections = Number(campus.connectedCompanies ?? campus.connected_companies ?? 0);
  const pendingConnections = Number(campus.pendingRequests ?? campus.pending_requests ?? 0);
  const ownerStatus = String(owner?.status || campus.ownerStatus || '').toLowerCase();

  const status = campus.status
    || (ownerStatus && ownerStatus !== 'active'
      ? 'inactive'
      : acceptedConnections > 0
        ? 'active'
        : pendingConnections > 0
          ? 'pending'
          : 'inactive');

  return {
    id: campus.id,
    name: campus.name || 'Campus Partner',
    city: campus.city || '-',
    state: campus.state || '',
    affiliation: campus.affiliation || '-',
    totalPool: Number(campus.totalPool ?? campus.total_pool ?? 0),
    placedStudents: Number(campus.placedStudents ?? campus.placed_students ?? 0),
    connectedCompanies: acceptedConnections,
    pendingRequests: pendingConnections,
    activeDrives: Number(campus.activeDrives ?? campus.active_drives ?? 0),
    status,
    joinedAt: campus.joinedAt || campus.joined_at || campus.created_at || null,
    ownerName: owner?.name || campus.ownerName || '-',
    ownerEmail: owner?.email || campus.ownerEmail || '-',
    lastActiveAt: owner?.last_login_at || campus.lastActiveAt || null
  };
};

export const mapApiJobToUi = (job = {}) => ({
  id: job.id,
  title: job.title || job.job_title || '-',
  company: job.company || job.company_name || job.poster_name || '-',
  location: job.location || job.job_location || '-',
  applications: Number(job.applications || job.applications_count || 0),
  status: job.status || 'open',
  approvalStatus: job.approvalStatus || job.approval_status || 'pending',
  category: job.category || '-',
  createdAt: job.createdAt || job.created_at || null
});

export const mapApiApplicationToUi = (application = {}) => ({
  id: application.id,
  candidate: application.candidate || application.applicant_name || application.applicant_email || '-',
  jobTitle: application.jobTitle || application.job_title || application.job_id || '-',
  company: application.company || application.company_name || '-',
  score: Number(application.score || 0),
  stage: mapJobStage(application.stage || application.status),
  status: application.status || 'applied',
  createdAt: application.createdAt || application.created_at || null
});

export const mapApiPaymentToUi = (payment = {}) => ({
  id: payment.id,
  company: payment.company || payment.company_name || payment.user_name || payment.customer_name || '-',
  item: payment.item || payment.plan_name || payment.plan_slug || '-',
  invoiceId: payment.invoiceId || payment.reference_id || payment.reference || '-',
  amount: Number(payment.amount || payment.total_amount || 0),
  method: payment.method || payment.provider || payment.payment_method || '-',
  status: payment.status || 'pending',
  createdAt: payment.createdAt || payment.created_at || null
});

export const mapApiSupportTicketToUi = (ticket = {}) => ({
  id: ticket.id,
  title: ticket.title || '-',
  company: ticket.company || '-',
  assignedTo: ticket.assignedTo || ticket.assignee_name || '-',
  priority: ticket.priority || 'medium',
  status: ticket.status || 'open',
  updatedAt: ticket.updatedAt || ticket.updated_at || ticket.created_at || null
});

export const mapApiSystemLogToUi = (log = {}) => ({
  id: log.id,
  actorId: log.actorId || log.actor_id || '-',
  module: log.module || '-',
  actor: log.actor || log.actor_name || 'System',
  actorRole: log.actorRole || log.actor_role || 'system',
  action: log.action || '-',
  level: log.level || 'info',
  createdAt: log.createdAt || log.created_at || null,
  details: log.details || '-'
});

export const flattenPermissionKeys = (permissions) => {
  if (Array.isArray(permissions)) {
    return permissions.filter((permission) => PERMISSIONS.includes(permission));
  }

  if (!permissions || typeof permissions !== 'object') return [];
  if (permissions['*']) return [...PERMISSIONS];

  const keys = new Set();

  const addIf = (condition, permission) => {
    if (condition && PERMISSIONS.includes(permission)) keys.add(permission);
  };

  addIf(permissions.users, 'users.manage');
  addIf(permissions.companies || permissions.company, 'companies.manage');
  addIf(permissions.jobs || permissions.entries, 'jobs.manage');
  addIf(permissions.applications, 'applications.view');
  addIf(permissions.payments, 'payments.view');
  addIf(permissions.invoices || permissions.transactions || permissions.subscriptions, 'payments.view');
  addIf(
    permissions.payments?.write ||
      permissions.invoices?.write ||
      permissions.transactions?.write ||
      permissions.subscriptions?.write,
    'payments.manage'
  );
  addIf(permissions.reports, 'reports.view');
  addIf(permissions.settings, 'settings.manage');
  addIf(permissions.logs, 'logs.view');
  addIf(permissions.support || permissions.tickets, 'support.manage');

  return [...keys];
};

export const expandPermissionKeys = (permissions = []) => {
  if (permissions.includes('users.manage')) {
    return { '*': { read: true, write: true, delete: true } };
  }

  const next = {};

  if (permissions.includes('companies.manage')) {
    next.companies = { read: true, write: true };
  }

  if (permissions.includes('jobs.manage')) {
    next.jobs = { read: true, write: true, delete: true };
  }

  if (permissions.includes('applications.view')) {
    next.applications = { read: true };
  }

  if (permissions.includes('payments.view') || permissions.includes('payments.manage')) {
    next.payments = { read: true, write: permissions.includes('payments.manage') };
  }

  if (permissions.includes('reports.view')) {
    next.reports = { read: true };
  }

  if (permissions.includes('settings.manage')) {
    next.settings = { read: true, write: true };
  }

  if (permissions.includes('logs.view')) {
    next.logs = { read: true };
  }

  if (permissions.includes('support.manage')) {
    next.support = { read: true, write: true };
  }

  return next;
};

