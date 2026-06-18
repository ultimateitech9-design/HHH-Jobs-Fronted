import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiEye, FiEyeOff, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import AdminHeader from '../components/AdminHeader';
import ConfirmModal from '../components/ConfirmModal';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import UsersTable from '../components/UsersTable';
import useUsers from '../hooks/useUsers';
import { ASSIGNABLE_DASHBOARD_ROLE_OPTIONS, USER_ROLES, USER_ROLE_LABELS } from '../constants/userRoles';
import { createAdminUser, deleteUser, updateUserStatus } from '../services/usersApi';
import { PASSWORD_POLICY_HELPER, getPasswordPolicyError } from '../../../utils/passwordPolicy';
import StateScopePicker from '../../../shared/components/StateScopePicker';

const INITIAL_ADMIN_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'admin',
  mobile: '',
  company: 'HHH Jobs',
  assignedStates: ['Andhra Pradesh'],
  salesCode: '',
  department: 'Administration',
  designation: 'Administrator',
  adminTier: 'standard',
  accessScope: '',
  canManageUsers: 'true',
  clearanceLevel: 'global',
  governanceScope: 'platform',
  emergencyContact: '',
  queueName: '',
  shiftName: '',
  escalationLevel: 'L1',
  voiceEnabled: 'false',
  territory: '',
  pipelineFocus: '',
  quota: '',
  commissionRate: '',
  financeRole: '',
  costCenter: '',
  approvalLimit: '',
  settlementResponsibility: '',
  reviewerLevel: 'L1',
  targetVolume: '',
  qualityScore: '',
  companyName: '',
  workEmail: '',
  companyWebsite: '',
  industryType: '',
  companySize: '',
  companyType: '',
  foundedYear: '',
  location: '',
  stateName: '',
  districtName: '',
  contactEmail: '',
  contactPhone: '',
  city: '',
  affiliation: '',
  establishedYear: '',
  website: '',
  placementOfficerName: '',
  dateOfBirth: '',
  notes: '',
  about: ''
};

const getInitialAdminForm = () => ({
  ...INITIAL_ADMIN_FORM,
  assignedStates: [...INITIAL_ADMIN_FORM.assignedStates]
});

const ROLE_FORM_DEFAULTS = {
  admin: { department: 'Administration', designation: 'Administrator', adminTier: 'standard', company: 'HHH Jobs' },
  super_admin: { department: 'Leadership', designation: 'Super Admin', company: 'HHH Jobs' },
  support: { department: 'Support', designation: 'Support Agent', queueName: 'general', company: 'HHH Jobs' },
  sales: { department: 'Sales', designation: 'Sales Executive', company: 'HHH Jobs' },
  dataentry: { department: 'Data Entry', designation: 'Data Entry Operator', queueName: 'default', company: 'HHH Jobs' },
  accounts: { department: 'Accounts', designation: 'Accounts Executive', company: 'HHH Jobs' },
  hr: { company: '' },
  campus_connect: { company: '' },
  student: { company: '' }
};

const PRIMARY_NAME_COPY = {
  hr: { label: 'HR Contact Name', placeholder: 'Enter HR contact name' },
  campus_connect: { label: 'College / University Name', placeholder: 'Enter institution name' },
  student: { label: 'Student Name', placeholder: 'Enter student name' },
  admin: { label: 'Admin Name', placeholder: 'Enter admin name' },
  super_admin: { label: 'Super Admin Name', placeholder: 'Enter super admin name' }
};

const STATE_SCOPED_ROLES = new Set(['admin', 'support', 'sales', 'dataentry', 'accounts']);
const INTERNAL_OPERATIONS_ROLES = new Set(['support', 'sales', 'dataentry', 'accounts']);

const getPrimaryNameCopy = (role) => (
  PRIMARY_NAME_COPY[role] || { label: 'Full Name', placeholder: 'Enter full name' }
);

const cleanText = (value) => String(value || '').trim();
const cleanUpperText = (value) => cleanText(value).toUpperCase();

