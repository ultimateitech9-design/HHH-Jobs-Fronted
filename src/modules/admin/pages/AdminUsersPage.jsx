import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiUsers, 
  FiSearch, 
  FiShield, 
  FiLock, 
  FiUserX, 
  FiCheckCircle, 
  FiXCircle, 
  FiTrash2, 
  FiPlus, 
  FiKey, 
  FiChevronDown,
  FiEye,
  FiEyeOff,
  FiX
} from 'react-icons/fi';
import {
  getAdminUsers,
  updateAdminHrApproval,
  updateAdminUserStatus
} from '../services/adminApi';
import { createAdminUser, deleteUser } from '../../super-admin/services/usersApi';
import { getDashboardPathByRole } from '../../../utils/auth';
import { PASSWORD_POLICY_HELPER, getPasswordPolicyError } from '../../../utils/passwordPolicy';
import Pagination from '../../../shared/components/Pagination';
import DateTimeCell from '../../../shared/components/DateTimeCell';
import CompanyContextSummary from '../../../shared/components/CompanyContextSummary';
import useDebouncedValue from '../../../shared/hooks/useDebouncedValue';
import {
  getManagementDisplayId
} from '../../../utils/managedUsers';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERS_PAGE_SIZE = 10;

const getUserInitials = (name = '') => {
  const initials = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'U';
};

const initialFilters = {
  role: 'all',
  status: 'all',
  hrClearance: 'all',
  search: ''
};

const ADMIN_USER_ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'group:public', label: 'Public Accounts' },
  { value: 'group:internal', label: 'Internal Staff' },
  { value: 'group:management', label: 'Management' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'platform', label: 'Platform Ops' },
  { value: 'audit', label: 'Audit' },
  { value: 'hr', label: 'Company HR' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'student', label: 'Student / Seeker' },
  { value: 'retired_employee', label: 'Retired Employee' },
  { value: 'professional', label: 'Professional' },
  { value: 'campus_connect', label: 'Campus Connect' },
  { value: 'support', label: 'Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'finance', label: 'Finance' },
  { value: 'dataentry', label: 'Data Entry' }
];

const ADMIN_MANAGED_ROLE_OPTIONS = [
  { value: 'dataentry', label: 'Data Entry' },
  { value: 'support', label: 'Support' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'sales', label: 'Sales' }
];