const CreateUserForm = ({ existingEmails, onCreate, onCancel, onSuccess }) => {
  const [adminForm, setAdminForm] = useState(getInitialAdminForm);
  const [formError, setFormError] = useState('');
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordPolicyError = adminForm.password
    ? getPasswordPolicyError(adminForm.password, '')
    : '';
  const passwordPolicyMessage = adminForm.password
    ? (passwordPolicyError || 'Strong password ready to use.')
    : PASSWORD_POLICY_HELPER;

  const updateAdminForm = (updates) => {
    setAdminForm((current) => ({ ...current, ...updates }));
    if (formError) setFormError('');
  };

  const updateField = (field, value) => {
    updateAdminForm({ [field]: value });
  };

  const handleRoleChange = (role) => {
    const defaults = ROLE_FORM_DEFAULTS[role] || {};
    updateAdminForm({
      role,
      ...defaults
    });
  };

  const addTextField = (payload, key, value) => {
    const text = cleanText(value);
    if (text) payload[key] = text;
  };

  const buildCreatePayload = ({ name, email, password, role, assignedStates, salesCode }) => {
    const payload = {
      name,
      email,
      password,
      role,
      assignedStates
    };

    addTextField(payload, 'mobile', adminForm.mobile);
    addTextField(payload, 'notes', adminForm.notes);

    if (salesCode) {
      payload.salesCode = salesCode;
    }

    if (role === 'hr') {
      const companyName = cleanText(adminForm.companyName);
      payload.company = companyName || 'Employer';
      payload.companyName = companyName;
      payload.department = companyName || 'HR';
      payload.workEmail = cleanText(adminForm.workEmail) || email;
      addTextField(payload, 'companyWebsite', adminForm.companyWebsite);
      addTextField(payload, 'industryType', adminForm.industryType);
      addTextField(payload, 'sectorName', adminForm.industryType);
      addTextField(payload, 'companySize', adminForm.companySize);
      addTextField(payload, 'companyType', adminForm.companyType);
      addTextField(payload, 'foundedYear', adminForm.foundedYear);
      addTextField(payload, 'location', adminForm.location);
      addTextField(payload, 'stateName', adminForm.stateName);
      addTextField(payload, 'districtName', adminForm.districtName);
      addTextField(payload, 'about', adminForm.about);
      return payload;
    }

    if (role === 'campus_connect') {
      payload.company = name;
      payload.collegeName = name;
      addTextField(payload, 'placementOfficerName', adminForm.placementOfficerName);
      payload.contactEmail = cleanText(adminForm.contactEmail) || email;
      addTextField(payload, 'contactPhone', adminForm.contactPhone || adminForm.mobile);
      addTextField(payload, 'city', adminForm.city);
      addTextField(payload, 'districtName', adminForm.city);
      addTextField(payload, 'state', adminForm.stateName);
      addTextField(payload, 'stateName', adminForm.stateName);
      addTextField(payload, 'affiliation', adminForm.affiliation);
      addTextField(payload, 'establishedYear', adminForm.establishedYear);
      addTextField(payload, 'website', adminForm.website);
      addTextField(payload, 'about', adminForm.about);
      return payload;
    }

    if (role === 'student') {
      payload.company = 'Student';
      addTextField(payload, 'dateOfBirth', adminForm.dateOfBirth);
      addTextField(payload, 'stateName', adminForm.stateName);
      addTextField(payload, 'districtName', adminForm.districtName);
      return payload;
    }

    const department = cleanText(adminForm.department) || cleanText(adminForm.company) || 'HHH Jobs';
    payload.company = department;
    payload.department = department;
    addTextField(payload, 'designation', adminForm.designation);

    if (role === 'admin') {
      addTextField(payload, 'adminTier', adminForm.adminTier);
      payload.accessScope = cleanText(adminForm.accessScope) || assignedStates.join(', ');
      payload.canManageUsers = adminForm.canManageUsers === 'true';
      return payload;
    }

    if (role === 'super_admin') {
      addTextField(payload, 'clearanceLevel', adminForm.clearanceLevel);
      addTextField(payload, 'governanceScope', adminForm.governanceScope);
      addTextField(payload, 'emergencyContact', adminForm.emergencyContact);
      return payload;
    }

    if (role === 'support') {
      addTextField(payload, 'queueName', adminForm.queueName);
      addTextField(payload, 'shiftName', adminForm.shiftName);
      addTextField(payload, 'escalationLevel', adminForm.escalationLevel);
      payload.voiceEnabled = adminForm.voiceEnabled === 'true';
      return payload;
    }

    if (role === 'sales') {
      addTextField(payload, 'territory', adminForm.territory);
      addTextField(payload, 'pipelineFocus', adminForm.pipelineFocus);
      addTextField(payload, 'quota', adminForm.quota);
      addTextField(payload, 'commissionRate', adminForm.commissionRate);
      return payload;
    }

    if (role === 'accounts') {
      addTextField(payload, 'financeRole', adminForm.financeRole);
      addTextField(payload, 'costCenter', adminForm.costCenter);
      addTextField(payload, 'approvalLimit', adminForm.approvalLimit);
      addTextField(payload, 'settlementResponsibility', adminForm.settlementResponsibility);
      return payload;
    }

    if (role === 'dataentry') {
      addTextField(payload, 'queueName', adminForm.queueName);
      addTextField(payload, 'reviewerLevel', adminForm.reviewerLevel);
      addTextField(payload, 'targetVolume', adminForm.targetVolume);
      addTextField(payload, 'qualityScore', adminForm.qualityScore);
    }

    return payload;
  };

  const renderTextField = ({ field, label, type = 'text', placeholder = '', className = '', ...inputProps }) => (
    <label className={className}>
      {label}
      <input
        type={type}
        value={adminForm[field]}
        onChange={(event) => updateField(field, event.target.value)}
        placeholder={placeholder}
        {...inputProps}
      />
    </label>
  );

  const renderSelectField = ({ field, label, options, className = '' }) => (
    <label className={className}>
      {label}
      <select value={adminForm[field]} onChange={(event) => updateField(field, event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );

  const renderTextareaField = ({ field, label, placeholder = '', className = '' }) => (
    <label className={className}>
      {label}
      <textarea
        value={adminForm[field]}
        onChange={(event) => updateField(field, event.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    </label>
  );

  const renderSectionTitle = (title) => (
    <div className="full-row border-t border-slate-100 pt-3">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
    </div>
  );

  const renderStateScope = (helper) => (
    <label className="full-row">
      State Scope
      <StateScopePicker
        value={adminForm.assignedStates}
        onChange={(assignedStates) => updateField('assignedStates', assignedStates)}
        helper={helper}
      />
    </label>
  );

  const renderHrFields = () => (
    <>
      {renderSectionTitle('HR Details')}
      {renderTextField({ field: 'companyName', label: 'Company Name', placeholder: 'Enter company name' })}
      {renderTextField({ field: 'workEmail', label: 'Work Email', type: 'email', placeholder: 'hr@company.com' })}
      {renderTextField({ field: 'mobile', label: 'Mobile Number', placeholder: '+91 9876543210' })}
      {renderTextField({ field: 'companyWebsite', label: 'Company Website', placeholder: 'https://company.com' })}
      {renderTextField({ field: 'industryType', label: 'Industry / Sector', placeholder: 'IT Services, Manufacturing, etc.' })}
      {renderTextField({ field: 'companySize', label: 'Company Size', placeholder: '51-200 employees' })}
      {renderTextField({ field: 'companyType', label: 'Company Type', placeholder: 'Private, MNC, Startup' })}
      {renderTextField({ field: 'location', label: 'Office Location', placeholder: 'City, State' })}
      {renderTextField({ field: 'stateName', label: 'State', placeholder: 'Maharashtra' })}
      {renderTextField({ field: 'districtName', label: 'District / City', placeholder: 'Mumbai' })}
      {renderTextareaField({ field: 'about', label: 'Company Notes', placeholder: 'Short hiring or company context', className: 'full-row' })}
    </>
  );

  const renderCampusFields = () => (
    <>
      {renderSectionTitle('Campus Details')}
      {renderTextField({ field: 'placementOfficerName', label: 'Placement Officer Name', placeholder: 'Enter placement officer name' })}
      {renderTextField({ field: 'contactEmail', label: 'Placement Email', type: 'email', placeholder: 'placement@college.edu' })}
      {renderTextField({ field: 'mobile', label: 'Login Mobile', placeholder: '+91 9876543210' })}
      {renderTextField({ field: 'contactPhone', label: 'Placement Phone', placeholder: '+91 9876543210' })}
      {renderTextField({ field: 'city', label: 'City / District', placeholder: 'Noida' })}
      {renderTextField({ field: 'stateName', label: 'State', placeholder: 'Uttar Pradesh' })}
      {renderTextField({ field: 'affiliation', label: 'Affiliation / University', placeholder: 'AKTU' })}
      {renderTextField({ field: 'establishedYear', label: 'Established Year', type: 'number', placeholder: '2005', min: '1800', max: String(new Date().getFullYear()) })}
      {renderTextField({ field: 'website', label: 'Website', placeholder: 'https://college.edu' })}
      {renderTextareaField({ field: 'about', label: 'Campus Notes', placeholder: 'Short campus or placement context', className: 'full-row' })}
    </>
  );

  const renderStudentFields = () => (
    <>
      {renderSectionTitle('Student Details')}
      {renderTextField({ field: 'mobile', label: 'Mobile Number', placeholder: '+91 9876543210' })}
      {renderTextField({ field: 'dateOfBirth', label: 'Date of Birth', type: 'date' })}
      {renderTextField({ field: 'stateName', label: 'State', placeholder: 'Delhi' })}
      {renderTextField({ field: 'districtName', label: 'District / City', placeholder: 'New Delhi' })}
    </>
  );

  const renderAdminFields = () => (
    <>
      {renderSectionTitle(adminForm.role === 'super_admin' ? 'Super Admin Details' : 'Admin Details')}
      {renderTextField({ field: 'department', label: 'Department / Team', placeholder: 'Administration' })}
      {renderTextField({ field: 'designation', label: 'Designation', placeholder: 'Administrator' })}
      {adminForm.role === 'super_admin' ? (
        <>
          {renderTextField({ field: 'clearanceLevel', label: 'Clearance Level', placeholder: 'global' })}
          {renderTextField({ field: 'governanceScope', label: 'Governance Scope', placeholder: 'platform' })}
          {renderTextField({ field: 'emergencyContact', label: 'Emergency Contact', placeholder: '+91 9876543210' })}
        </>
      ) : (
        <>
          {renderSelectField({
            field: 'adminTier',
            label: 'Admin Tier',
            options: [
              { value: 'standard', label: 'Standard' },
              { value: 'state', label: 'State Admin' },
              { value: 'regional', label: 'Regional Admin' }
            ]
          })}
          {renderTextField({ field: 'accessScope', label: 'Access Scope', placeholder: 'Selected states' })}
          {renderSelectField({
            field: 'canManageUsers',
            label: 'User Management Access',
            options: [
              { value: 'true', label: 'Allowed' },
              { value: 'false', label: 'Restricted' }
            ]
          })}
          {renderStateScope('Admin gets selected states; employees inherit selected state work.')}
        </>
      )}
      {renderTextareaField({ field: 'notes', label: 'Internal Notes', placeholder: 'Optional admin notes', className: 'full-row' })}
    </>
  );

  const renderOperationsFields = () => (
    <>
      {renderSectionTitle(`${USER_ROLE_LABELS[adminForm.role] || 'Operations'} Details`)}
      {renderTextField({ field: 'department', label: 'Department / Team', placeholder: USER_ROLE_LABELS[adminForm.role] || 'Operations' })}
      {renderTextField({ field: 'designation', label: 'Designation', placeholder: USER_ROLE_LABELS[adminForm.role] || 'Operator' })}
      {adminForm.role === 'support' ? (
        <>
          {renderTextField({ field: 'queueName', label: 'Queue Name', placeholder: 'general' })}
          {renderTextField({ field: 'shiftName', label: 'Shift Name', placeholder: 'Morning' })}
          {renderSelectField({
            field: 'escalationLevel',
            label: 'Escalation Level',
            options: [
              { value: 'L1', label: 'L1' },
              { value: 'L2', label: 'L2' },
              { value: 'L3', label: 'L3' }
            ]
          })}
          {renderSelectField({
            field: 'voiceEnabled',
            label: 'Voice Support',
            options: [
              { value: 'false', label: 'No' },
              { value: 'true', label: 'Yes' }
            ]
          })}
        </>
      ) : null}
      {adminForm.role === 'sales' ? (
        <>
          {renderTextField({ field: 'territory', label: 'Territory', placeholder: 'North India' })}
          {renderTextField({ field: 'pipelineFocus', label: 'Pipeline Focus', placeholder: 'HR, Campus, Student' })}
          {renderTextField({ field: 'quota', label: 'Quota', type: 'number', placeholder: '100000' })}
          {renderTextField({ field: 'commissionRate', label: 'Commission Rate (%)', type: 'number', placeholder: '5', step: '0.01' })}
          {renderTextField({ field: 'salesCode', label: 'Sales Code', placeholder: 'Auto generated if blank' })}
        </>
      ) : null}
      {adminForm.role === 'accounts' ? (
        <>
          {renderTextField({ field: 'financeRole', label: 'Finance Role', placeholder: 'Billing reviewer' })}
          {renderTextField({ field: 'costCenter', label: 'Cost Center', placeholder: 'FIN-001' })}
          {renderTextField({ field: 'approvalLimit', label: 'Approval Limit', type: 'number', placeholder: '50000' })}
          {renderTextField({ field: 'settlementResponsibility', label: 'Settlement Responsibility', placeholder: 'Invoices, payouts' })}
        </>
      ) : null}
      {adminForm.role === 'dataentry' ? (
        <>
          {renderTextField({ field: 'queueName', label: 'Queue Name', placeholder: 'default' })}
          {renderTextField({ field: 'reviewerLevel', label: 'Reviewer Level', placeholder: 'L1' })}
          {renderTextField({ field: 'targetVolume', label: 'Target Volume', type: 'number', placeholder: '100' })}
          {renderTextField({ field: 'qualityScore', label: 'Quality Score', type: 'number', placeholder: '95', step: '0.01' })}
        </>
      ) : null}
      {renderStateScope(`${USER_ROLE_LABELS[adminForm.role] || 'User'} gets selected state work.`)}
      {renderTextareaField({ field: 'notes', label: 'Internal Notes', placeholder: 'Optional role notes', className: 'full-row' })}
    </>
  );

  const renderRoleFields = () => {
    if (adminForm.role === 'hr') return renderHrFields();
    if (adminForm.role === 'campus_connect') return renderCampusFields();
    if (adminForm.role === 'student') return renderStudentFields();
    if (adminForm.role === 'admin' || adminForm.role === 'super_admin') return renderAdminFields();
    if (INTERNAL_OPERATIONS_ROLES.has(adminForm.role)) return renderOperationsFields();
    if (STATE_SCOPED_ROLES.has(adminForm.role)) {
      return renderStateScope(`${USER_ROLE_LABELS[adminForm.role] || 'User'} gets selected state work.`);
    }
    return null;
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    const name = adminForm.name.trim();
    const email = adminForm.email.trim().toLowerCase();
    const password = String(adminForm.password || '');
    const role = adminForm.role || 'admin';
    const assignedStates = Array.isArray(adminForm.assignedStates) ? adminForm.assignedStates : [];
    const salesCode = cleanUpperText(adminForm.salesCode);

    if (!name || !email || !password) {
      setFormError('Name, email, and password are required to create a user ID.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Enter a valid email address like user@example.com.');
      return;
    }

    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    if (existingEmails.has(email)) {
      setFormError('An account with this email already exists.');
      return;
    }

    if (role === 'hr' && !cleanText(adminForm.companyName)) {
      setFormError('Company name is required for HR ID.');
      return;
    }

    if (role === 'campus_connect' && !cleanText(adminForm.placementOfficerName)) {
      setFormError('Placement officer name is required for Campus ID.');
      return;
    }

    setSavingAdmin(true);
    setFormError('');

    try {
      await onCreate(buildCreatePayload({ name, email, password, role, assignedStates, salesCode }));
      setAdminForm(getInitialAdminForm());
      setFormError('');
      onSuccess?.();
    } catch (createError) {
      setFormError(createError.message || 'Unable to create user ID.');
    } finally {
      setSavingAdmin(false);
    }
  };

  const primaryNameCopy = getPrimaryNameCopy(adminForm.role);

  return (
    <form className="form-grid" onSubmit={handleCreateAdmin}>
      <label>
        {primaryNameCopy.label}
        <input
          type="text"
          value={adminForm.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder={primaryNameCopy.placeholder}
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={adminForm.email}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder="user@hhh-jobs.com"
        />
      </label>
      <label>
        Password
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={adminForm.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
            minLength={8}
            aria-invalid={Boolean(passwordPolicyError)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
        <span className={`text-xs font-semibold ${passwordPolicyError ? 'text-rose-600' : 'text-slate-500'}`}>{passwordPolicyMessage}</span>
      </label>
      <label>
        Assigned Role
        <select value={adminForm.role} onChange={(event) => handleRoleChange(event.target.value)}>
          {ASSIGNABLE_DASHBOARD_ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
      </label>
      {renderRoleFields()}
      {formError ? <p className="form-error">{formError}</p> : null}
      <div className="student-job-actions">
        {onCancel ? (
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onCancel} disabled={savingAdmin}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={savingAdmin}>
          {savingAdmin ? 'Creating User...' : `Create ${USER_ROLE_LABELS[adminForm.role] || 'User'} ID`}
        </button>
      </div>
    </form>
  );
};

const CreateUserModal = ({ open, onClose, existingEmails, onCreate }) => {
  useEffect(() => {
    if (!open) return undefined;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal((
    <div className="fixed inset-0 z-[120] bg-slate-900/45 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div className="mx-auto flex h-full max-w-5xl items-start justify-center overflow-y-auto">
        <div className="w-full rounded-[28px] border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Create user ID" onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h3 className="text-lg font-bold text-navy">Create User ID</h3>
              <p className="mt-1 text-sm text-slate-500">Create new operational accounts with assigned role access.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close create user dialog"
            >
              <FiX size={16} />
            </button>
          </div>
          <div className="px-5 py-5 sm:px-6">
            <CreateUserForm existingEmails={existingEmails} onCreate={onCreate} onCancel={onClose} onSuccess={onClose} />
          </div>
        </div>
      </div>
    </div>
  ), document.body);
};

const UsersManagement = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { users, setUsers, filteredUsers, filters, setFilters, loading, error, isDemo, totalUsers, totalPages } = useUsers({ page, pageSize });
  const [pendingStatusAction, setPendingStatusAction] = useState(null);
  const [formMessage, setFormMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [statusBusyId, setStatusBusyId] = useState('');
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const paginatedUsers = filteredUsers;

  const cards = useMemo(() => [
    { label: 'Total Users', value: String(totalUsers || users.length), helper: `${users.length} loaded on this page`, tone: 'info' },
    { label: 'Active on Page', value: String(users.filter((item) => item.status === 'active').length), helper: 'Loaded rows', tone: 'success' },
    { label: 'Pending on Page', value: String(users.filter((item) => item.status === 'pending').length), helper: 'Approval review', tone: 'warning' },
    { label: 'Blocked on Page', value: String(users.filter((item) => item.status === 'blocked').length), helper: 'Restricted', tone: 'danger' },
    { label: 'Banned on Page', value: String(users.filter((item) => item.status === 'banned').length), helper: 'Access removed', tone: 'danger' }
  ], [totalUsers, users]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleCreateAdmin = async (payload) => {
    setFormMessage('');

    const createdUser = await createAdminUser(payload);
    const role = payload.role || createdUser.role || 'admin';
    const company = payload.company || payload.companyName || payload.department || createdUser.company || 'HHH Jobs';
    const assignedStates = createdUser.assignedStates || payload.assignedStates || [];
    const salesCode = createdUser.salesCode || payload.salesCode || '';
    setUsers((current) => [{ ...createdUser, role, company, assignedStates, salesCode }, ...current]);
    setFormMessage(`${USER_ROLE_LABELS[role] || 'User'} ID ${(createdUser.displayId || createdUser.id)} created for ${payload.name}. This email and password can now open the assigned dashboard.`);
    setPage(1);
  };

  const existingEmails = useMemo(
    () => new Set(users.map((user) => String(user.email || '').toLowerCase()).filter(Boolean)),
    [users]
  );

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    try {
      await deleteUser(deletingAdmin.id);
      setUsers((current) => current.filter((user) => user.id !== deletingAdmin.id));
      setFormMessage(`${USER_ROLE_LABELS[deletingAdmin.role] || 'User'} ID ${(deletingAdmin.displayId || deletingAdmin.id)} deleted.`);
      setActionError('');
      setDeletingAdmin(null);
    } catch (deleteError) {
      setActionError(deleteError.message || 'Unable to delete this user.');
    }
  };

  const applyFilters = (nextFilters) => {
    setPage(1);
    setFilters(nextFilters);
  };

  const handleStatusAction = (user, status) => {
    if (!user || user.status === status) return;
    setPendingStatusAction({ user, status });
  };

  const confirmStatusAction = async () => {
    if (!pendingStatusAction?.user || !pendingStatusAction?.status) return;

    const { user, status } = pendingStatusAction;
    setStatusBusyId(user.id);
    try {
      const updated = await updateUserStatus(user.id, status);
      setUsers((current) => current.map((entry) => (entry.id === user.id ? { ...entry, ...updated, status } : entry)));
      setFormMessage(`${user.name} is now ${status}.`);
      setActionError('');
      setPendingStatusAction(null);
    } catch (updateError) {
      setActionError(updateError.message || 'Unable to update this user.');
    } finally {
      setStatusBusyId('');
    }
  };

  return (
    <div className="module-page module-page--admin min-w-0">
      <AdminHeader
        title="Users Management"
        subtitle="Manage user lifecycle, roles, and access status."
        action={(
          <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => setIsCreateUserOpen(true)}>
            <FiPlus size={14} /> Create User ID
          </button>
        )}
      />
      {isDemo ? <p className="module-note">Demo data is shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {actionError ? <p className="form-error">{actionError}</p> : null}
      {formMessage ? <p className="module-note">{formMessage}</p> : null}
      <DashboardStatsCards cards={cards} className="stats-grid--users-management" />
      <section className="panel-card min-w-0">
        <FilterBar
          className="filter-bar--users-management"
          filters={draftFilters}
          onChange={(key, value) => setDraftFilters((current) => ({ ...current, [key]: value }))}
          fields={[
            { key: 'role', label: 'Role', options: USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABELS[role] || role })) },
            { key: 'status', label: 'Status', options: ['active', 'pending', 'blocked', 'banned'].map((status) => ({ value: status, label: status })) }
          ]}
          actions={(
            <>
              <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => applyFilters(draftFilters)}>
                <FiSearch size={14} /> Search
              </button>
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-2"
                onClick={() => setIsCreateUserOpen(true)}
              >
                <FiPlus size={14} /> Create User ID
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const nextFilters = {
                    ...draftFilters,
                    role: draftFilters.role === 'hr' ? '' : 'hr'
                  };
                  setDraftFilters(nextFilters);
                  applyFilters(nextFilters);
                }}
              >
                {draftFilters.role === 'hr' ? 'Show All IDs' : 'Show HR IDs'}
              </button>
            </>
          )}
        />
        {loading ? <p className="module-note">Loading users...</p> : null}
        <UsersTable rows={paginatedUsers} onDelete={setDeletingAdmin} onStatusChange={handleStatusAction} busyUserId={statusBusyId} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
      <ConfirmModal
        open={Boolean(deletingAdmin)}
        title="Delete user account"
        message={deletingAdmin ? `Delete ${USER_ROLE_LABELS[deletingAdmin.role] || 'user'} ID ${(deletingAdmin.displayId || deletingAdmin.id)} for ${deletingAdmin.name}? This action removes portal access for that account.` : ''}
        confirmLabel={`Delete ${USER_ROLE_LABELS[deletingAdmin?.role] || 'user'}`}
        onConfirm={handleDeleteAdmin}
        onClose={() => setDeletingAdmin(null)}
      />
      <ConfirmModal
        open={Boolean(pendingStatusAction)}
        title="Change user status"
        message={pendingStatusAction ? `Set ${pendingStatusAction.user.name} to ${pendingStatusAction.status}?` : ''}
        confirmLabel={`Mark ${pendingStatusAction?.status || 'user'}`}
        onConfirm={confirmStatusAction}
        onClose={() => setPendingStatusAction(null)}
      />
      <CreateUserModal
        open={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        existingEmails={existingEmails}
        onCreate={handleCreateAdmin}
      />
    </div>
  );
};

export default UsersManagement;