const toApiFilters = (filters, page = 1) => ({
  role: filters.role === 'all' || String(filters.role || '').startsWith('group:') ? '' : filters.role,
  roleGroup: String(filters.role || '').startsWith('group:') ? String(filters.role).slice(6) : '',
  status: filters.status === 'all' ? '' : filters.status,
  search: filters.search,
  approved: filters.hrClearance === 'verified' ? 'true' : (filters.hrClearance === 'pending' ? 'false' : ''),
  page,
  limit: USERS_PAGE_SIZE
});

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'blocked': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'banned': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [responseLimit, setResponseLimit] = useState(USERS_PAGE_SIZE);
  const [managedAccounts, setManagedAccounts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [managedPage, setManagedPage] = useState(1);
  const [securityPage, setSecurityPage] = useState(1);
  const [showProvisionForm, setShowProvisionForm] = useState(false);
  const [showAuthKey, setShowAuthKey] = useState(false);
  const [accountFormTouched, setAccountFormTouched] = useState({ email: false, password: false });
  const [accountForm, setAccountForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'dataentry',
    department: 'Operations'
  });
  const normalizedAccountEmail = String(accountForm.email || '').trim().toLowerCase();
  const showEmailValidationMessage = accountFormTouched.email && Boolean(normalizedAccountEmail) && !emailRegex.test(normalizedAccountEmail);
  const emailValidationMessage = 'Enter a valid email address like user@example.com.';
  const authKeyPolicyError = accountForm.password
    ? getPasswordPolicyError(accountForm.password, '')
    : '';
  const showAuthKeyValidationMessage = accountFormTouched.password && Boolean(authKeyPolicyError);
  const authKeyValidationMessage = authKeyPolicyError || PASSWORD_POLICY_HELPER;
  const deferredSearch = useDebouncedValue(String(filters.search || '').trim(), 280);

  const loadSecurityUsers = useCallback(async (nextFilters, nextPage, signal) => {
    setLoading(true);
    setError('');

    const response = await getAdminUsers({
      ...toApiFilters(nextFilters, nextPage),
      signal
    });
    if (signal?.aborted) return;
    const payload = response.data || {};
    setUsers(payload.users || []);
    setTotalUsers(Number(payload.total || 0));
    setResponseLimit(Number(payload.limit || USERS_PAGE_SIZE) || USERS_PAGE_SIZE);
    setError(response.error || '');
    setLoading(false);
  }, []);

  const loadManagedAccounts = useCallback(async (signal) => {
    const response = await getAdminUsers({ roleGroup: 'operations', page: 1, limit: 100, signal });
    if (signal?.aborted) return;
    setManagedAccounts(response.data?.users || []);
    if (response.error) setError((current) => current || response.error);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadSecurityUsers({
      role: filters.role,
      status: filters.status,
      hrClearance: filters.hrClearance,
      search: deferredSearch
    }, securityPage, controller.signal);
    return () => controller.abort();
  }, [deferredSearch, filters.hrClearance, filters.role, filters.status, loadSecurityUsers, securityPage]);

  useEffect(() => {
    const controller = new AbortController();
    const handleUsersChanged = () => {
      loadManagedAccounts();
    };

    loadManagedAccounts(controller.signal);
    window.addEventListener('managed-users-changed', handleUsersChanged);
    window.addEventListener('storage', handleUsersChanged);

    return () => {
      controller.abort();
      window.removeEventListener('managed-users-changed', handleUsersChanged);
      window.removeEventListener('storage', handleUsersChanged);
    };
  }, [loadManagedAccounts]);

  const handleCreateManagedAccount = async () => {
    setError('');
    setMessage('');

    const email = normalizedAccountEmail;
    const passwordError = getPasswordPolicyError(accountForm.password, 'Auth Key is required.');

    if (!accountForm.name || !email) {
      setAccountFormTouched((current) => ({ ...current, email: true }));
      setError('Name and Email are required.');
      return;
    }

    if (!emailRegex.test(email)) {
      setAccountFormTouched((current) => ({ ...current, email: true }));
      setError('Enter a valid email address like user@example.com.');
      return;
    }

    const knownEmails = new Set(
      [...users, ...managedAccounts]
        .map((user) => String(user.email || '').trim().toLowerCase())
        .filter(Boolean)
    );

    if (knownEmails.has(email)) {
      setError('Email already registered.');
      return;
    }

    if (passwordError) {
      setAccountFormTouched((current) => ({ ...current, password: true }));
      setError(passwordError.replace('Password', 'Auth Key'));
      return;
    }

    try {
      setBusyAction('create-managed-account');
      const created = await createAdminUser({
        name: accountForm.name,
        email,
        password: accountForm.password,
        role: accountForm.role,
        mobile: accountForm.phone,
        company: 'HHH Jobs',
        department: accountForm.department
      });
      await Promise.all([
        loadSecurityUsers({ ...filters, search: deferredSearch }, 1),
        loadManagedAccounts()
      ]);
      setAccountForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: 'dataentry',
        department: 'Operations'
      });
      setAccountFormTouched({ email: false, password: false });
      setShowProvisionForm(false);
      setManagedPage(1);
      setSecurityPage(1);
      setMessage(`${created.name || accountForm.name} account ${getManagementDisplayId(created.id, created.role || accountForm.role)} created for ${created.role || accountForm.role}. Login will open ${getDashboardPathByRole(created.role || accountForm.role)}.`);
      setTimeout(() => setMessage(''), 4000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to create managed account.'));
    } finally {
      setBusyAction('');
    }
  };

  const handleDeleteManagedAccount = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this internal account?')) return;
    
    setError('');
    setMessage('');

    try {
      const target = managedAccounts.find((account) => account.id === userId);
      await deleteUser(userId);
      await Promise.all([
        loadSecurityUsers({ ...filters, search: deferredSearch }, securityPage),
        loadManagedAccounts()
      ]);
      setMessage(`${target?.name || 'Internal'} account deleted. Dashboard access removed.`);
      setTimeout(() => setMessage(''), 4000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to delete managed account.'));
    }
  };

  const stats = useMemo(() => {
    const hrUsers = users.filter((user) => String(user.role || '').toLowerCase() === 'hr');
    const pendingHr = hrUsers.filter((user) => !user.is_hr_approved).length;
    const blocked = users.filter((user) => String(user.status || '').toLowerCase() === 'blocked').length;
    const banned = users.filter((user) => String(user.status || '').toLowerCase() === 'banned').length;

    return [
      {
        label: 'Total Platform Users',
        value: String(totalUsers),
        helper: `${hrUsers.length} HR accounts on this page`,
        icon: <FiUsers className="text-blue-500" />,
        tone: 'blue'
      },
      {
        label: 'HR Security Approvals',
        value: String(pendingHr),
        helper: 'Requires admin review',
        icon: <FiShield className={pendingHr > 0 ? "text-amber-500" : "text-emerald-500"} />,
        tone: pendingHr > 0 ? 'amber' : 'green'
      },
      {
        label: 'Temporarily Blocked',
        value: String(blocked),
        helper: 'Restricted access',
        icon: <FiLock className="text-amber-500" />,
        tone: 'amber'
      },
      {
        label: 'Banned Accounts',
        value: String(banned),
        helper: 'Permanently suspended',
        icon: <FiUserX className="text-red-500" />,
        tone: 'red'
      }
    ];
  }, [users, totalUsers]);

  const filteredSecurityUsers = users;

  useEffect(() => {
    setSecurityPage(1);
  }, [filters.role, filters.status, filters.hrClearance, filters.search]);

  const securityTotalPages = Math.max(1, Math.ceil(totalUsers / Math.max(1, responseLimit || USERS_PAGE_SIZE)));
  const paginatedSecurityUsers = filteredSecurityUsers;
  const managedTotalPages = Math.max(1, Math.ceil(managedAccounts.length / USERS_PAGE_SIZE));
  const paginatedManagedAccounts = useMemo(
    () => managedAccounts.slice((managedPage - 1) * USERS_PAGE_SIZE, managedPage * USERS_PAGE_SIZE),
    [managedAccounts, managedPage]
  );
  const hasActiveSecurityFilters = filters.role !== 'all'
    || filters.status !== 'all'
    || filters.hrClearance !== 'all'
    || Boolean(String(filters.search || '').trim());

  useEffect(() => {
    if (securityPage > securityTotalPages) {
      setSecurityPage(securityTotalPages);
    }
  }, [securityPage, securityTotalPages]);

  useEffect(() => {
    if (managedPage > managedTotalPages) {
      setManagedPage(managedTotalPages);
    }
  }, [managedPage, managedTotalPages]);

  const securitySearchSuggestions = useMemo(() => {
    const values = new Set();
    users.forEach((user) => {
      const companyNames = user.companyRelations?.companies || user.company_names || user.companyNames || [];
      [
        user.name,
        user.email,
        user.contactNumber,
        user.phone,
        user.mobile,
        user.company,
        user.role,
        user.status,
        ...(Array.isArray(companyNames) ? companyNames : [])
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .forEach((value) => values.add(value));
    });
    return Array.from(values).sort((left, right) => left.localeCompare(right)).slice(0, 30);
  }, [users]);

  const applyLocalPatch = (userId, patch) => {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, ...patch } : user)));
  };

  const handleStatusChange = async (userId, nextStatus) => {
    const user = users.find((entry) => entry.id === userId);
    if (!user || user.status === nextStatus) return;

    if (nextStatus === 'banned' && !window.confirm(`Are you sure you want to PERMANENTLY BAN ${user.name}?`)) return;

    setBusyAction(`status:${userId}`);
    setError('');
    setMessage('');

    try {
      const updated = await updateAdminUserStatus(userId, nextStatus);
      applyLocalPatch(userId, updated);
      setMessage(`Updated ${user.name} to ${nextStatus}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to update user status.'));
    } finally {
      setBusyAction('');
    }
  };

  const handleHrApproval = async (userId, approved) => {
    const user = users.find((entry) => entry.id === userId);
    if (!user) return;

    setBusyAction(`approval:${userId}`);
    setError('');
    setMessage('');

    try {
      const updated = await updateAdminHrApproval(userId, approved);
      applyLocalPatch(userId, updated);
      setMessage(`${user.name} ${approved ? 'approved' : 'set to pending'} for HR access.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to update HR approval.'));
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="admin-ops-page">
      
      <header className="admin-ops-header admin-users-header">
        <div className="admin-users-header__copy">
          <span className="admin-ops-kicker"><FiShield /> Access governance</span>
          <h1 className="admin-ops-title">
            Identity & Access
          </h1>
          <p className="admin-ops-subtitle">Manage platform users, HR verifications, and internal workforce accounts.</p>
        </div>
        <div className="admin-users-header__meta" aria-label="Directory summary">
          <span><strong>{totalUsers}</strong> platform records</span>
          <span><strong>{managedAccounts.length}</strong> workforce accounts</span>
        </div>
      </header>

      {error && (
        <div className="admin-ops-alert admin-ops-alert--error animate-fade-in">
          <FiXCircle size={20} className="shrink-0" /> <span className="font-semibold">{error}</span>
        </div>
      )}
      {message && !error && (
        <div className="admin-ops-alert admin-ops-alert--success animate-fade-in">
          <FiCheckCircle size={20} className="shrink-0" /> <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Stats Grid */}
      <section className="admin-ops-stats">
        {stats.map((card) => (
          <article key={card.label} className="admin-ops-stat-card" data-tone={card.tone}>
            <div className="admin-ops-stat-card__icon">
              {card.icon}
            </div>
            <div className="admin-ops-stat-card__copy">
              <p className="admin-ops-stat-card__label">{card.label}</p>
              <h3 className="admin-ops-stat-card__value">{card.value}</h3>
              <p className="admin-ops-stat-card__helper">{card.helper}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Internal Workforce Management */}
      <section className="admin-ops-panel admin-workforce-panel">
        <div className="admin-ops-panel-header">
          <div className="admin-panel-heading">
            <span className="admin-panel-eyebrow">Internal access</span>
            <h2 className="admin-ops-panel-title">
              <FiKey className="text-brand-500" /> Internal Workforce Accounts
            </h2>
            <p className="admin-ops-panel-note">Provision access credentials for Data Entry, Accounts, Support, and Sales teams.</p>
          </div>
          <button
            type="button"
            className={`admin-toolbar-button${showProvisionForm ? ' admin-toolbar-button--active' : ''}`}
            onClick={() => setShowProvisionForm((current) => !current)}
            aria-expanded={showProvisionForm}
          >
            {showProvisionForm ? <FiX /> : <FiPlus />}
            {showProvisionForm ? 'Close form' : 'New account'}
          </button>
        </div>

        {showProvisionForm ? (
          <form
            className="admin-provision-panel"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateManagedAccount();
            }}
          >
            <div className="admin-provision-panel__heading">
              <span>Create internal identity</span>
              <small>Credentials and workspace access are applied immediately.</small>
            </div>

            <div className="admin-provision-panel__grid">
              <label className="admin-form-field">
                <span>Full name</span>
                <input
                  value={accountForm.name}
                  placeholder="Employee name"
                  onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })}
                  className="admin-form-input"
                />
              </label>

              <label className="admin-form-field">
                <span>Email</span>
                <div>
                  <input
                    type="email"
                    value={accountForm.email}
                    placeholder="name@company.com"
                    onChange={(event) => {
                      setAccountForm({ ...accountForm, email: event.target.value });
                      setAccountFormTouched((current) => ({ ...current, email: true }));
                      if (error) setError('');
                    }}
                    onBlur={() => setAccountFormTouched((current) => ({ ...current, email: true }))}
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={Boolean(normalizedAccountEmail) && !emailRegex.test(normalizedAccountEmail)}
                    className="admin-form-input"
                  />
                  {showEmailValidationMessage ? <p className="admin-form-error">{emailValidationMessage}</p> : null}
                </div>
              </label>

              <label className="admin-form-field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={accountForm.phone}
                  placeholder="+91 98765 43210"
                  onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })}
                  autoComplete="tel"
                  className="admin-form-input"
                />
              </label>

              <label className="admin-form-field">
                <span>Auth key</span>
                <div>
                  <div className="relative">
                    <input
                      type={showAuthKey ? 'text' : 'password'}
                      value={accountForm.password}
                      placeholder="Strong auth key"
                      onChange={(event) => {
                        setAccountForm({ ...accountForm, password: event.target.value });
                        setAccountFormTouched((current) => ({ ...current, password: true }));
                        if (error) setError('');
                      }}
                      onBlur={() => setAccountFormTouched((current) => ({ ...current, password: true }))}
                      autoComplete="new-password"
                      minLength={8}
                      aria-invalid={Boolean(authKeyPolicyError)}
                      className="admin-form-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthKey((current) => !current)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
                      aria-label={showAuthKey ? 'Hide password' : 'Show password'}
                      title={showAuthKey ? 'Hide password' : 'Show password'}
                    >
                      {showAuthKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {showAuthKeyValidationMessage ? <p className="admin-form-error">{authKeyValidationMessage}</p> : null}
                </div>
              </label>

              <label className="admin-form-field">
                <span>Role assignment</span>
                <div className="relative">
                  <select
                    value={accountForm.role}
                    onChange={(event) => setAccountForm({ ...accountForm, role: event.target.value })}
                    className="admin-form-select"
                  >
                    {ADMIN_MANAGED_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                </div>
              </label>

              <label className="admin-form-field">
                <span>Department</span>
                <div className="relative">
                  <select
                    value={accountForm.department}
                    onChange={(event) => setAccountForm({ ...accountForm, department: event.target.value })}
                    className="admin-form-select"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                </div>
              </label>
            </div>

            <div className="admin-provision-panel__footer">
              <div className="admin-provision-panel__scope">
                State scope is fixed by Super Admin. New dashboard IDs inherit your assigned state automatically.
              </div>
              <button type="submit" disabled={busyAction === 'create-managed-account'} className="admin-primary-action">
                <FiPlus /> {busyAction === 'create-managed-account' ? 'Provisioning...' : 'Provision account'}
              </button>
            </div>
          </form>
        ) : null}

        <div className="admin-workforce-directory" role="table" aria-label="Internal workforce accounts">
          <div className="admin-workforce-directory__head" role="row">
            <span>Employee</span>
            <span>Access profile</span>
            <span>Department & scope</span>
            <span className="text-right">Actions</span>
          </div>
          {managedAccounts.length === 0 ? (
            <div className="admin-directory-empty">No internal workforce accounts provisioned yet.</div>
          ) : paginatedManagedAccounts.map((acc) => (
            <article key={acc.id} className="admin-workforce-row" role="row">
              <div className="admin-workforce-row__identity" role="cell">
                <strong>{acc.name}</strong>
                <span>{acc.email}</span>
                <small>ID {getManagementDisplayId(acc.id, acc.role)}</small>
              </div>
              <div className="admin-workforce-row__access" role="cell">
                <span className="admin-access-chip">{acc.role}</span>
                {acc.salesCode ? <small>Code {acc.salesCode}</small> : null}
              </div>
              <div className="admin-workforce-row__scope" role="cell">
                <strong>{acc.department || 'Operations'}</strong>
                <span>{Array.isArray(acc.assignedStates) && acc.assignedStates.length ? acc.assignedStates.join(', ') : 'Assigned operational scope'}</span>
              </div>
              <div className="admin-workforce-row__actions" role="cell">
                <button
                  type="button"
                  onClick={() => handleDeleteManagedAccount(acc.id)}
                  className="admin-icon-button admin-icon-button--danger"
                  title="Revoke access"
                  aria-label={`Revoke access for ${acc.name}`}
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-ops-pagination admin-ops-pagination--compact">
          <p>{managedAccounts.length} workforce account{managedAccounts.length === 1 ? '' : 's'}</p>
          <Pagination page={managedPage} totalPages={managedTotalPages} onChange={setManagedPage} />
        </div>
      </section>

      {/* Public Platform Users */}
      <section className="admin-ops-panel admin-security-panel min-h-[420px]">
        <div className="admin-security-panel__header">
          <div className="admin-security-panel__heading">
            <div className="admin-panel-heading">
              <span className="admin-panel-eyebrow">Public directory</span>
              <h2 className="admin-ops-panel-title">
                <FiUsers className="text-brand-500" /> Platform Security Database
              </h2>
              <p className="admin-ops-panel-note">Review public identities, employer context, access state, and account activity.</p>
            </div>
            <span className={`admin-directory-state${loading ? ' admin-directory-state--loading' : ''}`} role="status">
              {loading ? 'Updating records' : `${totalUsers} records`}
            </span>
          </div>

          <div className="admin-security-toolbar">
            <label className="admin-security-search">
              <span className="sr-only">Search platform users</span>
              <FiSearch aria-hidden="true" />
              <input
                value={filters.search}
                placeholder="Search name, email, phone, company, or role"
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setSecurityPage(1);
                    loadSecurityUsers({ ...filters, search: event.currentTarget.value }, 1);
                  }
                }}
                list="admin-security-user-suggestions"
                autoComplete="off"
              />
              <datalist id="admin-security-user-suggestions">
                {securitySearchSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </label>

            <div className="admin-security-toolbar__filters">
              <label className="admin-filter-field">
                <span>Role</span>
                <select 
                  value={filters.role} 
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                >
                  {ADMIN_USER_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FiChevronDown aria-hidden="true" />
              </label>

              <label className="admin-filter-field">
                <span>Status</span>
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="banned">Banned</option>
                </select>
                <FiChevronDown aria-hidden="true" />
              </label>

              <label className="admin-filter-field admin-filter-field--clearance">
                <span>HR clearance</span>
                <select
                  value={filters.hrClearance}
                  onChange={(e) => setFilters({ ...filters, hrClearance: e.target.value })}
                >
                  <option value="all">All HR Clearance</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
                <FiChevronDown aria-hidden="true" />
              </label>

              <button
                type="button"
                className="admin-filter-reset"
                disabled={!hasActiveSecurityFilters}
                onClick={() => {
                  setFilters(initialFilters);
                  setSecurityPage(1);
                }}
                title="Clear all filters"
              >
                <FiX aria-hidden="true" /> Clear
              </button>
            </div>
          </div>
        </div>

        <div className={`admin-user-directory${loading ? ' is-loading' : ''}`} role="table" aria-label="Platform users" aria-busy={loading}>
          {loading ? <span className="admin-directory-progress" aria-hidden="true" /> : null}
          <div className="admin-user-directory__head" role="row">
            <span>Account</span>
            <span>Company / posting context</span>
            <span>Access</span>
            <span>Activity</span>
            <span>Security controls</span>
          </div>

          {filteredSecurityUsers.length === 0 ? (
            <div className="admin-directory-empty">No users matched the current security filters.</div>
          ) : paginatedSecurityUsers.map((user) => {
            const normalizedRole = String(user.role || '').toLowerCase();
            const isHr = normalizedRole === 'hr' || normalizedRole === 'company_admin';
            const relationCompanies = user.companyRelations?.companies || user.company_relations?.companies || user.companyNames || user.company_names || [];
            const companyNames = [...new Set(
              (Array.isArray(relationCompanies) ? relationCompanies : [])
                .map((value) => String(value || '').trim())
                .filter(Boolean)
            )];
            const fallbackCompany = String(user.company || '').trim();
            if (isHr && fallbackCompany && !['employer', 'hhh jobs'].includes(fallbackCompany.toLowerCase()) && !companyNames.includes(fallbackCompany)) {
              companyNames.unshift(fallbackCompany);
            }
            const relation = user.companyRelations || user.company_relations || {};
            const postedJobCount = Number(relation.jobCount ?? user.postedJobCount ?? user.posted_job_count ?? 0);
            const postingCompanyCount = Number(relation.postedCompanyCount ?? relation.postedCompanies?.length ?? companyNames.length ?? 0);
            const isStatusBusy = busyAction === `status:${user.id}`;
            const isApprovalBusy = busyAction === `approval:${user.id}`;

            return (
              <article key={user.id} className="admin-user-row" role="row">
                <div className="admin-user-row__account" data-label="Account" role="cell">
                  <span className="admin-user-avatar" aria-hidden="true">{getUserInitials(user.name)}</span>
                  <div className="admin-user-row__account-copy">
                    <strong>{user.name || 'Unknown'}</strong>
                    <span title={user.email || 'No email'}>{user.email || 'No email'}</span>
                    <small>{user.contactNumber || user.phone || user.mobile || 'No contact number'}</small>
                  </div>
                </div>

                <div className="admin-user-row__company" data-label="Company / posting context" role="cell">
                  {isHr ? (
                    <CompanyContextSummary
                      companies={companyNames}
                      primaryCompany={companyNames[0]}
                      jobCount={postedJobCount}
                      postingCompanyCount={postingCompanyCount}
                    />
                  ) : (
                    <span className="admin-muted-value">Not applicable</span>
                  )}
                </div>

                <div className="admin-user-row__access" data-label="Access" role="cell">
                  <div className="admin-access-stack">
                    <span className="admin-role-chip">{user.role}</span>
                    <span className={`admin-status-chip border ${getStatusBadge(user.status || 'active')}`}>{user.status || 'Active'}</span>
                    {isHr ? (
                      <span className={`admin-status-chip border ${user.is_hr_approved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        {user.is_hr_approved ? <><FiCheckCircle /> Verified HR</> : <><FiShield /> HR pending</>}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="admin-user-row__activity" data-label="Activity" role="cell">
                  <div className="admin-date-pair">
                    <span>Onboarded</span>
                    <DateTimeCell
                      value={user.onboardingDate || user.createdAt || user.created_at}
                      className="admin-date-value"
                      dateClassName="admin-date-value__date"
                      timeClassName="admin-date-value__time"
                    />
                  </div>
                  <div className="admin-date-pair">
                    <span>Last active</span>
                    <DateTimeCell
                      value={user.lastActiveAt || user.last_login_at}
                      emptyLabel="Never logged in"
                      className="admin-date-value"
                      dateClassName="admin-date-value__date"
                      timeClassName="admin-date-value__time"
                    />
                  </div>
                </div>

                <div className="admin-user-row__actions" data-label="Security controls" role="cell">
                  {isHr ? (
                    <button
                      type="button"
                      disabled={isApprovalBusy}
                      onClick={() => handleHrApproval(user.id, !user.is_hr_approved)}
                      className="admin-control-button"
                    >
                      {user.is_hr_approved ? <FiShield /> : <FiCheckCircle />}
                      {isApprovalBusy ? 'Updating...' : user.is_hr_approved ? 'Revoke HR' : 'Verify HR'}
                    </button>
                  ) : null}
                  <label className="admin-status-control">
                    <span className="sr-only">Account status for {user.name || 'user'}</span>
                    <select
                      value={user.status || 'active'}
                      disabled={isStatusBusy}
                      onChange={(event) => handleStatusChange(user.id, event.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                      <option value="banned">Banned</option>
                    </select>
                    <FiChevronDown aria-hidden="true" />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
        <div className="admin-ops-pagination">
          <p className="admin-pagination-summary">
            Showing <strong>{paginatedSecurityUsers.length}</strong> of <strong>{totalUsers}</strong> users
          </p>
          <Pagination
            page={securityPage}
            totalPages={securityTotalPages}
            onChange={setSecurityPage}
            maxVisiblePages={5}
            scrollTarget=".admin-security-panel"
            className="admin-pagination-control"
          />
        </div>
      </section>

    </div>
  );
};

export default AdminUsersPage;
